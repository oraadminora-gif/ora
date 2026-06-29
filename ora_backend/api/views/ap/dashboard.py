# api/views/ap/dashboard.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Sum, Max, Q
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)

from core.models import Mentor, Mentorat, SuiviMentorat, YoungRequest, EvaluationMentor, Etablissement, Financement, MentoratFinancement
from core.models.mentorat import CLOSURE_REASON_CHOICES
from api.permissions import IsAP, IsACP, IsCN

# ─────────────────────────────────────────────────────────────
# CONSTANTES
# ─────────────────────────────────────────────────────────────
SEUIL_ALERTE_JOURS = 30   # Pas de contact depuis X jours → alerte
SEUIL_WARN_JOURS   = 21   # Pas de contact depuis X jours → avertissement


def _is_ap_or_acp(user):
    """Retourne True si l'user est AP ou ACP (animateur actif)."""
    return hasattr(user, 'animateur') and user.animateur.is_active


def _get_animateur(user):
    """Raccourci sécurisé."""
    return getattr(user, 'animateur', None)


# ─────────────────────────────────────────────────────────────
# SÉRIALISATION
# ─────────────────────────────────────────────────────────────
def serialize_suivi_stats(mentorat):
    """Stats rencontres pour un mentorat (1 requête). Utiliser bulk_suivi_stats() en boucle."""
    agg = SuiviMentorat.objects.filter(mentorat=mentorat).aggregate(
        nb=Count('id'),
        total_minutes=Sum('duree_minutes'),
        last_date=Max('date_rencontre'),
    )
    nb    = agg['nb'] or 0
    total = agg['total_minutes'] or 0
    last  = agg['last_date']
    return {
        'nb_rencontres':  nb,
        'total_minutes':  total,
        'total_heures':   round(total / 60, 1),
        'last_rencontre': last,
    }


def bulk_suivi_stats(mentorat_ids: list) -> dict:
    """
    Calcule les stats de suivi pour une liste de mentorats en UNE seule requête GROUP BY.
    Retourne { mentorat_id: stats_dict }.
    """
    if not mentorat_ids:
        return {}
    rows = (
        SuiviMentorat.objects.filter(mentorat_id__in=mentorat_ids)
        .values('mentorat_id')
        .annotate(
            nb=Count('id'),
            total_minutes=Sum('duree_minutes'),
            last_date=Max('date_rencontre'),
        )
    )
    result = {}
    for row in rows:
        nb = row['nb'] or 0
        total = row['total_minutes'] or 0
        result[row['mentorat_id']] = {
            'nb_rencontres':  nb,
            'total_minutes':  total,
            'total_heures':   round(total / 60, 1),
            'last_rencontre': row['last_date'],
        }
    empty = {'nb_rencontres': 0, 'total_minutes': 0, 'total_heures': 0.0, 'last_rencontre': None}
    for mid in mentorat_ids:
        result.setdefault(mid, dict(empty))
    return result


def compute_inactivite(last_suivi, dernier_contact=None):
    """
    Retourne le nombre de jours sans contact et le niveau d'alerte.
    level: 'ok' | 'warn' | 'alert'
    Prend en compte à la fois last_suivi (SuiviMentorat) et dernier_contact (champ Mentorat).
    """
    candidates = [d for d in [last_suivi, dernier_contact] if d is not None]
    last_date = max(candidates) if candidates else None

    if last_date is None:
        return {'jours': None, 'level': 'ok'}  # Pas encore de contact → pas d'alerte

    jours = (date.today() - last_date).days
    if jours >= SEUIL_ALERTE_JOURS:
        level = 'alert'
    elif jours >= SEUIL_WARN_JOURS:
        level = 'warn'
    else:
        level = 'ok'
    return {'jours': jours, 'level': level}


_STATUS_LABELS = {
    'PENDING': 'En attente',
    'ACTIVE':  'Actif',
    'CLOSED':  'Clôturé',
    'ABORTED': 'Abandonné',
}


def serialize_mentorat_for_ap(m: Mentorat, precomputed_stats: dict | None = None):
    """Sérialise un mentorat pour la vue AP (lecture seule).
    precomputed_stats : dict retourné par bulk_suivi_stats(), évite 1 requête par appel."""
    stats = precomputed_stats if precomputed_stats is not None else serialize_suivi_stats(m)
    inactivite = compute_inactivite(stats['last_rencontre'], m.dernier_contact)

    young = m.young_request
    return {
        'id':           m.id,
        'status':       m.status,
        'date_debut':   m.assigned_at,
        'alerte_rouge': m.alerte_rouge,
        'inactivite':   inactivite,
        'jeune': {
            'id':                young.id,
            'name':              f"{young.first_name} {young.last_name}",
            'email':             young.email,
            'phone':             young.phone,
            'city':              young.city,
            'needs_description': young.needs_description,
        } if young else None,
        'suivi_stats': stats,
    }


def serialize_mesmentorat(m: Mentorat, precomputed_stats: dict | None = None):
    """Sérialise un mentorat du point de vue de l'AP qui en est responsable."""
    stats = precomputed_stats if precomputed_stats is not None else serialize_suivi_stats(m)
    inactivite = compute_inactivite(stats['last_rencontre'], m.dernier_contact)
    mentor = m.mentor
    young = m.young_request
    return {
        'id':           m.id,
        'status':       m.status,
        'status_label': _STATUS_LABELS.get(m.status, m.status),
        'assigned_at':  m.assigned_at,
        'alerte_rouge': m.alerte_rouge,
        'inactivite':   inactivite,
        'mentor': {
            'id':          mentor.id,
            'name':        f"{mentor.first_name} {mentor.last_name}",
            'association': mentor.association.name,
            'city':        mentor.city,
            'is_trained':  mentor.is_trained,
        },
        'jeune': {
            'name':              f"{young.first_name} {young.last_name}",
            'phone':             young.phone or '',
            'city':              young.city,
            'diplome_label':     young.get_diplome_prepare_display() if young.diplome_prepare else '',
            'situation':         young.situation or '',
            'situation_label':   young.get_situation_display() if young.situation else '',
            'etablissement_id':  young.etablissement_id,
            'nom_etablissement': (
                young.etablissement.nom if young.etablissement_id else young.nom_etablissement
            ) or '',
            'needs_description': young.needs_description or '',
        } if young else None,
        'objectif_mentor': m.objectif_mentor or '',
        'suivi_stats': stats,
        # Demande de clôture en attente
        'cloture_en_attente':         m.cloture_en_attente,
        'cloture_action_demandee':    m.cloture_action_demandee,
        'cloture_reason_demandee':    m.cloture_reason_demandee,
        'cloture_message_demandee':   m.cloture_message_demandee,
    }


def serialize_mentor_for_ap(mentor: Mentor):
    """
    Sérialise un mentor avec ses mentorats actifs et ses stats.
    Inclut le calcul d'alerte d'inactivité.
    Utilise bulk_suivi_stats pour éviter N requêtes de suivi.
    """
    mentorats_actifs = list(
        Mentorat.objects.filter(mentor=mentor, status='ACTIVE')
        .select_related('young_request', 'young_request__etablissement')
    )
    nb_termines = Mentorat.objects.filter(
        mentor=mentor, status__in=['CLOSED', 'ABORTED']
    ).count()

    # Stats suivi en une seule requête pour tous les mentorats actifs
    suivi_map = bulk_suivi_stats([m.id for m in mentorats_actifs])

    # Dernière activité globale = max entre les rencontres enregistrées et les dernier_contact
    all_dates = [
        d
        for m in mentorats_actifs
        for d in [suivi_map.get(m.id, {}).get('last_rencontre'), m.dernier_contact]
        if d is not None
    ]
    global_last = max(all_dates) if all_dates else None
    global_inactivite = compute_inactivite(global_last)

    return {
        'id':           mentor.id,
        'first_name':   mentor.first_name,
        'last_name':    mentor.last_name,
        'email':        mentor.email,
        'phone':        mentor.phone,
        'city':         mentor.city,
        'is_trained':   mentor.is_trained,
        'is_active':    mentor.is_active,
        'capacite': {
            'max':        mentor.max_capacity,
            'disponible': mentor.disponibilite_reelle,
            'utilisee':   mentor.max_capacity - mentor.disponibilite_reelle,
        },
        'derniere_activite': {
            'date':  global_last,
            **global_inactivite,
        },
        'mentorats_actifs': [
            serialize_mentorat_for_ap(m, suivi_map.get(m.id)) for m in mentorats_actifs
        ],
        'nb_mentorats_actifs':   len(mentorats_actifs),
        'nb_mentorats_termines': nb_termines,
    }


