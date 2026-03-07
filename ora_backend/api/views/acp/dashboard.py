# api/views/acp/dashboard.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Sum, Max, Q
from django.utils import timezone
from datetime import date, timedelta

from core.models import (
    Animateur, Association, Mentor, Mentorat,
    SuiviMentorat, YoungRequest
)

# ─────────────────────────────────────────────────────────────
# CONSTANTES (identiques à la vue AP)
# ─────────────────────────────────────────────────────────────
SEUIL_ALERTE_JOURS = 30
SEUIL_WARN_JOURS   = 21


def _get_animateur(user):
    return getattr(user, 'animateur', None)


# ─────────────────────────────────────────────────────────────
# HELPERS DE CALCUL
# ─────────────────────────────────────────────────────────────
def compute_inactivite_level(last_date):
    """Retourne le niveau d'alerte basé sur la dernière date de rencontre."""
    if last_date is None:
        return 'ok'
    jours = (date.today() - last_date).days
    if jours >= SEUIL_ALERTE_JOURS:
        return 'alert'
    if jours >= SEUIL_WARN_JOURS:
        return 'warn'
    return 'ok'


def stats_pour_association(association, seuil_date):
    """
    Calcule les stats (mentors, mentorats, alertes) pour une association donnée.
    seuil_date : date limite en dessous de laquelle un mentor est considéré inactif.
    """
    mentors = Mentor.objects.filter(association=association, is_active=True)
    total_mentors       = mentors.count()
    mentors_disponibles = mentors.filter(disponibilite_reelle__gt=0).count()

    mentorats_actifs = Mentorat.objects.filter(
        mentor__association=association, status='ACTIVE'
    ).count()

    alertes_rouges = Mentorat.objects.filter(
        mentor__association=association,
        status='ACTIVE',
        alerte_rouge=True,
    ).count()

    # Mentors dont la dernière rencontre est trop ancienne
    inactifs = SuiviMentorat.objects.filter(
        mentorat__mentor__association=association,
        mentorat__status='ACTIVE',
    ).values('mentorat__mentor_id').annotate(
        last=Max('date_rencontre')
    ).filter(last__lt=seuil_date).count()

    return {
        'total_mentors':       total_mentors,
        'mentors_disponibles': mentors_disponibles,
        'mentorats_actifs':    mentorats_actifs,
        'alertes_rouges':      alertes_rouges,
        'mentors_inactifs':    inactifs,
    }


def serialize_ap(animateur):
    """Sérialise un AP pour la liste des associations."""
    if animateur is None:
        return None
    return {
        'id':         animateur.id,
        'first_name': animateur.first_name,
        'last_name':  animateur.last_name,
        'email':      animateur.email,
        'phone':      animateur.phone,
    }


