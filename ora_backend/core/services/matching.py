# core/services/matching.py

from django.db.models import Count, Q
from core.models import Mentor
from core.services.geocoding import ensure_coords, haversine_km


# Seuils de distance pour les bonus géographiques
DISTANCE_TRES_PROCHE_KM = 20    # < 20 km → bonus maximum
DISTANCE_PROCHE_KM      = 50    # < 50 km → bon bonus
DISTANCE_ACCEPTABLE_KM  = 100   # < 100 km → bonus moyen
DISTANCE_LOINTAIN_KM    = 200   # < 200 km → faible bonus


def _distance_score(distance_km: float) -> int:
    """Retourne un bonus de score (0-100) selon la distance."""
    if distance_km < DISTANCE_TRES_PROCHE_KM:
        return 100
    if distance_km < DISTANCE_PROCHE_KM:
        return 75
    if distance_km < DISTANCE_ACCEPTABLE_KM:
        return 45
    if distance_km < DISTANCE_LOINTAIN_KM:
        return 20
    return 5


def get_mentor_suggestions(young_request):
    """
    Algorithme de matching mentor / jeune.

    Critères (par ordre d'importance) :
    1️⃣  Distance GPS réelle (Haversine)  — poids max 100 pts
    2️⃣  Disponibilité                    — poids max  50 pts
    3️⃣  Mentor formé                     — 15 pts
    4️⃣  Expérience (mentorats clôturés)  — max 30 pts

    Géocodage paresseux : si coordonnées absentes, appel à
    api-adresse.data.gouv.fr puis sauvegarde sur le modèle.

    Retourne une liste triée par score décroissant.
    """

    if not young_request.pole:
        return []

    # Géocode le jeune si nécessaire (appel HTTP unique, mis en cache)
    ensure_coords(young_request)

    mentors = Mentor.objects.filter(
        pole=young_request.pole,
        is_active=True,
        disponibilite_reelle__gt=0,
    ).select_related(
        'association',
        'department',
    ).annotate(
        closed_mentorats=Count(
            'mentorats',
            filter=Q(mentorats__status='CLOSED'),
        )
    )

    results = []

    for mentor in mentors:
        score = 0
        distance_km = None
        city_match = False
        department_match = False

        # ── 1️⃣ GÉOGRAPHIE — distance GPS ──────────────────────────────
        # Géocode le mentor si nécessaire
        ensure_coords(mentor)

        if young_request.latitude and young_request.longitude \
                and mentor.latitude and mentor.longitude:
            distance_km = haversine_km(
                young_request.latitude, young_request.longitude,
                mentor.latitude, mentor.longitude,
            )
            geo_bonus = _distance_score(distance_km)
            score += geo_bonus

            # Drapeaux de compatibilité pour l'affichage frontend
            if distance_km < DISTANCE_TRES_PROCHE_KM:
                city_match = True
            elif distance_km < DISTANCE_ACCEPTABLE_KM:
                department_match = True
        else:
            # Fallback si géocodage impossible : critères textuels
            if mentor.city and young_request.city \
                    and mentor.city.lower() == young_request.city.lower():
                score += 80
                city_match = True
            elif (
                young_request.department_id
                and mentor.department_id
                and mentor.department_id == young_request.department_id
            ):
                score += 40
                department_match = True
            else:
                score += 10

        # ── 2️⃣ DISPONIBILITÉ ───────────────────────────────────────────
        score += min(mentor.disponibilite_reelle * 25, 50)

        # ── 3️⃣ MENTOR FORMÉ ────────────────────────────────────────────
        if mentor.is_trained:
            score += 15

        # ── 4️⃣ EXPÉRIENCE ──────────────────────────────────────────────
        score += min(mentor.closed_mentorats * 3, 30)

        results.append({
            "mentor":            mentor,
            "score":             score,
            "remaining_capacity": mentor.disponibilite_reelle,
            "city_match":        city_match,
            "department_match":  department_match,
            "distance_km":       round(distance_km, 1) if distance_km is not None else None,
        })

    return sorted(results, key=lambda x: x["score"], reverse=True)
