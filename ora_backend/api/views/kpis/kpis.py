# api/views/kpis/kpis.py
from collections import Counter
from datetime import timedelta

from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.permissions.roles import IsCNOrACP
from core.models import Animateur, Mentor, Mentorat, MentoratFinancement, Pole, YoungRequest


DIPLOME_LABELS = {
    'CAP': 'CAP', 'BEP': 'BEP', 'BAC_PRO': 'Bac Pro', 'BAC_AUTRE': 'Bac (autre)',
    'BP': 'BP', 'BTS': 'BTS', 'DUT': 'DUT', 'LIC_PRO': 'Licence Pro',
    'BUT': 'BUT', 'MASTER': 'Master', 'DEA': 'DEA', 'DES': 'DES', 'ING': 'Ingénieur',
}


# ── Utilitaire filtre de période ─────────────────────────────────────────────
def _date_from(period: str):
    today = timezone.now().date()
    if period == 'semester':
        return today - timedelta(days=182)
    elif period == 'year':
        return today - timedelta(days=365)
    return None   # 'all' → pas de filtre


# ── Helpers profil jeunes ─────────────────────────────────────────────────────
def _compute_tranches_age(req_qs, today):
    tranches = {
        'moins_18': 0, 'annees_18_25': 0, 'annees_26_29': 0, 'plus_29': 0, 'inconnu': 0,
    }
    for bd in req_qs.values_list('birth_date', flat=True):
        if bd is None:
            tranches['inconnu'] += 1
            continue
        age = today.year - bd.year - (1 if (bd.month, bd.day) > (today.month, today.day) else 0)
        if age < 18:
            tranches['moins_18'] += 1
        elif age <= 25:
            tranches['annees_18_25'] += 1
        elif age <= 29:
            tranches['annees_26_29'] += 1
        else:
            tranches['plus_29'] += 1
    return tranches