# ─────────────────────────────────────────────────────────────
# VUE PRINCIPALE : Dashboard ACP
# ─────────────────────────────────────────────────────────────
class ACPDashboardView(APIView):
    """
    Dashboard de l'ACP : vue complète de son pôle.
    Accessible uniquement aux ACP (is_coordinator=True) et CN.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        animateur = _get_animateur(user)

        # ── Contrôle d'accès ──────────────────────────────────
        is_cn = hasattr(user, 'cn_member')
        is_acp = animateur and animateur.is_coordinator and animateur.is_active

        if not is_acp and not is_cn:
            return Response(
                {'error': 'Accès réservé aux ACP et CN.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # ── Scope pôle ────────────────────────────────────────
        if animateur:
            pole = animateur.pole
        else:
            # CN : doit passer ?pole_id=
            pole_id = request.query_params.get('pole_id')
            if not pole_id:
                return Response(
                    {'error': 'Paramètre pole_id requis pour CN.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            from core.models import Pole
            try:
                pole = Pole.objects.get(id=pole_id)
            except Pole.DoesNotExist:
                return Response({'error': 'Pôle introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        seuil_date = date.today() - timedelta(days=SEUIL_ALERTE_JOURS)

        # ── Associations présentes dans le pôle ───────────────
        # (via les animateurs et mentors qui leur appartiennent)
        associations_qs = Association.objects.filter(
            Q(animateurs__pole=pole) | Q(mentors__pole=pole),
            is_active=True
        ).distinct().prefetch_related('animateurs')

        # ── APs du pôle (is_coordinator=False) ───────────────
        aps_qs = Animateur.objects.filter(
            pole=pole, is_coordinator=False, is_active=True
        ).select_related('association')

        # Index AP par association_id pour lookup rapide
        ap_by_asso = {ap.association_id: ap for ap in aps_qs}

        # ── Stats globales pôle ───────────────────────────────
        all_mentors = Mentor.objects.filter(pole=pole, is_active=True)
        total_mentors       = all_mentors.count()
        mentors_disponibles = all_mentors.filter(disponibilite_reelle__gt=0).count()

        mentorats_actifs_total = Mentorat.objects.filter(
            pole=pole, status='ACTIVE'
        ).count()

        alertes_rouges_total = Mentorat.objects.filter(
            pole=pole, status='ACTIVE', alerte_rouge=True
        ).count()

        mentors_inactifs_total = SuiviMentorat.objects.filter(
            mentorat__mentor__pole=pole,
            mentorat__status='ACTIVE',
        ).values('mentorat__mentor_id').annotate(
            last=Max('date_rencontre')
        ).filter(last__lt=seuil_date).count()

        demandes_en_attente_total = YoungRequest.objects.filter(
            pole=pole, status__in=['NEW', 'PENDING']
        ).count()

        # ── Sérialisation des associations ────────────────────
        associations_data = []
        for asso in associations_qs:
            ap = ap_by_asso.get(asso.id)
            asso_stats = stats_pour_association(asso, seuil_date)
            associations_data.append({
                'id':    asso.id,
                'name':  asso.name,
                'code':  asso.code,
                'ap':    serialize_ap(ap),
                'stats': asso_stats,
            })

        # Tri : associations avec alertes en premier
        associations_data.sort(
            key=lambda a: (-(a['stats']['alertes_rouges']), -(a['stats']['mentors_inactifs']))
        )

        # ── Demandes en attente de matching ───────────────────
        demandes_qs = YoungRequest.objects.filter(
            pole=pole, status__in=['NEW', 'PENDING']
        ).select_related('etablissement').order_by('-urgency_level', '-created_at')[:20]

        demandes_data = [
            {
                'id':               d.id,
                'nom':              f"{d.first_name} {d.last_name}",
                'city':             d.city,
                'needs_description': d.needs_description,
                'urgency_level':    d.urgency_level,
                'status':           d.status,
                'request_date':     d.request_date,
                'nom_etablissement': d.etablissement.nom if d.etablissement_id else d.nom_etablissement,
                'diplome_prepare':  d.diplome_prepare,
                'diplome_label':    d.get_diplome_prepare_display() if d.diplome_prepare else '',
                'situation':        d.situation,
                'situation_label':  d.get_situation_display() if d.situation else '',
            }
            for d in demandes_qs
        ]

        # ── Réponse ───────────────────────────────────────────
        return Response({
            'coordinateur': {
                'id':         animateur.id if animateur else None,
                'first_name': animateur.first_name if animateur else user.first_name,
                'last_name':  animateur.last_name if animateur else user.last_name,
                'role':       'ACP',
                'pole': {
                    'id':   pole.id,
                    'name': pole.name,
                    'code': pole.code,
                    'villes': pole.villes if isinstance(pole.villes, list) else [],
                },
            },
            'stats': {
                'total_associations':    associations_qs.count(),
                'total_ap':              aps_qs.count(),
                'total_mentors':         total_mentors,
                'mentors_disponibles':   mentors_disponibles,
                'mentorats_actifs':      mentorats_actifs_total,
                'alertes_rouges':        alertes_rouges_total,
                'mentors_inactifs':      mentors_inactifs_total,
                'demandes_en_attente':   demandes_en_attente_total,
            },
            'associations':       associations_data,
            'demandes_en_attente': demandes_data,
        })
