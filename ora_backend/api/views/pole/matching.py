from django.db import transaction, IntegrityError
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from core.models import YoungRequest, Mentor, Mentorat, MatchingDecision, Animateur
from core.services.matching import get_mentor_suggestions
from api.permissions import IsACP, CanMatchRequest


class MatchingSuggestionsView(APIView):
    """
    ACP : Suggestions de mentors pour une demande.
    Voir tous les mentors du pôle (toutes associations).
    """
    permission_classes = [IsAuthenticated, IsACP, CanMatchRequest]

    def get(self, request, request_id):
        young_request = get_object_or_404(YoungRequest, id=request_id)
        self.check_object_permissions(request, young_request)

        suggestions = get_mentor_suggestions(young_request)

        data = []
        for s in suggestions:
            mentor = s["mentor"]
            data.append({
                "mentor_id":            mentor.id,
                "mentor_name":          f"{mentor.first_name} {mentor.last_name}",
                "association":          mentor.association.name,
                "association_id":       mentor.association_id,
                "city":                 mentor.city,
                "department":           mentor.department.name if mentor.department else None,
                "is_trained":           mentor.is_trained,
                "disponibilite_reelle": mentor.disponibilite_reelle,
                "max_capacity":         mentor.max_capacity,
                "nb_termines":          mentor.closed_mentorats,
                "score":                s["score"],
                "city_match":           s["city_match"],
                "department_match":     s["department_match"],
                "priority":             "high" if s["score"] >= 80 else "medium",
            })

        data.sort(key=lambda x: -x['score'])

        # Infos établissement de la demande
        etab_nom = (
            young_request.etablissement.nom
            if young_request.etablissement_id
            else young_request.nom_etablissement
        )
        return Response({
            "demande": {
                "id":              young_request.id,
                "jeune":           f"{young_request.first_name} {young_request.last_name}",
                "etablissement":   etab_nom or '',
                "diplome_prepare": young_request.get_diplome_prepare_display() if young_request.diplome_prepare else '',
                "situation":       young_request.get_situation_display() if young_request.situation else '',
                "pole":            young_request.pole.name if young_request.pole else None,
            },
            "suggestions": data[:10],
            "stats": {
                "total_disponibles": len(data),
                "score_eleve":       len([d for d in data if d['score'] >= 80]),
            }
        })


class AssignMentorView(APIView):
    """
    ACP : Assigne un mentor à une demande jeune.
    - Validation stricte avant création
    - Capture IntegrityError pour doublon
    - ap_id optionnel : si absent, AP auto (même association)
    """
    permission_classes = [IsAuthenticated, IsACP, CanMatchRequest]

    @transaction.atomic
    def post(self, request):
        data = request.data
        required = ['mentor_id', 'request_id']

        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {"error": f"Champs manquants : {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mentor_id   = data['mentor_id']
        request_id  = data['request_id']
        ap_id       = data.get('ap_id')
        justification = data.get('justification', '')
        ai_score    = data.get('ai_score')

        # ── Récupération des objets ──────────────────────────────
        try:
            mentor = (
                Mentor.objects
                .select_related('association', 'pole')
                .get(id=mentor_id)
            )
        except Mentor.DoesNotExist:
            return Response({"error": "Mentor introuvable"}, status=status.HTTP_404_NOT_FOUND)

        try:
            young_request = (
                YoungRequest.objects
                .select_related('pole')
                .get(id=request_id)
            )
        except YoungRequest.DoesNotExist:
            return Response({"error": "Demande introuvable"}, status=status.HTTP_404_NOT_FOUND)

        # ── Permissions objet ────────────────────────────────────
        self.check_object_permissions(request, young_request)

        # ── Vérification pôle ────────────────────────────────────
        user_pole_id = getattr(getattr(request.user, 'animateur', None), 'pole_id', None)
        if user_pole_id and mentor.pole_id != user_pole_id:
            return Response(
                {"error": "Ce mentor n'est pas dans votre pôle"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # ── Vérification capacité ────────────────────────────────
        if mentor.disponibilite_reelle <= 0:
            return Response(
                {"error": f"Ce mentor est complet (capacité max : {mentor.max_capacity})"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Vérification doublon ─────────────────────────────────
        if Mentorat.objects.filter(young_request=young_request).exists():
            # Corrige l'incohérence en base
            if young_request.status in ('NEW', 'PENDING'):
                young_request.status = 'ASSIGNED'
                young_request.save()
            return Response(
                {"error": "Cette demande a déjà un mentor assigné"},
                status=status.HTTP_409_CONFLICT,
            )

        # ── AP responsable ───────────────────────────────────────
        ap_responsable = self._get_ap_responsable(request, mentor, ap_id)
        if not ap_responsable:
            return Response(
                {
                    "error": "Aucun AP disponible pour le suivi de cette association",
                    "code": "NO_AP_AVAILABLE",
                    "mentor_association": mentor.association.name,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Création du mentorat ─────────────────────────────────
        try:
            mentorat = Mentorat.objects.create(
                mentor=mentor,
                young_request=young_request,
                ap_responsable=ap_responsable,
                pole=mentor.pole,
                status='ACTIVE',
                assigned_at=timezone.now().date(),
            )
        except IntegrityError:
            return Response(
                {"error": "Cette demande a déjà un mentor assigné (conflit base de données)"},
                status=status.HTTP_409_CONFLICT,
            )

        # ── Mises à jour ─────────────────────────────────────────
        mentor.disponibilite_reelle -= 1
        mentor.save()

        young_request.status = 'ASSIGNED'
        young_request.save()

        # ── Audit (ne bloque jamais l'assignation) ───────────────
        if ai_score is not None:
            try:
                MatchingDecision.objects.create(
                    young_request=young_request,
                    mentor=mentor,
                    decided_by=request.user,
                    ai_score=int(ai_score),
                    overridden=bool(justification),
                    justification=justification or '',
                )
            except Exception:
                pass

        return Response(
            {
                "success": True,
                "mentorat_id": mentorat.id,
                "details": {
                    "mentor": {
                        "id":          mentor.id,
                        "name":        f"{mentor.first_name} {mentor.last_name}",
                        "association": mentor.association.name,
                    },
                    "jeune": {
                        "id":   young_request.id,
                        "name": f"{young_request.first_name} {young_request.last_name}",
                    },
                    "ap_suivi": {
                        "id":          ap_responsable.id,
                        "name":        f"{ap_responsable.first_name} {ap_responsable.last_name}",
                        "association": ap_responsable.association.name,
                    },
                },
                "message": (
                    f"Mentorat créé. "
                    f"{ap_responsable.first_name} ({ap_responsable.association.name}) "
                    f"assure le suivi."
                ),
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Helpers ──────────────────────────────────────────────────
    def _get_ap_responsable(self, request, mentor, ap_id=None):
        """Détermine l'AP responsable.
        1) ap_id fourni manuellement → on le valide
        2) Sinon : AP de l'association du mentor dans le même pôle
        """
        user = request.user

        if ap_id:
            try:
                ap = Animateur.objects.get(id=ap_id, is_coordinator=False, is_active=True)
                if hasattr(user, 'animateur') and ap.pole_id != user.animateur.pole_id:
                    return None
                return ap
            except Animateur.DoesNotExist:
                return None

        return Animateur.objects.filter(
            association=mentor.association,
            pole=mentor.pole,
            is_coordinator=False,
            is_active=True,
        ).first()