def _compute_par_diplome(req_qs):
    return [
        {
            'code':  d['diplome_prepare'],
            'label': DIPLOME_LABELS.get(d['diplome_prepare'], d['diplome_prepare']),
            'count': d['count'],
        }
        for d in (
            req_qs.exclude(diplome_prepare='')
            .values('diplome_prepare')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
    ]


def _compute_financements(**filters):
    """Nombre de mentorats liés à chaque financement, pour le périmètre donné."""
    return list(
        MentoratFinancement.objects.filter(**filters)
        .values('financement__nom', 'financement__code', 'financement__type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )


def _compute_financements_par_association(**filters):
    """Croise financement × association pour un périmètre donné."""
    return list(
        MentoratFinancement.objects.filter(**filters)
        .values('financement__nom', 'mentorat__mentor__association__name')
        .annotate(count=Count('id'))
        .order_by('financement__nom')
    )


# =============================================================================
# KPIs PÔLE
# =============================================================================

class PoleKPIsView(APIView):
    """
    GET /api/kpis/pole/?period=semester|year|all
    Accessible : ACP (son pôle) ou CN (pole_id requis)
    """
    permission_classes = [IsAuthenticated, IsCNOrACP]

    def get(self, request):
        user    = request.user
        period  = request.query_params.get('period', 'year')
        pole_id = request.query_params.get('pole_id')

        if pole_id:
            # pole_id explicite → réservé au CN
            if not hasattr(user, 'cn_member'):
                return Response({"error": "Réservé au CN"}, status=403)
            try:
                pole = Pole.objects.get(id=pole_id)
            except Pole.DoesNotExist:
                return Response({"error": "Pôle introuvable"}, status=404)
        elif hasattr(user, 'animateur') and user.animateur.pole:
            # ACP (ou CN+ACP hybride) → utilise son propre pôle
            pole = user.animateur.pole
        elif hasattr(user, 'cn_member'):
            # CN pur sans pôle propre → pole_id obligatoire
            return Response({"error": "pole_id requis pour CN"}, status=400)
        else:
            return Response({"error": "Pas de pôle assigné"}, status=403)

        return Response(self._compute(pole, period))

    def _compute(self, pole, period):
        today     = timezone.now().date()
        date_from = _date_from(period)

        # ── Demandes (filtrées par période) ──────────────────────────────
        req_qs = YoungRequest.objects.filter(pole=pole)
        if date_from:
            req_qs = req_qs.filter(request_date__gte=date_from)

        total_demandes = req_qs.count()
        filles         = req_qs.filter(gender='F').count()
        garcons        = req_qs.filter(gender='M').count()
        autres         = req_qs.filter(gender='O').count()
        filles_pct     = round(filles  / total_demandes * 100, 1) if total_demandes else 0
        garcons_pct    = round(garcons / total_demandes * 100, 1) if total_demandes else 0

        # ── Demandes en attente (état actuel, sans filtre période) ────────
        demandes_en_attente   = YoungRequest.objects.filter(pole=pole, status__in=['NEW', 'PENDING']).count()
        urgences_non_traitees = YoungRequest.objects.filter(pole=pole, status__in=['NEW', 'PENDING'], urgency_level__gte=4).count()

        # ── Mentorats — état actuel ───────────────────────────────────────
        m_qs = Mentorat.objects.filter(pole=pole)
        mentorats_actifs  = m_qs.filter(status='ACTIVE').count()
        mentorats_pending = m_qs.filter(status='PENDING').count()
        alertes_rouges    = m_qs.filter(status='ACTIVE', alerte_rouge=True).count()

        # ── Mentorats clôturés dans la période ────────────────────────────
        closed_qs = m_qs.filter(status__in=['CLOSED', 'ABORTED'])
        if date_from:
            closed_qs = closed_qs.filter(closed_at__gte=date_from)
        mentorats_closes     = closed_qs.filter(status='CLOSED').count()
        mentorats_abandonnes = closed_qs.filter(status='ABORTED').count()
        termines_total       = mentorats_closes + mentorats_abandonnes
        taux_reussite        = round(mentorats_closes     / termines_total * 100, 1) if termines_total else 0
        taux_abandon         = round(mentorats_abandonnes / termines_total * 100, 1) if termines_total else 0

        # ── Mentors ───────────────────────────────────────────────────────
        mentors_qs         = Mentor.objects.filter(pole=pole, is_active=True)
        mentors_total      = mentors_qs.count()
        mentors_disponibles = mentors_qs.filter(disponibilite_reelle__gt=0).count()
        mentors_satures    = mentors_qs.filter(disponibilite_reelle=0).count()
        taux_saturation    = round(mentors_satures    / mentors_total * 100, 1) if mentors_total else 0
        capacite_restante  = mentors_qs.aggregate(s=Sum('disponibilite_reelle'))['s'] or 0

        # ── Taux de couverture (actifs / toutes demandes du pôle) ─────────
        total_all = YoungRequest.objects.filter(pole=pole).count()
        taux_couverture = round(mentorats_actifs / total_all * 100, 1) if total_all else 0

        # ── Durées & heures (calcul Python pour compatibilité multi-DB) ───
        mentorats_dates = list(
            m_qs.filter(assigned_at__isnull=False)
            .values('assigned_at', 'closed_at', 'status')
        )
        durees_mois = []
        heures_total = 0.0
        for m in mentorats_dates:
            end = m['closed_at'] or (today if m['status'] == 'ACTIVE' else None)
            if end and m['assigned_at']:
                jours = max(0, (end - m['assigned_at']).days)
                mois  = jours / 30.0
                durees_mois.append(mois)
                # Estimation : 4 h/mois (1 séance/semaine × 1 h en moyenne)
                heures_total += mois * 4

        duree_moyenne   = round(sum(durees_mois) / len(durees_mois), 1) if durees_mois else 0
        heures_cumulees = round(heures_total)

        # ── Délai moyen d'assignation (jours) ─────────────────────────────
        assign_data = list(
            Mentorat.objects.filter(pole=pole, assigned_at__isnull=False)
            .values('assigned_at', 'young_request__request_date')
        )
        delais = [
            (m['assigned_at'] - m['young_request__request_date']).days
            for m in assign_data
            if m['young_request__request_date'] and m['assigned_at']
            and m['assigned_at'] >= m['young_request__request_date']
        ]
        delai_moyen = round(sum(delais) / len(delais)) if delais else 0

        # ── Tranches d'âge (sur les demandes de la période) ─────────────────
        tranches_age = _compute_tranches_age(req_qs, today)

        # ── Par diplôme ───────────────────────────────────────────────────
        par_diplome = _compute_par_diplome(req_qs)

        # ── Par situation ─────────────────────────────────────────────────
        en_apprentissage = req_qs.filter(situation='apprentissage').count()
        en_recherche     = req_qs.filter(situation='recherche').count()

        # ── Financements du pôle ──────────────────────────────────────────
        financements_pole             = _compute_financements(mentorat__pole=pole)
        financements_par_association  = _compute_financements_par_association(mentorat__pole=pole)

        # ── Mentors par association ────────────────────────────────────────
        mentors_par_association = list(
            Mentor.objects.filter(pole=pole, is_active=True)
            .values('association__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # ── APs actifs (suivent au moins un mentorat actif) ───────────────
        aps_total  = Animateur.objects.filter(pole=pole, is_coordinator=False, is_active=True).count()
        aps_actifs = (
            m_qs.filter(status='ACTIVE', ap_responsable__isnull=False)
            .values('ap_responsable_id')
            .distinct()
            .count()
        )

        # ── Demandes sans mentor (urgences à traiter en priorité) ─────────
        urgences_details = list(
            YoungRequest.objects.filter(pole=pole, status__in=['NEW', 'PENDING'], urgency_level__gte=4)
            .order_by('-urgency_level', 'request_date')
            .values('first_name', 'last_name', 'city', 'urgency_level', 'request_date')[:5]
        )

        return {
            # ── Demandes (filtrées période) ──────────────
            "total_demandes":          total_demandes,
            "filles":                  filles,
            "garcons":                 garcons,
            "autres":                  autres,
            "filles_pct":              filles_pct,
            "garcons_pct":             garcons_pct,
            # ── File d'attente (absolu) ───────────────────
            "demandes_en_attente":     demandes_en_attente,
            "urgences_non_traitees":   urgences_non_traitees,
            "urgences_details":        urgences_details,
            # ── Mentorats (absolu) ────────────────────────
            "mentorats_actifs":        mentorats_actifs,
            "mentorats_pending":       mentorats_pending,
            "alertes_rouges_actives":  alertes_rouges,
            "mentorats_alertes_rouges": alertes_rouges,   # compat legacy
            # ── Mentorats terminés (filtrés période) ──────
            "mentorats_closes":        mentorats_closes,
            "mentorats_abandonnes":    mentorats_abandonnes,
            # ── Taux ─────────────────────────────────────
            "taux_reussite":           taux_reussite,
            "taux_abandon":            taux_abandon,
            "taux_couverture":         taux_couverture,
            "taux_saturation":         taux_saturation,
            # ── Mentors (absolu) ──────────────────────────
            "mentors_total":           mentors_total,
            "mentors_disponibles":     mentors_disponibles,
            "mentors_satures":         mentors_satures,
            "capacite_restante":       int(capacite_restante),
            # ── Performance ───────────────────────────────
            "duree_moyenne":           duree_moyenne,
            "heures_cumulees":         heures_cumulees,
            "delai_moyen":             delai_moyen,
            # ── APs ──────────────────────────────────────
            "aps_total":               aps_total,
            "aps_actifs":              aps_actifs,
            # ── Breakdown ────────────────────────────────
            "mentors_par_association": mentors_par_association,
            # ── Profil des jeunes ─────────────────────────
            "tranches_age":      tranches_age,
            "par_diplome":       par_diplome,
            "en_apprentissage":  en_apprentissage,
            "en_recherche":      en_recherche,
            # ── Financements ──────────────────────────────────
            "financements_pole":            financements_pole,
            "financements_par_association": financements_par_association,
        }


# =============================================================================
# KPIs NATIONAUX
# =============================================================================

class NationalKPIsView(APIView):
    """
    GET /api/kpis/national/?period=semester|year|all&pole_id=

    Sans pole_id : stats nationales enrichies + breakdown par pôle.
    Avec pole_id : stats détaillées du pôle (même format que PoleKPIsView).
    """
    permission_classes = [IsAuthenticated, IsCNOrACP]

    def get(self, request):
        period  = request.query_params.get('period', 'year')
        pole_id = request.query_params.get('pole_id')

        # Mode pôle spécifique : réservé au CN
        if pole_id:
            if not hasattr(request.user, 'cn_member'):
                return Response({"error": "Réservé au CN"}, status=403)
            try:
                pole = Pole.objects.get(id=pole_id)
            except Pole.DoesNotExist:
                return Response({"error": "Pôle introuvable"}, status=404)
            return Response(PoleKPIsView()._compute(pole, period))

        # Mode national
        today     = timezone.now().date()
        date_from = _date_from(period)

        youngs_qs    = YoungRequest.objects.all()
        if date_from:
            youngs_qs = youngs_qs.filter(request_date__gte=date_from)
        youngs_total = youngs_qs.count()
        filles       = youngs_qs.filter(gender='F').count()
        garcons      = youngs_qs.filter(gender='M').count()
        filles_pct   = round(filles  / youngs_total * 100, 1) if youngs_total else 0
        garcons_pct  = round(garcons / youngs_total * 100, 1) if youngs_total else 0

        # Mentorats terminés (filtrés par période)
        m_closed_qs      = Mentorat.objects.filter(status__in=['CLOSED', 'ABORTED'])
        if date_from:
            m_closed_qs  = m_closed_qs.filter(closed_at__gte=date_from)
        mentorats_closes     = m_closed_qs.filter(status='CLOSED').count()
        mentorats_abandonnes = m_closed_qs.filter(status='ABORTED').count()
        termines             = mentorats_closes + mentorats_abandonnes
        taux_reussite        = round(mentorats_closes     / termines * 100, 1) if termines else 0
        taux_abandon         = round(mentorats_abandonnes / termines * 100, 1) if termines else 0

        # État actuel (absolu)
        mentorats_actifs      = Mentorat.objects.filter(status='ACTIVE').count()
        mentorats_pending     = Mentorat.objects.filter(status='PENDING').count()
        alertes_rouges        = Mentorat.objects.filter(status='ACTIVE', alerte_rouge=True).count()
        demandes_en_attente   = YoungRequest.objects.filter(status__in=['NEW', 'PENDING']).count()
        urgences_non_traitees = YoungRequest.objects.filter(
            status__in=['NEW', 'PENDING'], urgency_level__gte=4
        ).count()

        mentors_total        = Mentor.objects.filter(is_active=True).count()
        mentors_dispo        = Mentor.objects.filter(is_active=True, disponibilite_reelle__gt=0).count()
        mentors_satures      = Mentor.objects.filter(is_active=True, disponibilite_reelle=0).count()
        capacite_totale_nat  = int(Mentor.objects.filter(is_active=True).aggregate(s=Sum('disponibilite_reelle'))['s'] or 0)
        poles_total          = Pole.objects.count()

        # ── Profil des jeunes (national) ──────────────────────────────────
        tranches_age_nat     = _compute_tranches_age(youngs_qs, today)
        par_diplome_nat      = _compute_par_diplome(youngs_qs)
        en_apprentissage_nat = youngs_qs.filter(situation='apprentissage').count()
        en_recherche_nat     = youngs_qs.filter(situation='recherche').count()
        jeunes_avec_diplome  = youngs_qs.exclude(diplome_prepare='').count()
        taux_diplome_nat     = round(jeunes_avec_diplome / youngs_total * 100, 1) if youngs_total else 0

        # ── Top 5 problématiques des mentorats (national) ─────────────────
        prob_counter = Counter()
        for codes in Mentorat.objects.values_list('problematiques', flat=True):
            if isinstance(codes, list):
                prob_counter.update(codes)
        problematiques_top5 = [
            {'code': code, 'count': count}
            for code, count in prob_counter.most_common(5)
        ]

        # ── Performance globale (durée + délai) ───────────────────────────
        all_mentorats_dates = list(
            Mentorat.objects.filter(assigned_at__isnull=False)
            .values('assigned_at', 'closed_at', 'status')
        )
        durees_mois_nat = []
        for m in all_mentorats_dates:
            end = m['closed_at'] or (today if m['status'] == 'ACTIVE' else None)
            if end and m['assigned_at']:
                jours = max(0, (end - m['assigned_at']).days)
                durees_mois_nat.append(jours / 30.0)
        duree_moyenne_nat = round(sum(durees_mois_nat) / len(durees_mois_nat), 1) if durees_mois_nat else 0

        all_assign_data = list(
            Mentorat.objects.filter(assigned_at__isnull=False)
            .values('assigned_at', 'young_request__request_date')
        )
        delais_nat = [
            (m['assigned_at'] - m['young_request__request_date']).days
            for m in all_assign_data
            if m['young_request__request_date'] and m['assigned_at']
            and m['assigned_at'] >= m['young_request__request_date']
        ]
        delai_moyen_nat = round(sum(delais_nat) / len(delais_nat)) if delais_nat else 0

        # ── Taux nationaux ────────────────────────────────────────────────
        taux_couverture_nat  = round(mentorats_actifs  / youngs_total * 100, 1) if youngs_total else 0
        taux_saturation_nat  = round(mentors_satures   / mentors_total * 100, 1) if mentors_total else 0
        taux_attente_nat     = round(demandes_en_attente / youngs_total * 100, 1) if youngs_total else 0

        # ── Financements (national) ───────────────────────────────────────
        financements_national = _compute_financements()

        # Breakdown par pôle
        poles    = Pole.objects.all().order_by('name')
        par_pole = []
        for p in poles:
            p_req    = YoungRequest.objects.filter(pole=p)
            p_m      = Mentorat.objects.filter(pole=p)
            p_actifs = p_m.filter(status='ACTIVE').count()
            p_closed = p_m.filter(status__in=['CLOSED', 'ABORTED'])
            if date_from:
                p_closed = p_closed.filter(closed_at__gte=date_from)
            p_closes   = p_closed.filter(status='CLOSED').count()
            p_termines = p_closed.count()
            par_pole.append({
                "id":                  p.id,
                "name":                p.name,
                "code":                p.code,
                "total_demandes":      p_req.count(),
                "mentorats_actifs":    p_actifs,
                "mentors_total":       Mentor.objects.filter(pole=p, is_active=True).count(),
                "alertes_rouges":      p_m.filter(status='ACTIVE', alerte_rouge=True).count(),
                "taux_reussite":       round(p_closes / p_termines * 100, 1) if p_termines else 0,
                "demandes_en_attente": p_req.filter(status__in=['NEW', 'PENDING']).count(),
            })

        return Response({
            "poles_total":            poles_total,
            "total_jeunes":           youngs_total,
            "filles_pct":             filles_pct,
            "garcons_pct":            garcons_pct,
            "mentorats_actifs":       mentorats_actifs,
            "mentorats_pending":      mentorats_pending,
            "mentorats_closes":       mentorats_closes,
            "mentorats_abandonnes":   mentorats_abandonnes,
            "mentors_total":          mentors_total,
            "mentors_dispo":          mentors_dispo,
            "mentors_satures":        mentors_satures,
            "taux_reussite":          taux_reussite,
            "taux_abandon":           taux_abandon,
            "demandes_en_attente":      demandes_en_attente,
            "urgences_non_traitees":    urgences_non_traitees,
            "alertes_rouges_actives":   alertes_rouges,
            "capacite_totale_nationale": capacite_totale_nat,
            "par_pole":                 par_pole,
            # ── Performance globale ───────────────────────
            "duree_moyenne":          duree_moyenne_nat,
            "delai_moyen":            delai_moyen_nat,
            "taux_couverture":        taux_couverture_nat,
            "taux_saturation":        taux_saturation_nat,
            "taux_attente":           taux_attente_nat,
            # ── Profil des jeunes ─────────────────────────
            "tranches_age":           tranches_age_nat,
            "par_diplome":            par_diplome_nat,
            "en_apprentissage":       en_apprentissage_nat,
            "en_recherche":           en_recherche_nat,
            "taux_diplome":           taux_diplome_nat,
            "problematiques_top5":    problematiques_top5,
            # ── Financements ──────────────────────────────
            "financements_national":  financements_national,
        })