# ─────────────────────────────────────────────────────────────
# VUE 1 : Dashboard AP
# ─────────────────────────────────────────────────────────────
class APDashboardView(APIView):
    """
    Dashboard de l'AP : vue de son association.
    Accessible aussi par ACP (is_acp=True) et CN.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        animateur = _get_animateur(user)

        # ── Contrôle d'accès ──────────────────────────────────
        if not animateur and not hasattr(user, 'cn_member'):
            return Response(
                {'error': 'Accès réservé aux animateurs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # ── Scope association ──────────────────────────────────
        # AP/ACP : leur association, restreinte à leur pôle
        # CN     : doit passer ?association_id= (pas de pôle)
        if animateur:
            association = animateur.association
            scope_pole  = animateur.pole          # restreindre au pôle de l'AP
        else:
            # CN : doit passer ?association_id=
            association_id = request.query_params.get('association_id')
            if not association_id:
                return Response(
                    {'error': 'Paramètre association_id requis pour CN.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            from core.models import Association
            try:
                association = Association.objects.get(id=association_id)
            except Association.DoesNotExist:
                return Response({'error': 'Association introuvable.'}, status=status.HTTP_404_NOT_FOUND)
            scope_pole = None  # CN : pas de restriction de pôle

        # ── Mentors de l'association (dans le pôle pour AP/ACP) ──
        mentor_filter: dict = {'association': association, 'is_active': True}
        mentorat_filter: dict = {'mentor__association': association, 'status': 'ACTIVE'}
        if scope_pole:
            mentor_filter['pole']         = scope_pole
            mentorat_filter['mentor__pole'] = scope_pole

        mentors = Mentor.objects.filter(**mentor_filter).select_related('department')

        # ── Agrégats globaux ──────────────────────────────────
        total_mentors       = mentors.count()
        mentors_disponibles = mentors.filter(disponibilite_reelle__gt=0).count()
        mentorats_actifs    = Mentorat.objects.filter(**mentorat_filter).count()

        # Alertes actives (flag rouge)
        alertes_rouges = Mentorat.objects.filter(**mentorat_filter, alerte_rouge=True).count()

        seuil_date = date.today() - timedelta(days=SEUIL_ALERTE_JOURS)

        # Dernière rencontre enregistrée par mentor (via SuiviMentorat)
        suivi_q: dict = {'mentorat__mentor__association': association, 'mentorat__status': 'ACTIVE'}
        if scope_pole:
            suivi_q['mentorat__mentor__pole'] = scope_pole

        last_suivi_by_mentor = {
            row['mentorat__mentor_id']: row['last']
            for row in SuiviMentorat.objects.filter(**suivi_q)
            .values('mentorat__mentor_id').annotate(last=Max('date_rencontre'))
        }

        # Dernier contact déclaré par mentor (via champ Mentorat.dernier_contact)
        last_contact_by_mentor: dict = {}
        for row in Mentorat.objects.filter(
            **{**mentorat_filter, 'dernier_contact__isnull': False}
        ).values('mentor_id', 'dernier_contact'):
            mid = row['mentor_id']
            dc  = row['dernier_contact']
            if mid not in last_contact_by_mentor or dc > last_contact_by_mentor[mid]:
                last_contact_by_mentor[mid] = dc

        # Un mentor est inactif si son contact effectif le plus récent est avant le seuil
        # (on ne compte QUE les mentors qui ont au moins un contact enregistré d'une façon ou l'autre)
        mentors_inactifs_count = 0
        all_mentor_ids = set(last_suivi_by_mentor) | set(last_contact_by_mentor)
        for mid in all_mentor_ids:
            candidates = [d for d in [last_suivi_by_mentor.get(mid), last_contact_by_mentor.get(mid)] if d]
            effective_last = max(candidates) if candidates else None
            if effective_last is not None and effective_last < seuil_date:
                mentors_inactifs_count += 1

        # ── Sérialisation mentors ──────────────────────────────
        mentors_data = [serialize_mentor_for_ap(m) for m in mentors]

        # ── Tri : alertes en premier, puis warn, puis ok ───────
        level_order = {'alert': 0, 'warn': 1, 'ok': 2}
        mentors_data.sort(key=lambda m: level_order.get(m['derniere_activite']['level'], 3))

        # ── Mes mentorats — stats + clôtures en attente uniquement ──
        mes_mentorats_actifs_count  = 0
        mes_mentorats_clotures      = 0
        mes_mentorats_abandonnes    = 0
        mes_mentorats_total         = 0
        clotures_en_attente_count   = 0
        clotures_en_attente_data    = []

        if animateur and not animateur.is_acp:
            base_qs = Mentorat.objects.filter(ap_responsable=animateur)
            mes_mentorats_actifs_count  = base_qs.filter(status='ACTIVE').count()
            mes_mentorats_clotures      = base_qs.filter(status='CLOSED').count()
            mes_mentorats_abandonnes    = base_qs.filter(status='ABORTED').count()
            mes_mentorats_total         = (
                mes_mentorats_actifs_count + mes_mentorats_clotures + mes_mentorats_abandonnes
            )
            # Seules les clôtures en attente sont chargées intégralement (petit ensemble)
            pending_qs = (
                base_qs
                .filter(status='ACTIVE', cloture_en_attente=True)
                .select_related('mentor__association', 'young_request', 'young_request__etablissement')
                .order_by('-assigned_at')
            )
            clotures_en_attente_count = pending_qs.count()
            pending_list  = list(pending_qs)
            pending_suivi = bulk_suivi_stats([m.id for m in pending_list])
            clotures_en_attente_data = [
                serialize_mesmentorat(m, pending_suivi.get(m.id)) for m in pending_list
            ]

        return Response({
            'animateur': {
                'id':             animateur.id if animateur else None,
                'first_name':     animateur.first_name if animateur else user.first_name,
                'last_name':      animateur.last_name if animateur else user.last_name,
                'role':           ('ACP/AP' if (animateur and animateur.is_acp and animateur.is_ap)
                                   else ('ACP' if (animateur and animateur.is_acp) else 'AP')),
                'association': {
                    'id':   association.id,
                    'name': association.name,
                    'code': association.code,
                },
                'pole': {
                    'id':    animateur.pole.id   if animateur else None,
                    'name':  animateur.pole.name  if animateur else None,
                    'code':  animateur.pole.code  if animateur else None,
                    'villes': (animateur.pole.villes if (animateur and isinstance(animateur.pole.villes, list)) else []),
                },
            },
            'stats': {
                'total_mentors':              total_mentors,
                'mentors_disponibles':        mentors_disponibles,
                'mentorats_actifs':           mentorats_actifs,
                'alertes_rouges':             alertes_rouges,
                'mentors_inactifs':           mentors_inactifs_count,
                'mes_mentorats_actifs':       mes_mentorats_actifs_count,
                'mes_mentorats_clotures':     mes_mentorats_clotures,
                'mes_mentorats_abandonnes':   mes_mentorats_abandonnes,
                'mes_mentorats_total':        mes_mentorats_total,
                'clotures_en_attente':        clotures_en_attente_count,
            },
            'mentors':               mentors_data,
            'clotures_en_attente':   clotures_en_attente_data,
        })


# ─────────────────────────────────────────────────────────────
# VUE 1b : Mes mentorats — liste paginée
# ─────────────────────────────────────────────────────────────
class APMesMentorats(APIView):
    """
    GET /ap/mes-mentorats/
    Retourne la liste paginée des mentorats dont l'AP est responsable.

    Query params:
      status  : ACTIVE | CLOSED | ABORTED | all  (défaut: ACTIVE)
      search  : filtre texte (mentor, jeune)
      page    : numéro de page 1-based (défaut: 1)
      page_size: taille de page (défaut: 15, max: 50)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        animateur = _get_animateur(request.user)
        if not animateur:
            return Response({'error': 'Accès réservé aux animateurs.'}, status=403)

        status_filter = request.query_params.get('status', 'ACTIVE')
        search        = request.query_params.get('search', '').strip()
        try:
            page      = max(1, int(request.query_params.get('page', 1)))
            page_size = min(50, max(1, int(request.query_params.get('page_size', 15))))
        except (ValueError, TypeError):
            page, page_size = 1, 15

        qs = (
            Mentorat.objects
            .filter(ap_responsable=animateur)
            .select_related('mentor__association', 'young_request', 'young_request__etablissement')
        )

        if status_filter != 'all':
            qs = qs.filter(status=status_filter)

        if search:
            qs = qs.filter(
                Q(mentor__first_name__icontains=search) |
                Q(mentor__last_name__icontains=search)  |
                Q(young_request__first_name__icontains=search) |
                Q(young_request__last_name__icontains=search)  |
                Q(mentor__association__name__icontains=search)  |
                Q(mentor__city__icontains=search)
            )

        # Tri : actifs → alertes d'abord, puis date ; fermés → plus récent d'abord
        if status_filter == 'ACTIVE':
            qs = qs.order_by('-alerte_rouge', '-assigned_at')
        else:
            qs = qs.order_by('-assigned_at')

        total  = qs.count()
        offset = (page - 1) * page_size
        items  = list(qs[offset: offset + page_size])
        suivi_map = bulk_suivi_stats([m.id for m in items])

        return Response({
            'count':      total,
            'page':       page,
            'page_size':  page_size,
            'total_pages': max(1, (total + page_size - 1) // page_size),
            'has_next':   offset + page_size < total,
            'results':    [serialize_mesmentorat(m, suivi_map.get(m.id)) for m in items],
        })


# ─────────────────────────────────────────────────────────────
# VUE 1b : Export complet de tous les mentorats de l'AP
# ─────────────────────────────────────────────────────────────
class APMesMentoratExportView(APIView):
    """GET /ap/mes-mentorats/export/ — tous les mentorats avec tous les attributs."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        animateur = _get_animateur(request.user)
        if not animateur:
            return Response({'error': 'Accès refusé'}, status=403)

        date_debut = request.query_params.get('date_debut', '').strip()
        date_fin   = request.query_params.get('date_fin', '').strip()

        qs = (
            Mentorat.objects
            .filter(ap_responsable=animateur)
            .select_related(
                'mentor', 'mentor__association',
                'young_request', 'young_request__etablissement',
                'pole',
            )
            .prefetch_related('financements__financement')
            .order_by('-assigned_at')
        )

        if date_debut:
            qs = qs.filter(assigned_at__gte=date_debut)
        if date_fin:
            qs = qs.filter(assigned_at__lte=date_fin)

        suivi_map = bulk_suivi_stats([m.id for m in qs])

        rows = []
        for m in qs:
            mentor = m.mentor
            jr     = m.young_request
            stats  = suivi_map.get(m.id, {})
            financements = ', '.join(
                f"{mf.financement.nom} ({mf.financement.code})"
                for mf in m.financements.all()
            )
            problematiques_labels = ', '.join(m.problematiques) if m.problematiques else ''

            rows.append({
                # Mentorat
                'Statut':                m.get_status_display(),
                "Date d'affectation":    str(m.assigned_at) if m.assigned_at else '',
                'Date prévisionnelle fin': str(m.expected_end_date) if m.expected_end_date else '',
                'Date clôture':          str(m.closed_at) if m.closed_at else '',
                'Raison clôture':        m.get_closure_reason_code_display() if m.closure_reason_code else m.closure_reason,
                'Nb rencontres':         m.nb_rencontres,
                "Nb heures":             float(m.nb_heures),
                'Objectif mentor':       m.objectif_mentor,
                'Bilan suivi':           m.notes_suivi,
                'Problématiques':        problematiques_labels,
                'Financeur(s)':          financements,
                'Alerte rouge':          'Oui' if m.alerte_rouge else 'Non',
                # Mentor
                'Mentor Prénom':         mentor.first_name if mentor else '',
                'Mentor Nom':            mentor.last_name if mentor else '',
                'Mentor Email':          mentor.email if mentor else '',
                'Mentor Téléphone':      mentor.phone if mentor else '',
                'Mentor Ville':          mentor.city if mentor else '',
                'Mentor Association':    mentor.association.name if mentor else '',
                'Mentor Formé':          'Oui' if (mentor and mentor.is_trained) else 'Non',
                # Jeune
                'Jeune Prénom':          jr.first_name if jr else '',
                'Jeune Nom':             jr.last_name if jr else '',
                'Jeune Email':           jr.email if jr else '',
                'Jeune Téléphone':       jr.phone if jr else '',
                'Jeune Commune':         (jr.commune if hasattr(jr, 'commune') else jr.city) if jr else '',
                'Jeune Diplôme':         jr.get_diplome_prepare_display() if (jr and jr.diplome_prepare) else '',
                'Jeune Situation':       jr.get_situation_display() if (jr and jr.situation) else '',
                'Jeune Établissement':   (jr.etablissement.nom if jr.etablissement_id else jr.nom_etablissement) if jr else '',
                'Jeune Demande':         jr.needs_description if jr else '',
                # Stats suivi
                'Dernière rencontre':    str(stats.get('last_rencontre', '')) if stats.get('last_rencontre') else '',
            })

        return Response({'mentorats': rows, 'count': len(rows)})


# ─────────────────────────────────────────────────────────────
# VUE 2 : Détail d'un mentor (pour l'AP)
# ─────────────────────────────────────────────────────────────
class APMentorDetailView(APIView):
    """
    Détail complet d'un mentor, accessible par l'AP de son association,
    l'ACP du pôle ou CN.
    """
    permission_classes = [IsAuthenticated]

    def _check_access(self, request, mentor):
        user = request.user
        if hasattr(user, 'cn_member'):
            return True
        animateur = _get_animateur(user)
        if not animateur:
            return False
        # ACP : son pôle
        if animateur.is_acp:
            return mentor.pole_id == animateur.pole_id
        # AP : son association OU AP responsable d'au moins un mentorat de ce mentor
        if mentor.association_id == animateur.association_id:
            return True
        return Mentorat.objects.filter(mentor=mentor, ap_responsable=animateur).exists()

    def get(self, request, mentor_id):
        try:
            mentor = Mentor.objects.select_related(
                'association', 'pole', 'department'
            ).get(id=mentor_id)
        except Mentor.DoesNotExist:
            return Response({'error': 'Mentor introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._check_access(request, mentor):
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        # Déterminer le périmètre : même association → tout voir, sinon → seulement ses mentorats
        animateur = _get_animateur(request.user)
        same_assoc = (
            animateur is None  # CN
            or animateur.is_acp  # ACP voit tout
            or mentor.association_id == animateur.association_id
        )

        mentorat_qs_base = Mentorat.objects.filter(mentor=mentor)
        if not same_assoc and animateur:
            # AP d'une autre association : restreint à ses mentorats assignés
            mentorat_qs_base = mentorat_qs_base.filter(ap_responsable=animateur)

        # Mentorats actifs + historique (scope filtré)
        mentorats_actifs = list(
            mentorat_qs_base.filter(status='ACTIVE')
            .select_related('young_request', 'young_request__etablissement')
        )
        historique = list(
            mentorat_qs_base.filter(status__in=['CLOSED', 'ABORTED'])
            .select_related('young_request').order_by('-closed_at')[:10]
        )
        suivi_map      = bulk_suivi_stats([m.id for m in mentorats_actifs])
        hist_suivi_map = bulk_suivi_stats([m.id for m in historique])

        # serialize_mentor_for_ap refait ses propres requêtes (tous les mentorats),
        # on surcharge les clés liées au périmètre de l'AP
        mentor_data = serialize_mentor_for_ap(mentor)
        if not same_assoc:
            mentor_data['mentorats_actifs'] = [
                serialize_mentorat_for_ap(m, suivi_map.get(m.id)) for m in mentorats_actifs
            ]
            mentor_data['nb_mentorats_actifs'] = len(mentorats_actifs)

        return Response({
            'mentor': mentor_data,
            'historique': [
                {
                    'id':             m.id,
                    'jeune':          f"{m.young_request.first_name} {m.young_request.last_name}" if m.young_request else '—',
                    'statut_final':   m.status,
                    'date_fin':       m.closed_at,
                    'closure_reason': dict(CLOSURE_REASON_CHOICES).get(m.closure_reason, m.closure_reason),
                    'suivi_stats':    hist_suivi_map.get(m.id),
                }
                for m in historique
            ],
        })


# ─────────────────────────────────────────────────────────────
# VUE 3 : Signaler / Résoudre une alerte sur un mentorat
# ─────────────────────────────────────────────────────────────
class APMentoratAlerteView(APIView):
    """
    L'AP peut signaler ou résoudre une alerte rouge sur un mentorat
    de son association.
    POST { "action": "signaler" | "resoudre", "note": "..." }
    """
    permission_classes = [IsAuthenticated]

    def _check_access(self, request, mentorat):
        user = request.user
        if hasattr(user, 'cn_member'):
            return True
        animateur = _get_animateur(user)
        if not animateur:
            return False
        if animateur.is_acp:
            return mentorat.pole_id == animateur.pole_id
        # AP : son association OU AP responsable de ce mentorat
        return (mentorat.mentor.association_id == animateur.association_id or
                mentorat.ap_responsable_id == animateur.id)

    def post(self, request, mentorat_id):
        try:
            mentorat = Mentorat.objects.select_related('mentor').get(
                id=mentorat_id, status='ACTIVE'
            )
        except Mentorat.DoesNotExist:
            return Response({'error': 'Mentorat introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._check_access(request, mentorat):
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action')
        note   = request.data.get('note', '')

        if action == 'signaler':
            mentorat.alerte_rouge = True
            if note:
                prefix = f"[AP - {date.today()}] {note}\n"
                mentorat.notes_suivi = prefix + (mentorat.notes_suivi or '')
            mentorat.save()
            return Response({'success': True, 'alerte_rouge': True})

        elif action == 'resoudre':
            mentorat.alerte_rouge = False
            if note:
                prefix = f"[AP résolu - {date.today()}] {note}\n"
                mentorat.notes_suivi = prefix + (mentorat.notes_suivi or '')
            mentorat.save()
            return Response({'success': True, 'alerte_rouge': False})

        return Response({'error': 'action doit être "signaler" ou "resoudre".'}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────
# VUE 4 : Notes de suivi AP sur un mentorat
# ─────────────────────────────────────────────────────────────
class APMentoratNotesView(APIView):
    """
    PATCH : Ajoute/met à jour les notes de suivi de l'AP sur un mentorat.
    """
    permission_classes = [IsAuthenticated]

    def _check_access(self, request, mentorat):
        user = request.user
        if hasattr(user, 'cn_member'):
            return True
        animateur = _get_animateur(user)
        if not animateur:
            return False
        if animateur.is_acp:
            return mentorat.pole_id == animateur.pole_id
        # AP : son association OU AP responsable de ce mentorat
        return (mentorat.mentor.association_id == animateur.association_id or
                mentorat.ap_responsable_id == animateur.id)

    def patch(self, request, mentorat_id):
        try:
            mentorat = Mentorat.objects.select_related('mentor').get(id=mentorat_id)
        except Mentorat.DoesNotExist:
            return Response({'error': 'Mentorat introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._check_access(request, mentorat):
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        notes = request.data.get('notes_suivi')
        if notes is None:
            return Response({'error': 'Le champ notes_suivi est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        mentorat.notes_suivi = notes
        mentorat.save()
        return Response({'success': True, 'notes_suivi': mentorat.notes_suivi})


# ─────────────────────────────────────────────────────────────
# VUE 5 : Confirmer ou rejeter une demande de clôture (AP/ACP)
# ─────────────────────────────────────────────────────────────
class APConfirmerClotureView(APIView):
    """
    POST /ap/mentorats/{id}/confirmer-cloture/
    { "action": "confirm" | "reject" }

    AP ou ACP confirme ou rejette une demande de clôture émise par le mentor.
    Sur confirmation : clôture effective + email au jeune + création token évaluation.
    Sur rejet : réinitialise les flags, le mentorat reste ACTIVE.
    ACP peut accéder à tous les mentorats de son pôle (override).
    """
    permission_classes = [IsAuthenticated]

    def _check_access(self, request, mentorat):
        user = request.user
        animateur = _get_animateur(user)
        if not animateur:
            return False
        # ACP : son pôle entier
        if animateur.is_acp:
            return mentorat.pole_id == animateur.pole_id
        # AP : responsable de ce mentorat OU même association
        return (
            mentorat.ap_responsable_id == animateur.id or
            mentorat.mentor.association_id == animateur.association_id
        )

    def post(self, request, mentorat_id):
        try:
            mentorat = Mentorat.objects.select_related(
                'mentor', 'mentor__association', 'young_request', 'ap_responsable'
            ).get(id=mentorat_id, status='ACTIVE', cloture_en_attente=True)
        except Mentorat.DoesNotExist:
            return Response(
                {'error': 'Mentorat introuvable ou pas de demande de clôture en attente.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not self._check_access(request, mentorat):
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action')
        if action not in ('confirm', 'reject'):
            return Response(
                {'error': 'action doit être "confirm" ou "reject".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == 'reject':
            # Annuler la demande — le mentorat reste actif
            # On conserve cloture_reason_demandee et cloture_message_demandee en base
            message_jeune = request.data.get('message', mentorat.cloture_message_demandee)
            mentorat.cloture_en_attente = False
            mentorat.cloture_action_demandee = ''
            mentorat.save(update_fields=[
                'cloture_en_attente', 'cloture_action_demandee',
            ])
            # Envoyer le message au jeune même lors du rejet
            jeune = mentorat.young_request
            if message_jeune and jeune and jeune.email:
                try:
                    send_mail(
                        subject="Information concernant votre mentorat",
                        message=message_jeune,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[jeune.email],
                        fail_silently=False,
                    )
                except Exception as e:
                    logger.error("Email rejet clôture failed: %s", e)
            return Response({'success': True, 'action': 'rejected'})

        # ── Confirmer la clôture ──────────────────────────────
        statut_final  = mentorat.cloture_action_demandee or 'CLOSED'
        reason_code   = mentorat.cloture_reason_demandee
        reason        = dict(CLOSURE_REASON_CHOICES).get(reason_code, reason_code)   # code → libellé
        # L'AP peut passer un message personnalisé ; sinon on prend celui du mentor
        message_jeune = request.data.get('message', mentorat.cloture_message_demandee)

        # Effacer les flags + stocker le code de raison avant la clôture
        mentorat.cloture_en_attente = False
        mentorat.cloture_action_demandee = ''
        mentorat.cloture_reason_demandee = ''
        mentorat.cloture_message_demandee = ''
        mentorat.closure_reason_code = reason_code
        mentorat.save(update_fields=[
            'cloture_en_attente', 'cloture_action_demandee',
            'cloture_reason_demandee', 'cloture_message_demandee',
            'closure_reason_code',
        ])

        # Clôture effective (libère slot mentor + ferme demande)
        mentorat.cloturer(reason=reason, statut=statut_final)

        # Email de clôture au jeune
        jeune = mentorat.young_request
        if message_jeune and jeune and jeune.email:
            try:
                sujet = (
                    "Votre mentorat a été clôturé avec succès"
                    if statut_final == 'CLOSED'
                    else "Votre mentorat a pris fin"
                )
                send_mail(
                    subject=sujet,
                    message=message_jeune,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[jeune.email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error("Email clôture jeune failed: %s", e)

        # Créer le token d'évaluation et envoyer le lien au jeune
        if jeune and jeune.email:
            try:
                evaluation = EvaluationMentor.create_for_mentorat(mentorat)
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
                eval_link = f"{frontend_url}/evaluer-mentor/{evaluation.token}"
                mentor_nom = f"{mentorat.mentor.first_name} {mentorat.mentor.last_name}"
                eval_message = (
                    f"Bonjour {jeune.first_name},\n\n"
                    f"Votre mentorat avec {mentor_nom} est maintenant terminé.\n\n"
                    f"Nous vous serions reconnaissants de prendre quelques instants pour évaluer "
                    f"votre expérience en cliquant sur le lien suivant :\n\n"
                    f"{eval_link}\n\n"
                    f"Votre avis nous aide à améliorer la qualité de notre programme de mentorat.\n\n"
                    f"Merci,\nL'équipe ORA"
                )
                send_mail(
                    subject="Évaluez votre expérience de mentorat",
                    message=eval_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[jeune.email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error("Email évaluation failed: %s", e)

        return Response({
            'success':      True,
            'action':       'confirmed',
            'statut_final': statut_final,
        })


# ─────────────────────────────────────────────────────────────
# VUE 5b : Clôture directe par l'AP (sans passer par le mentor)
# ─────────────────────────────────────────────────────────────
class APCloturerDirectView(APIView):
    """
    POST /ap/mentorats/{id}/cloturer-direct/
    { "action": "CLOSED" | "ABORTED", "reason": "...", "message": "..." }

    L'AP ou l'ACP clôture directement un mentorat actif, sans attendre
    une demande du mentor. Envoie un email au jeune + crée le token d'évaluation.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, mentorat_id):
        animateur = _get_animateur(request.user)
        if not animateur:
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            mentorat = Mentorat.objects.select_related(
                'mentor', 'mentor__association', 'young_request', 'ap_responsable'
            ).get(id=mentorat_id, status='ACTIVE')
        except Mentorat.DoesNotExist:
            return Response(
                {'error': 'Mentorat introuvable ou déjà clôturé.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not _check_ap_mentorat_access(animateur, mentorat):
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action', 'CLOSED')
        if action not in ('CLOSED', 'ABORTED'):
            return Response(
                {'error': 'action doit être "CLOSED" ou "ABORTED".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason        = request.data.get('reason', '')
        message_jeune = request.data.get('message', '')

        # Clôture effective
        mentorat.cloturer(reason=reason, statut=action)

        # Email au jeune
        jeune = mentorat.young_request
        if message_jeune and jeune and jeune.email:
            try:
                sujet = (
                    "Votre mentorat a été clôturé avec succès"
                    if action == 'CLOSED'
                    else "Votre mentorat a pris fin"
                )
                send_mail(
                    subject=sujet,
                    message=message_jeune,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[jeune.email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error("Email clôture directe jeune failed: %s", e)

        # Token d'évaluation
        if jeune and jeune.email:
            try:
                evaluation = EvaluationMentor.create_for_mentorat(mentorat)
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
                eval_link    = f"{frontend_url}/evaluer-mentor/{evaluation.token}"
                mentor_nom   = f"{mentorat.mentor.first_name} {mentorat.mentor.last_name}"
                send_mail(
                    subject="Évaluez votre expérience de mentorat",
                    message=(
                        f"Bonjour {jeune.first_name},\n\n"
                        f"Votre mentorat avec {mentor_nom} est maintenant terminé.\n\n"
                        f"Nous vous serions reconnaissants de prendre quelques instants pour "
                        f"évaluer votre expérience :\n\n{eval_link}\n\n"
                        f"Merci,\nL'équipe ORA"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[jeune.email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error("Email évaluation clôture directe failed: %s", e)

        return Response({
            'success':      True,
            'statut_final': action,
        })


# ─────────────────────────────────────────────────────────────
# Helper suivi (même structure que dans mentor/dashboard.py)
# ─────────────────────────────────────────────────────────────
def _serialize_suivi(s):
    return {
        'id':                   s.id,
        'date_rencontre':       s.date_rencontre,
        'duree_minutes':        s.duree_minutes,
        'type_rencontre':       s.type_rencontre,
        'type_rencontre_label': s.get_type_rencontre_display(),
        'objectifs_atteints':   s.objectifs_atteints,
        'notes':                s.notes,
        'created_at':           s.created_at,
    }


def _check_ap_mentorat_access(animateur, mentorat):
    """True si l'animateur (AP ou ACP) peut accéder à ce mentorat."""
    if animateur.is_acp:
        return mentorat.pole_id == animateur.pole_id
    return (
        mentorat.mentor.association_id == animateur.association_id or
        mentorat.ap_responsable_id == animateur.id
    )


# ─────────────────────────────────────────────────────────────
# VUE 6 : Gestion des suivis (rencontres) par l'AP/ACP
# ─────────────────────────────────────────────────────────────
class APSuiviListCreateView(APIView):
    """
    GET  /ap/mentorats/{id}/suivis/  — liste des suivis du mentorat
    POST /ap/mentorats/{id}/suivis/  — créer un suivi
    Accessible par AP (association ou responsable) et ACP (pôle).
    """
    permission_classes = [IsAuthenticated]

    def _get_mentorat(self, request, mentorat_id):
        animateur = _get_animateur(request.user)
        if not animateur:
            return None, Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            mentorat = Mentorat.objects.select_related('mentor').get(id=mentorat_id)
        except Mentorat.DoesNotExist:
            return None, Response({'error': 'Mentorat introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if not _check_ap_mentorat_access(animateur, mentorat):
            return None, Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        return mentorat, None

    def get(self, request, mentorat_id):
        mentorat, err = self._get_mentorat(request, mentorat_id)
        if err:
            return err
        suivis = SuiviMentorat.objects.filter(mentorat=mentorat).order_by('-date_rencontre')
        return Response({
            'suivis':      [_serialize_suivi(s) for s in suivis],
            'suivi_stats': serialize_suivi_stats(mentorat),
        })

    def post(self, request, mentorat_id):
        mentorat, err = self._get_mentorat(request, mentorat_id)
        if err:
            return err
        if mentorat.status != 'ACTIVE':
            return Response({'error': "Ce mentorat n'est plus actif."}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        for field in ['date_rencontre', 'duree_minutes', 'type_rencontre']:
            if not data.get(field):
                return Response({"error": f"Le champ '{field}' est requis."}, status=status.HTTP_400_BAD_REQUEST)

        from datetime import datetime
        try:
            date_parsed = datetime.strptime(data['date_rencontre'], '%Y-%m-%d').date()
            if date_parsed > date.today():
                return Response({"error": "La date ne peut pas être dans le futur."}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({"error": "Format de date invalide (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)

        valid_types = [c[0] for c in SuiviMentorat.TYPE_CHOICES]
        if data['type_rencontre'] not in valid_types:
            return Response({"error": "Type de rencontre invalide."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            duree = int(data['duree_minutes'])
            if duree < 1:
                raise ValueError
        except (ValueError, TypeError):
            return Response({"error": "La durée doit être un entier positif."}, status=status.HTTP_400_BAD_REQUEST)

        suivi = SuiviMentorat.objects.create(
            mentorat=mentorat,
            date_rencontre=date_parsed,
            duree_minutes=duree,
            type_rencontre=data['type_rencontre'],
            objectifs_atteints=bool(data.get('objectifs_atteints', False)),
            notes=data.get('notes', ''),
        )
        mentorat.dernier_contact = date_parsed
        mentorat.save(update_fields=['dernier_contact'])
        return Response(_serialize_suivi(suivi), status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────
# VUE 7 : Modifier / supprimer un suivi (AP/ACP)
# ─────────────────────────────────────────────────────────────
class APSuiviDetailView(APIView):
    """
    PATCH  /ap/mentorats/{id}/suivis/{sid}/
    DELETE /ap/mentorats/{id}/suivis/{sid}/
    """
    permission_classes = [IsAuthenticated]

    def _get_suivi(self, request, mentorat_id, suivi_id):
        animateur = _get_animateur(request.user)
        if not animateur:
            return None, Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            suivi = SuiviMentorat.objects.select_related('mentorat__mentor').get(
                id=suivi_id, mentorat__id=mentorat_id
            )
        except SuiviMentorat.DoesNotExist:
            return None, Response({'error': 'Suivi introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if not _check_ap_mentorat_access(animateur, suivi.mentorat):
            return None, Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        return suivi, None

    def patch(self, request, mentorat_id, suivi_id):
        suivi, err = self._get_suivi(request, mentorat_id, suivi_id)
        if err:
            return err
        data = request.data
        if 'date_rencontre' in data:
            from datetime import datetime
            try:
                date_parsed = datetime.strptime(data['date_rencontre'], '%Y-%m-%d').date()
                if date_parsed > date.today():
                    return Response({"error": "La date ne peut pas être dans le futur."}, status=status.HTTP_400_BAD_REQUEST)
                suivi.date_rencontre = date_parsed
            except ValueError:
                return Response({"error": "Format de date invalide."}, status=status.HTTP_400_BAD_REQUEST)
        if 'duree_minutes'      in data: suivi.duree_minutes     = int(data['duree_minutes'])
        if 'type_rencontre'     in data: suivi.type_rencontre    = data['type_rencontre']
        if 'objectifs_atteints' in data: suivi.objectifs_atteints = bool(data['objectifs_atteints'])
        if 'notes'              in data: suivi.notes             = data['notes']
        suivi.save()
        return Response(_serialize_suivi(suivi))

    def delete(self, request, mentorat_id, suivi_id):
        suivi, err = self._get_suivi(request, mentorat_id, suivi_id)
        if err:
            return err
        suivi.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────
# VUE 8 : Modifier la situation / établissement du jeune (AP/ACP)
# ─────────────────────────────────────────────────────────────
class APUpdateJeuneView(APIView):
    """
    PATCH /ap/mentorats/{id}/jeune/
    L'AP ou l'ACP peut mettre à jour la situation et le nom de l'établissement du jeune.
    """
    permission_classes = [IsAuthenticated]

    def _check_access(self, request, mentorat):
        user = request.user
        animateur = _get_animateur(user)
        if not animateur:
            return False
        if animateur.is_acp:
            return mentorat.pole_id == animateur.pole_id
        return (
            mentorat.ap_responsable_id == animateur.id or
            mentorat.mentor.association_id == animateur.association_id
        )

    def patch(self, request, mentorat_id):
        try:
            mentorat = Mentorat.objects.select_related(
                'mentor', 'young_request', 'young_request__etablissement'
            ).get(id=mentorat_id)
        except Mentorat.DoesNotExist:
            return Response({'error': 'Mentorat introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._check_access(request, mentorat):
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        req = mentorat.young_request
        data = request.data

        # Champs texte simples
        for field in ('first_name', 'last_name', 'email', 'phone', 'needs_description'):
            if field in data:
                setattr(req, field, str(data[field]).strip())

        # Localisation
        for field in ('commune', 'code_postal', 'city'):
            if field in data:
                setattr(req, field, str(data[field]).strip())

        # Identité
        if 'birth_date' in data:
            req.birth_date = data['birth_date'] or None
        if 'gender' in data:
            req.gender = str(data['gender']).strip()

        # Formation
        if 'diplome_prepare' in data:
            req.diplome_prepare = str(data['diplome_prepare']).strip()

        if 'situation' in data:
            val = data['situation']
            if val not in ('apprentissage', 'recherche', ''):
                return Response({'error': 'Situation invalide.'}, status=status.HTTP_400_BAD_REQUEST)
            req.situation = val

        if 'etablissement_id' in data:
            etab_id = data['etablissement_id']
            if etab_id:
                if not Etablissement.objects.filter(id=etab_id, is_active=True).exists():
                    return Response({'error': 'Établissement introuvable.'}, status=status.HTTP_400_BAD_REQUEST)
                req.etablissement_id = etab_id
                req.nom_etablissement = ''
            else:
                req.etablissement_id = None
        elif 'nom_etablissement' in data:
            req.nom_etablissement = str(data['nom_etablissement']).strip()
            req.etablissement_id = None

        req.save()

        return Response({
            'first_name':        req.first_name,
            'last_name':         req.last_name,
            'email':             req.email,
            'phone':             req.phone,
            'birth_date':        str(req.birth_date) if req.birth_date else '',
            'gender':            req.gender,
            'gender_label':      {'M': 'Garçon', 'F': 'Fille', 'O': 'Autre'}.get(req.gender, ''),
            'commune':           req.commune if hasattr(req, 'commune') else req.city,
            'code_postal':       req.code_postal if hasattr(req, 'code_postal') else '',
            'city':              req.city,
            'diplome_prepare':   req.diplome_prepare,
            'diplome_label':     req.get_diplome_prepare_display() if req.diplome_prepare else '',
            'situation':         req.situation or '',
            'situation_label':   req.get_situation_display() if req.situation else '',
            'etablissement_id':  req.etablissement_id,
            'nom_etablissement': (req.etablissement.nom if req.etablissement_id else req.nom_etablissement) or '',
            'needs_description': req.needs_description,
        })


# ─────────────────────────────────────────────────────────────
# VUE 9 : Suivi avancé d'un mentorat (AP/ACP)
# Problématiques, dates, alerte rouge, infos jeune
# ─────────────────────────────────────────────────────────────
class APMentoratSuiviView(APIView):
    """
    GET  /ap/mentorats/{id}/suivi/  — détails suivi avancé
    PATCH /ap/mentorats/{id}/suivi/ — mise à jour (problématiques, dates, jeune…)
    Accessible par AP (association ou responsable) et ACP (pôle).
    """
    permission_classes = [IsAuthenticated]

    def _get_mentorat(self, request, mentorat_id):
        animateur = _get_animateur(request.user)
        if not animateur:
            return None, Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            mentorat = Mentorat.objects.select_related(
                'mentor', 'young_request', 'young_request__etablissement'
            ).get(id=mentorat_id)
        except Mentorat.DoesNotExist:
            return None, Response({'error': 'Mentorat introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if not _check_ap_mentorat_access(animateur, mentorat):
            return None, Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        return mentorat, None

    def _serialize(self, m):
        req = m.young_request
        return {
            'problematiques':    m.problematiques if isinstance(m.problematiques, list) else [],
            'dernier_contact':   m.dernier_contact,
            'expected_end_date': m.expected_end_date,
            'alerte_rouge':      m.alerte_rouge,
            'jeune_gender':           req.gender or '',
            'jeune_birth_date':        req.birth_date,
            'jeune_diplome_prepare':   req.diplome_prepare or '',
            'jeune_diplome_label':     req.get_diplome_prepare_display() if req.diplome_prepare else '',
            'jeune_situation':         req.situation or '',
            'jeune_situation_label':   req.get_situation_display() if req.situation else '',
            'jeune_etablissement_id':  req.etablissement_id,
            'jeune_nom_etablissement': (
                req.etablissement.nom if req.etablissement_id else req.nom_etablissement
            ) or '',
        }

    def get(self, request, mentorat_id):
        mentorat, err = self._get_mentorat(request, mentorat_id)
        if err:
            return err
        return Response(self._serialize(mentorat))

    def patch(self, request, mentorat_id):
        mentorat, err = self._get_mentorat(request, mentorat_id)
        if err:
            return err

        data = request.data
        animateur = _get_animateur(request.user)
        pole_id = animateur.pole_id

        # ── Champs mentorat ──────────────────────────────────────
        if 'problematiques' in data:
            val = data['problematiques']
            if not isinstance(val, list):
                return Response({"error": "problematiques doit être une liste."}, status=status.HTTP_400_BAD_REQUEST)
            if len(val) > 3:
                return Response({"error": "Maximum 3 problématiques autorisées."}, status=status.HTTP_400_BAD_REQUEST)
            mentorat.problematiques = val

        if 'alerte_rouge' in data:
            mentorat.alerte_rouge = bool(data['alerte_rouge'])

        if 'dernier_contact' in data:
            mentorat.dernier_contact = data['dernier_contact'] or None

        if 'expected_end_date' in data:
            mentorat.expected_end_date = data['expected_end_date'] or None

        mentorat.save()

        # ── Champs du jeune ──────────────────────────────────────
        req = mentorat.young_request
        req_updated = []

        if 'gender' in data:
            val = data['gender']
            if val not in ('M', 'F', 'O', ''):
                return Response({"error": "Genre invalide."}, status=status.HTTP_400_BAD_REQUEST)
            req.gender = val
            req_updated.append('gender')

        if 'birth_date' in data:
            req.birth_date = data['birth_date'] or None
            req_updated.append('birth_date')

        if 'diplome_prepare' in data:
            val = data['diplome_prepare']
            valid_codes = [c[0] for c in YoungRequest.DIPLOME_CHOICES]
            if val and val not in valid_codes:
                return Response({"error": "Diplôme invalide."}, status=status.HTTP_400_BAD_REQUEST)
            req.diplome_prepare = val
            req_updated.append('diplome_prepare')

        if 'situation' in data:
            val = data['situation']
            if val not in ('apprentissage', 'recherche', ''):
                return Response({"error": "Situation invalide."}, status=status.HTTP_400_BAD_REQUEST)
            req.situation = val
            req_updated.append('situation')

        if 'etablissement_id' in data:
            etab_id = data['etablissement_id']
            if etab_id:
                if not Etablissement.objects.filter(id=etab_id, pole_id=pole_id, is_active=True).exists():
                    return Response({"error": "Établissement introuvable dans ce pôle."}, status=status.HTTP_400_BAD_REQUEST)
                req.etablissement_id = etab_id
                req.nom_etablissement = ''
                req_updated.extend(['etablissement_id', 'nom_etablissement'])
            else:
                req.etablissement_id = None
                req_updated.append('etablissement_id')
        elif 'nom_etablissement' in data:
            req.nom_etablissement = str(data['nom_etablissement']).strip()
            req.etablissement_id = None
            req_updated.extend(['nom_etablissement', 'etablissement_id'])

        if req_updated:
            req.save(update_fields=list(set(req_updated)))

        mentorat.refresh_from_db()
        return Response(self._serialize(mentorat))


# ─────────────────────────────────────────────────────────────
# VUE 10 : Financements d'un mentorat (AP/ACP)
# ─────────────────────────────────────────────────────────────
class APMentoratFinancementsView(APIView):
    """
    GET  /ap/mentorats/{id}/financements/           — liste
    POST /ap/mentorats/{id}/financements/           — ajouter
    DELETE /ap/mentorats/{id}/financements/{mf_id}/ — supprimer
    """
    permission_classes = [IsAuthenticated]

    def _get_mentorat(self, request, mentorat_id):
        animateur = _get_animateur(request.user)
        if not animateur:
            return None, Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            mentorat = Mentorat.objects.select_related('mentor').get(id=mentorat_id)
        except Mentorat.DoesNotExist:
            return None, Response({'error': 'Mentorat introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if not _check_ap_mentorat_access(animateur, mentorat):
            return None, Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        return mentorat, None

    def _serialize_mf(self, mf):
        return {
            'id':               mf.id,
            'financement_id':   mf.financement_id,
            'financement_nom':  mf.financement.nom,
            'financement_code': mf.financement.code,
            'type':             mf.financement.type,
            'type_label':       mf.financement.get_type_display(),
            'code_specifique':  mf.code_specifique,
        }

    def get(self, request, mentorat_id):
        mentorat, err = self._get_mentorat(request, mentorat_id)
        if err:
            return err
        mfs = MentoratFinancement.objects.filter(mentorat=mentorat).select_related('financement')
        return Response({'financements': [self._serialize_mf(mf) for mf in mfs]})

    def post(self, request, mentorat_id):
        mentorat, err = self._get_mentorat(request, mentorat_id)
        if err:
            return err
        financement_id = request.data.get('financement_id')
        if not financement_id:
            return Response({'error': 'financement_id requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            financement = Financement.objects.get(pk=financement_id)
        except Financement.DoesNotExist:
            return Response({'error': 'Financement introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        code_specifique = request.data.get('code_specifique', '').strip()
        mf, created = MentoratFinancement.objects.get_or_create(
            mentorat=mentorat, financement=financement,
            defaults={'code_specifique': code_specifique},
        )
        if not created and code_specifique:
            mf.code_specifique = code_specifique
            mf.save()
        return Response(
            self._serialize_mf(mf),
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class APMentoratFinancementDeleteView(APIView):
    """DELETE /ap/mentorats/{id}/financements/{mf_id}/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, mentorat_id, mf_id):
        animateur = _get_animateur(request.user)
        if not animateur:
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            mentorat = Mentorat.objects.select_related('mentor').get(id=mentorat_id)
        except Mentorat.DoesNotExist:
            return Response({'error': 'Mentorat introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if not _check_ap_mentorat_access(animateur, mentorat):
            return Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            mf = MentoratFinancement.objects.get(pk=mf_id, mentorat=mentorat)
        except MentoratFinancement.DoesNotExist:
            return Response({'error': 'Financement introuvable sur ce mentorat.'}, status=status.HTTP_404_NOT_FOUND)
        mf.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────
# VUE 11 : Liste des établissements du pôle (AP/ACP)
# ─────────────────────────────────────────────────────────────
class APEtablissementsView(APIView):
    """
    GET  /ap/etablissements/  – liste des établissements du pôle de l'animateur (AP ou ACP)
    POST /ap/etablissements/  – créer un établissement dans le pôle
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        animateur = _get_animateur(request.user)
        if not animateur:
            return Response({'error': 'Pas de pôle'}, status=status.HTTP_400_BAD_REQUEST)
        etabs = Etablissement.objects.filter(
            pole_id=animateur.pole_id, is_active=True
        ).order_by('nom')
        return Response([
            {'id': e.id, 'nom': e.nom, 'code_postal': e.code_postal}
            for e in etabs
        ])

    def post(self, request):
        animateur = _get_animateur(request.user)
        if not animateur:
            return Response({'error': 'Pas de pôle'}, status=status.HTTP_400_BAD_REQUEST)
        nom = str(request.data.get('nom', '')).strip()
        if not nom:
            return Response({'error': 'Le nom est requis.'}, status=status.HTTP_400_BAD_REQUEST)
        code_postal = str(request.data.get('code_postal', '')).strip()
        etab = Etablissement.objects.create(
            nom=nom,
            code_postal=code_postal,
            pole_id=animateur.pole_id,
            is_active=True,
        )
        return Response(
            {'id': etab.id, 'nom': etab.nom, 'code_postal': etab.code_postal},
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────
# VUE 12 : Détail complet + suivi d'un mentorat (AP)
# ─────────────────────────────────────────────────────────────
class APMentoratSuiviDetailView(APIView):
    """
    GET   /ap/mentorats/{id}/suivi-detail/  – fiche complète (mentor, jeune, suivi)
    PATCH /ap/mentorats/{id}/suivi-detail/  – mettre à jour les champs de suivi
    POST  /ap/mentorats/{id}/suivi-detail/?action=cloturer – clôturer directement
    """
    permission_classes = [IsAuthenticated]

    def _get_mentorat(self, request, mentorat_id):
        animateur = _get_animateur(request.user)
        if not animateur:
            return None, None, Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            m = Mentorat.objects.select_related(
                'mentor', 'mentor__association', 'mentor__department',
                'young_request', 'young_request__etablissement',
                'ap_responsable', 'ap_responsable__association',
                'pole',
            ).get(id=mentorat_id)
        except Mentorat.DoesNotExist:
            return None, None, Response({'error': 'Mentorat introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if not _check_ap_mentorat_access(animateur, m):
            return None, None, Response({'error': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        return m, animateur, None

    def _serialize(self, m):
        from core.models.mentorat import PROBLEMATIQUES_CHOICES
        jr = m.young_request
        mentor = m.mentor
        ap = m.ap_responsable

        return {
            'id':           m.id,
            'status':       m.status,
            'status_label': m.get_status_display(),
            'assigned_at':  m.assigned_at,
            'expected_end_date': m.expected_end_date,
            'closed_at':    m.closed_at,
            'request_date': jr.request_date if jr else None,
            'alerte_rouge': m.alerte_rouge,

            # Raison de clôture
            'closure_reason_code':  m.closure_reason_code,
            'closure_reason_label': m.get_closure_reason_code_display() if m.closure_reason_code else '',
            'closure_reason':       m.closure_reason,

            # Demande de clôture par le mentor (en attente AP)
            'cloture_en_attente':        m.cloture_en_attente,
            'cloture_action_demandee':   m.cloture_action_demandee,
            'cloture_reason_demandee':   m.cloture_reason_demandee or '',
            'cloture_message_demandee':  m.cloture_message_demandee or '',

            # Suivi
            'nb_rencontres':   m.nb_rencontres,
            'nb_heures':       float(m.nb_heures),
            'objectif_mentor': m.objectif_mentor,
            'bilan_suivi':     m.notes_suivi,
            'problematiques':  m.problematiques,
            'type_mentorat':   m.type_mentorat,
            'type_mentorat_label': m.get_type_mentorat_display() if m.type_mentorat else '',

            # Choix disponibles
            'closure_reason_choices': [
                {'value': v, 'label': l} for v, l in CLOSURE_REASON_CHOICES
            ],
            'problematiques_choices': [
                {'value': v, 'label': l} for v, l in PROBLEMATIQUES_CHOICES
            ],

            # Mentor
            'mentor': {
                'id':          mentor.id,
                'first_name':  mentor.first_name,
                'last_name':   mentor.last_name,
                'email':       mentor.email,
                'phone':       mentor.phone,
                'city':        mentor.city,
                'code_postal': mentor.code_postal,
                'department':  mentor.department.label if mentor.department_id else '',
                'association': mentor.association.name,
                'is_trained':  mentor.is_trained,
                'training_date': str(mentor.training_date) if mentor.training_date else '',
                'observations': mentor.observations,
            } if mentor else None,

            # Jeune
            'jeune': {
                'first_name':       jr.first_name,
                'last_name':        jr.last_name,
                'email':            jr.email,
                'phone':            jr.phone,
                'birth_date':       str(jr.birth_date) if jr.birth_date else '',
                'gender':           jr.gender,
                'gender_label':     {'M': 'Garçon', 'F': 'Fille', 'O': 'Autre'}.get(jr.gender, ''),
                'commune':          jr.commune if hasattr(jr, 'commune') else jr.city,
                'code_postal':      jr.code_postal if hasattr(jr, 'code_postal') else '',
                'city':             jr.city,
                'diplome_prepare':  jr.diplome_prepare,
                'diplome_label':    jr.get_diplome_prepare_display() if jr.diplome_prepare else '',
                'situation':        jr.situation,
                'situation_label':  jr.get_situation_display() if jr.situation else '',
                'nom_etablissement': jr.etablissement.nom if jr.etablissement_id else jr.nom_etablissement,
                'needs_description': jr.needs_description,
                'request_date':     str(jr.request_date) if jr.request_date else '',
            } if jr else None,

            # AP responsable
            'ap_responsable': {
                'first_name': ap.first_name,
                'last_name':  ap.last_name,
                'email':      ap.email,
            } if ap else None,
        }

    def get(self, request, mentorat_id):
        try:
            m, _, err = self._get_mentorat(request, mentorat_id)
            if err:
                return err
            return Response(self._serialize(m))
        except Exception as exc:
            import traceback
            return Response(
                {'error': str(exc), 'detail': traceback.format_exc()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def patch(self, request, mentorat_id):
        try:
            m, _, err = self._get_mentorat(request, mentorat_id)
            if err:
                return err
            data = request.data

            if 'objectif_mentor' in data:
                m.objectif_mentor = data['objectif_mentor'] or ''
            if 'bilan_suivi' in data:
                m.notes_suivi = data['bilan_suivi'] or ''
            if 'expected_end_date' in data:
                val = data['expected_end_date']
                m.expected_end_date = val if val else None
            if 'nb_rencontres' in data:
                try:
                    m.nb_rencontres = max(0, int(data['nb_rencontres']))
                except (ValueError, TypeError):
                    pass
            if 'nb_heures' in data:
                try:
                    m.nb_heures = max(0, float(str(data['nb_heures']).replace(',', '.')))
                except (ValueError, TypeError):
                    pass
            if 'problematiques' in data:
                codes = data['problematiques']
                if isinstance(codes, list):
                    m.problematiques = codes
            if 'type_mentorat' in data:
                val = (data['type_mentorat'] or '').strip()
                if val in ('presentiel', 'distanciel', ''):
                    m.type_mentorat = val

            # Clôture directe
            if data.get('cloturer'):
                code = (data.get('closure_reason_code') or '').strip()
                closed_at_val = (data.get('closed_at') or '').strip()
                if not code:
                    return Response({'error': 'closure_reason_code requis.'}, status=400)
                if not closed_at_val:
                    return Response({'error': 'closed_at requis.'}, status=400)
                valid_codes = [v for v, _ in CLOSURE_REASON_CHOICES]
                if code not in valid_codes:
                    return Response({'error': 'Code de raison invalide.'}, status=400)
                reason_label = dict(CLOSURE_REASON_CHOICES).get(code, code)
                m.closure_reason_code = code
                m.save()
                m.cloturer(reason=reason_label, statut='CLOSED')
                # Respecte la date choisie par l'AP
                Mentorat.objects.filter(pk=m.pk).update(closed_at=closed_at_val)
                m.refresh_from_db()
                return Response(self._serialize(m))

            m.save()
            return Response(self._serialize(m))

        except Exception as exc:
            import traceback
            return Response(
                {'error': str(exc), 'detail': traceback.format_exc()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
