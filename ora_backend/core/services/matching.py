# core/services/matching.py
"""
Algorithme de matching mentor / jeune.

Critères par ordre de priorité :

1️⃣  Équité associations      — poids max 150 pts  [PRINCIPAL]
    Favorise l'association qui a le moins de mentorats ACTIFS dans le pôle,
    afin d'équilibrer la charge entre les associations.

2️⃣  Distance GPS (Haversine) — poids max 100 pts
    Distance à vol d'oiseau entre le jeune et le mentor.

3️⃣  Disponibilité            — poids max  50 pts
    Nombre de places encore disponibles chez le mentor.

4️⃣  Formation récente        — poids max  40 pts
    Plus le mentor a été formé récemment, plus le bonus est élevé.
    Mentor formé il y a < 6 mois → 40 pts
    Mentor formé il y a < 12 mois → 30 pts
    Mentor formé il y a < 24 mois → 20 pts
    Mentor formé (sans date ou > 24 mois) → 10 pts
    Non formé → 0 pt

5️⃣  Expérience               — poids max  30 pts
    3 pts par mentorat clôturé, plafonné à 30 (10 mentorats).

Score total max : 370 pts
Seuil "priorité haute" : ≥ 200 pts
"""

from datetime import date

from django.db.models import Count, Q
from core.models import Mentor, Mentorat
from core.services.geocoding import ensure_coords, haversine_km


# ── Constantes géographiques ──────────────────────────────────────────────
DISTANCE_TRES_PROCHE_KM = 20
DISTANCE_PROCHE_KM      = 50
DISTANCE_ACCEPTABLE_KM  = 100
DISTANCE_LOINTAIN_KM    = 200

# ── Constantes d'équité ───────────────────────────────────────────────────
EQUITE_MAX_SCORE    = 150   # score pour l'association la moins chargée
EQUITE_PTS_PAR_ECART = 50  # points perdus par mentorat de différence avec le minimum

# ── Constantes de formation ───────────────────────────────────────────────
FORMATION_TRES_RECENTE_MOIS = 6
FORMATION_RECENTE_MOIS      = 12
FORMATION_ANCIENNE_MOIS     = 24


def _distance_score(distance_km: float) -> int:
    if distance_km < DISTANCE_TRES_PROCHE_KM:
        return 100
    if distance_km < DISTANCE_PROCHE_KM:
        return 75
    if distance_km < DISTANCE_ACCEPTABLE_KM:
        return 45
    if distance_km < DISTANCE_LOINTAIN_KM:
        return 20
    return 5


def _formation_score(mentor: Mentor) -> int:
    """
    Bonus selon l'ancienneté de la formation.
    Privilegié: mentor formé récemment.
    """
    if not mentor.is_trained:
        return 0
    if not mentor.training_date:
        return 10  # formé mais sans date précisée

    today = date.today()
    months_ago = (
        (today.year - mentor.training_date.year) * 12
        + (today.month - mentor.training_date.month)
    )
    if months_ago < FORMATION_TRES_RECENTE_MOIS:
        return 40
    if months_ago < FORMATION_RECENTE_MOIS:
        return 30
    if months_ago < FORMATION_ANCIENNE_MOIS:
        return 20
    return 10


def _equite_score(assoc_count: int, min_count: int) -> int:
    """
    Retourne le bonus d'équité pour une association.
    L'association avec le minimum de mentorats actifs reçoit EQUITE_MAX_SCORE.
    Chaque mentorat de plus que le minimum enlève EQUITE_PTS_PAR_ECART points.
    """
    delta = assoc_count - min_count
    return max(0, EQUITE_MAX_SCORE - delta * EQUITE_PTS_PAR_ECART)


def get_mentor_suggestions(young_request):
    """
    Retourne une liste de dicts triés par score décroissant,
    chacun décrivant un mentor compatible avec la demande.

    Chaque élément contient :
      mentor, score, distance_km, city_match, department_match,
      equite_score, assoc_count, assoc_min_count, formation_score,
      training_date, remaining_capacity
    """
    if not young_request.pole:
        return []

    # ── 0. Géocode le jeune si nécessaire ────────────────────────────────
    ensure_coords(young_request)

    # ── 1. Chargement des mentors éligibles ──────────────────────────────
    mentors = (
        Mentor.objects
        .filter(
            pole=young_request.pole,
            is_active=True,
            disponibilite_reelle__gt=0,
        )
        .select_related('association', 'department')
        .annotate(
            closed_mentorats=Count(
                'mentorats',
                filter=Q(mentorats__status='CLOSED'),
            )
        )
    )

    # ── 2. Calcul de la charge par association dans ce pôle ──────────────
    #    (mentorats ACTIFS uniquement — ce sont ceux qui pèsent sur la charge)
    assoc_active = (
        Mentorat.objects
        .filter(pole=young_request.pole, status='ACTIVE')
        .values('mentor__association_id')
        .annotate(count=Count('id'))
    )
    count_by_assoc: dict[int, int] = {
        row['mentor__association_id']: row['count']
        for row in assoc_active
    }
    # S'assurer que toutes les associations des mentors éligibles sont présentes
    for m in mentors:
        count_by_assoc.setdefault(m.association_id, 0)

    min_count = min(count_by_assoc.values()) if count_by_assoc else 0

    # ── 3. Scoring ────────────────────────────────────────────────────────
    results = []

    for mentor in mentors:
        score        = 0
        distance_km  = None
        city_match   = False
        dept_match   = False

        # Géocode le mentor si nécessaire (lazy + cache en base)
        ensure_coords(mentor)

        # 1️⃣ ÉQUITÉ ASSOCIATION (critère principal)
        assoc_count = count_by_assoc.get(mentor.association_id, 0)
        eq_score    = _equite_score(assoc_count, min_count)
        score      += eq_score

        # 2️⃣ GÉOGRAPHIE
        if (young_request.latitude and young_request.longitude
                and mentor.latitude and mentor.longitude):
            distance_km = haversine_km(
                young_request.latitude, young_request.longitude,
                mentor.latitude,        mentor.longitude,
            )
            score += _distance_score(distance_km)
            if distance_km < DISTANCE_TRES_PROCHE_KM:
                city_match = True
            elif distance_km < DISTANCE_ACCEPTABLE_KM:
                dept_match = True
        else:
            # Fallback textuel si géocodage impossible
            if mentor.city and young_request.city \
                    and mentor.city.lower() == young_request.city.lower():
                score     += 80
                city_match = True
            elif (young_request.department_id and mentor.department_id
                    and mentor.department_id == young_request.department_id):
                score     += 40
                dept_match = True
            else:
                score += 10

        # 3️⃣ DISPONIBILITÉ
        score += min(mentor.disponibilite_reelle * 25, 50)

        # 4️⃣ FORMATION RÉCENTE
        fm_score = _formation_score(mentor)
        score   += fm_score

        # 5️⃣ EXPÉRIENCE
        score += min(mentor.closed_mentorats * 3, 30)

        results.append({
            "mentor":            mentor,
            "score":             score,
            "remaining_capacity": mentor.disponibilite_reelle,
            "city_match":        city_match,
            "department_match":  dept_match,
            "distance_km":       round(distance_km, 1) if distance_km is not None else None,
            # Équité
            "equite_score":      eq_score,
            "assoc_count":       assoc_count,       # mentorats actifs de son association
            "assoc_min_count":   min_count,          # minimum dans le pôle
            # Formation
            "formation_score":   fm_score,
            "training_date":     mentor.training_date,
        })

    return sorted(results, key=lambda x: x["score"], reverse=True)
