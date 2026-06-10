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
def compute_inactivite_level(last_suivi, dernier_contact=None):
    """Retourne le niveau d'alerte basé sur la dernière date de contact effective."""
    candidates = [d for d in [last_suivi, dernier_contact] if d is not None]
    last_date = max(candidates) if candidates else None
    if last_date is None:
        return 'ok'
    jours = (date.today() - last_date).days
    if jours >= SEUIL_ALERTE_JOURS:
        return 'alert'
    if jours >= SEUIL_WARN_JOURS:
        return 'warn'
    return 'ok'


def bulk_stats_par_association(pole, seuil_date):
    """
    Calcule les stats pour toutes les associations d'un pôle en 4 requêtes globales
    (au lieu de 4 requêtes × N associations).
    Retourne un dict { association_id: stats_dict }.
    """
    # 1. Mentors actifs par association
    mentors_qs = (
        Mentor.objects.filter(pole=pole, is_active=True)
        .values('association_id')
        .annotate(
            total=Count('id'),
            disponibles=Count('id', filter=Q(disponibilite_reelle__gt=0)),
            capacite_dispo=Sum('disponibilite_reelle'),
        )
    )
    mentor_stats = {row['association_id']: row for row in mentors_qs}

    # 2. Mentorats actifs + alertes par association
    mentorat_qs = (
        Mentorat.objects.filter(pole=pole, status='ACTIVE')
        .values('mentor__association_id')
        .annotate(
            actifs=Count('id'),
            alertes=Count('id', filter=Q(alerte_rouge=True)),
        )
    )
    mentorat_stats = {row['mentor__association_id']: row for row in mentorat_qs}

    # 3. Mentors inactifs par association (contact effectif < seuil)
    # Source 1 : dernière rencontre enregistrée (SuiviMentorat)
    last_suivi_map: dict[int, tuple[date, int]] = {}  # mentor_id -> (last_date, assoc_id)
    for row in (
        SuiviMentorat.objects.filter(
            mentorat__pole=pole,
            mentorat__status='ACTIVE',
        )
        .values('mentorat__mentor_id', 'mentorat__mentor__association_id')
        .annotate(last=Max('date_rencontre'))
    ):
        mid = row['mentorat__mentor_id']
        aid = row['mentorat__mentor__association_id']
        last_suivi_map[mid] = (row['last'], aid)

    # Source 2 : dernier_contact déclaré sur le Mentorat
    last_contact_map: dict[int, tuple[date, int]] = {}  # mentor_id -> (last_date, assoc_id)
    for row in (
        Mentorat.objects.filter(
            pole=pole,
            status='ACTIVE',
            dernier_contact__isnull=False,
        )
        .values('mentor_id', 'mentor__association_id', 'dernier_contact')
    ):
        mid = row['mentor_id']
        aid = row['mentor__association_id']
        dc  = row['dernier_contact']
        if mid not in last_contact_map or dc > last_contact_map[mid][0]:
            last_contact_map[mid] = (dc, aid)

    inactifs_by_assoc: dict[int, int] = {}
    all_mentor_ids = set(last_suivi_map) | set(last_contact_map)
    for mid in all_mentor_ids:
        entries = [e for e in [last_suivi_map.get(mid), last_contact_map.get(mid)] if e is not None]
        if not entries:
            continue
        effective_last, aid = max(entries, key=lambda x: x[0])
        if effective_last < seuil_date:
            inactifs_by_assoc[aid] = inactifs_by_assoc.get(aid, 0) + 1

    # Consolide en un dict par association_id
    all_ids = set(mentor_stats) | set(mentorat_stats) | set(inactifs_by_assoc)
    result = {}
    for aid in all_ids:
        ms = mentor_stats.get(aid, {})
        mt = mentorat_stats.get(aid, {})
        result[aid] = {
            'total_mentors':       ms.get('total', 0),
            'mentors_disponibles': ms.get('disponibles', 0),
            'capacite_dispo':      ms.get('capacite_dispo', 0) or 0,
            'mentorats_actifs':    mt.get('actifs', 0),
            'alertes_rouges':      mt.get('alertes', 0),
            'mentors_inactifs':    inactifs_by_assoc.get(aid, 0),
        }
    return result


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
    Accessible uniquement aux ACP (is_acp=True) et CN.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        animateur = _get_animateur(user)

        # ── Contrôle d'accès ──────────────────────────────────
        is_cn = hasattr(user, 'cn_member')
        is_animateur = animateur and animateur.is_active

        if not is_animateur and not is_cn:
            return Response(
                {'error': 'Accès réservé aux animateurs et CN.'},
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

        # ── APs du pôle ───────────────────────────────────────
        aps_qs = Animateur.objects.filter(
            pole=pole, is_ap=True, is_active=True
        ).select_related('association')

        # Index AP par association_id pour lookup rapide
        ap_by_asso = {ap.association_id: ap for ap in aps_qs}

        # ── Stats globales pôle ───────────────────────────────
        all_mentors = Mentor.objects.filter(pole=pole, is_active=True)
        total_mentors       = all_mentors.count()
        mentors_disponibles = all_mentors.filter(disponibilite_reelle__gt=0).count()
        capacite_dispo_total = all_mentors.aggregate(total=Sum('disponibilite_reelle'))['total'] or 0

        mentorats_actifs_total = Mentorat.objects.filter(
            pole=pole, status='ACTIVE'
        ).count()

        alertes_rouges_total = Mentorat.objects.filter(
            pole=pole, status='ACTIVE', alerte_rouge=True
        ).count()

        # Mentors inactifs total : fusion SuiviMentorat + dernier_contact
        _last_suivi = {
            row['mentorat__mentor_id']: row['last']
            for row in SuiviMentorat.objects.filter(
                mentorat__mentor__pole=pole,
                mentorat__status='ACTIVE',
            ).values('mentorat__mentor_id').annotate(last=Max('date_rencontre'))
        }
        _last_contact: dict = {}
        for row in Mentorat.objects.filter(
            mentor__pole=pole,
            status='ACTIVE',
            dernier_contact__isnull=False,
        ).values('mentor_id', 'dernier_contact'):
            mid = row['mentor_id']
            dc  = row['dernier_contact']
            if mid not in _last_contact or dc > _last_contact[mid]:
                _last_contact[mid] = dc
        mentors_inactifs_total = 0
        for mid in set(_last_suivi) | set(_last_contact):
            candidates = [d for d in [_last_suivi.get(mid), _last_contact.get(mid)] if d]
            if candidates and max(candidates) < seuil_date:
                mentors_inactifs_total += 1

        demandes_en_attente_total = YoungRequest.objects.filter(
            pole=pole, status__in=['NEW', 'PENDING']
        ).count()

        # ── Stats par association (bulk, 4 requêtes pour tout le pôle) ──
        stats_by_assoc = bulk_stats_par_association(pole, seuil_date)

        # ── Sérialisation des associations ────────────────────
        associations_data = []
        for asso in associations_qs:
            ap = ap_by_asso.get(asso.id)
            asso_stats = stats_by_assoc.get(asso.id, {
                'total_mentors': 0, 'mentors_disponibles': 0, 'capacite_dispo': 0,
                'mentorats_actifs': 0, 'alertes_rouges': 0, 'mentors_inactifs': 0,
            })
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
        ).select_related('etablissement').order_by('-created_at')[:20]

        demandes_data = [
            {
                'id':               d.id,
                'nom':              f"{d.first_name} {d.last_name}",
                'first_name':       d.first_name,
                'last_name':        d.last_name,
                'email':            d.email,
                'phone':            d.phone,
                'birth_date':       str(d.birth_date) if d.birth_date else '',
                'gender':           d.gender,
                'gender_label':     {'M': 'Garçon', 'F': 'Fille', 'O': 'Autre'}.get(d.gender, ''),
                'commune':          d.commune if hasattr(d, 'commune') else d.city,
                'code_postal':      d.code_postal if hasattr(d, 'code_postal') else '',
                'city':             d.city,
                'needs_description': d.needs_description,
                'status':           d.status,
                'request_date':     d.request_date,
                'nom_etablissement': d.etablissement.nom if d.etablissement_id else d.nom_etablissement,
                'diplome_prepare':  d.diplome_prepare,
                'diplome_label':    d.get_diplome_prepare_display() if d.diplome_prepare else '',
                'situation':        d.situation,
                'situation_label':  d.get_situation_display() if d.situation else '',
                'raison_transfert': d.raison_transfert if hasattr(d, 'raison_transfert') else '',
            }
            for d in demandes_qs
        ]

        # ── Réponse ───────────────────────────────────────────
        return Response({
            'coordinateur': {
                'id':         animateur.id if animateur else None,
                'first_name': animateur.first_name if animateur else user.first_name,
                'last_name':  animateur.last_name if animateur else user.last_name,
                'role':       'ACP' if (animateur and animateur.is_acp) else 'AP',
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
                'mentors_disponibles':   capacite_dispo_total,
                'mentorats_actifs':      mentorats_actifs_total,
                'alertes_rouges':        alertes_rouges_total,
                'mentors_inactifs':      mentors_inactifs_total,
                'demandes_en_attente':   demandes_en_attente_total,
            },
            'associations':       associations_data,
            'demandes_en_attente': demandes_data,
        })
