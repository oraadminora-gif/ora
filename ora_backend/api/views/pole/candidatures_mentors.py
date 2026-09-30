# api/views/pole/candidatures_mentors.py
from django.utils import timezone
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from core.models import CandidatureMentor, Mentor, Association
from api.permissions import IsAnimateur


def _serialize_candidature(c):
    return {
        'id':            c.id,
        'first_name':    c.first_name,
        'last_name':     c.last_name,
        'email':         c.email,
        'phone':         c.phone,
        'code_postal':   c.code_postal,
        'commune':       c.commune,
        'pole_id':       c.pole_id,
        'pole_name':     c.pole.name if c.pole else None,
        'association_id':   c.association_id,
        'association_name': c.association.name if c.association else None,
        'experience_pro':   c.experience_pro,
        'domaines':         c.domaines,
        'disponibilite':    c.disponibilite,
        'motivation':       c.motivation,
        'statut':           c.statut,
        'statut_label':     c.get_statut_display(),
        'notes_rejet':      c.notes_rejet,
        'validated_by':     (
            f"{c.validated_by.first_name} {c.validated_by.last_name}"
            if c.validated_by else None
        ),
        'validated_at':  c.validated_at,
        'mentor_id':     c.mentor_created_id,
        'created_at':    c.created_at,
    }


class PoleCandidaturesMentorsView(APIView):
    """
    GET  /pole/candidatures-mentors/        — liste des candidatures du pôle
    Filtre : ACP → tout le pôle / AP → uniquement son association
    """
    permission_classes = [IsAuthenticated, IsAnimateur]

    def get(self, request):
        from django.db.models import Q

        anim = request.user.animateur
        qs = CandidatureMentor.objects.filter(
            pole_id=anim.pole_id
        ).select_related('pole', 'association', 'validated_by').order_by('-created_at')

        # AP : les candidatures de son association, + celles sans association
        # encore attribuée (à traiter : il peut alors se les attribuer).
        if not anim.is_acp:
            qs = qs.filter(Q(association_id=anim.association_id) | Q(association_id__isnull=True))

        statut = request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)

        return Response([_serialize_candidature(c) for c in qs])


class PoleCandidatureMentorActionView(APIView):
    """
    POST /pole/candidatures-mentors/{id}/valider/  — valide et crée le Mentor
    POST /pole/candidatures-mentors/{id}/rejeter/  — rejette avec note optionnelle
    """
    permission_classes = [IsAuthenticated, IsAnimateur]

    def post(self, request, pk, action):
        anim = request.user.animateur
        candidature = get_object_or_404(
            CandidatureMentor, pk=pk, pole_id=anim.pole_id
        )

        # AP : ne peut agir que sur son association, ou sur une candidature
        # qui n'a encore aucune association attribuée (il peut alors se
        # l'attribuer au moment de la validation).
        if not anim.is_acp and candidature.association_id not in (None, anim.association_id):
            return Response(
                {'detail': 'Vous ne pouvez agir que sur les candidatures de votre association.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if candidature.statut != 'PENDING':
            return Response(
                {'detail': 'Cette candidature a déjà été traitée.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == 'valider':
            return self._valider(request, candidature, anim)
        elif action == 'rejeter':
            return self._rejeter(request, candidature, anim)
        else:
            return Response({'detail': 'Action inconnue.'}, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def _valider(self, request, candidature, anim):
        """Crée un Mentor à partir de la candidature."""
        # Le pôle doit être connu (détecté au moment de la soumission)
        pole = candidature.pole or anim.pole
        association = candidature.association

        # Association pas encore attribuée : l'AP/ACP peut la choisir
        # maintenant plutôt que d'échouer la validation.
        if not association:
            association_id = request.data.get('association_id')
            if association_id:
                try:
                    association = Association.objects.get(id=association_id, is_active=True)
                except Association.DoesNotExist:
                    return Response(
                        {'detail': 'Association invalide.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                # AP : ne peut attribuer que sa propre association
                if not anim.is_acp and association.id != anim.association_id:
                    return Response(
                        {'detail': "Vous ne pouvez attribuer que votre propre association."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            elif not anim.is_acp:
                # AP sans choix explicite → sa propre association par défaut
                association = anim.association

        if not association:
            return Response(
                {
                    'detail': "Merci de sélectionner l'association du candidat avant de valider.",
                    'code': 'ASSOCIATION_REQUIRED',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        candidature.association = association

        mentor = Mentor.objects.create(
            pole          = pole,
            association   = association,
            first_name    = candidature.first_name,
            last_name     = candidature.last_name,
            email         = candidature.email,
            phone         = candidature.phone,
            code_postal   = candidature.code_postal,
            commune       = candidature.commune,
            max_capacity  = 1,
            disponibilite_reelle = 1,
            is_active     = True,
        )

        candidature.statut         = 'VALIDATED'
        candidature.validated_by   = anim
        candidature.validated_at   = timezone.now()
        candidature.mentor_created = mentor
        candidature.save()

        return Response({
            'detail':    'Candidature validée. Le mentor a été créé.',
            'mentor_id': mentor.id,
            'statut':    'VALIDATED',
        })

    def _rejeter(self, request, candidature, anim):
        notes = request.data.get('notes_rejet', '').strip()
        candidature.statut       = 'REJECTED'
        candidature.notes_rejet  = notes
        candidature.validated_by = anim
        candidature.validated_at = timezone.now()
        candidature.save()

        return Response({
            'detail': 'Candidature rejetée.',
            'statut': 'REJECTED',
        })
