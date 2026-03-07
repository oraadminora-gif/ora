# core/services/matching.py

from django.db.models import Count, Q
from core.models import Mentor


def get_mentor_suggestions(young_request):
    """
    Algorithme de matching mentor / jeune.

    Critères :
    1️⃣ Disponibilité (facteur principal)
    2️⃣ Proximité géographique (ville / département)
    3️⃣ Même association
    4️⃣ Mentor formé
    5️⃣ Expérience

    Retourne une liste triée par score décroissant.
    """

    if not young_request.pole:
        return []

    mentors = Mentor.objects.filter(
        pole=young_request.pole,
        is_active=True,
        disponibilite_reelle__gt=0
    ).select_related(
        'association',
        'department',
    ).annotate(
        closed_mentorats=Count(
            'mentorats',
            filter=Q(mentorats__status='CLOSED')
        )
    )

    results = []

    for mentor in mentors:
        score = 0

        # -------------------------------------------------
        # 1️⃣ DISPONIBILITÉ 🔥
        # -------------------------------------------------
        score += mentor.disponibilite_reelle * 25

        # -------------------------------------------------
        # 2️⃣ GÉOGRAPHIE 🔥🔥🔥
        # -------------------------------------------------
        city_match = False
        department_match = False

        # 🥇 Même ville (champ direct sur Mentor)
        if mentor.city and young_request.city and mentor.city.lower() == young_request.city.lower():
            score += 80
            city_match = True

        # 🥈 Même département
        elif (
            young_request.department_id
            and mentor.department_id
            and mentor.department_id == young_request.department_id
        ):
            score += 40
            department_match = True

        # 🥉 Fallback acceptable
        else:
            score += 10

        # -------------------------------------------------
        # 3️⃣ MÊME ÉTABLISSEMENT (si défini sur la demande)
        # -------------------------------------------------
        if young_request.etablissement_id:
            # Bonus si le mentor est dans la même ville que l'établissement
            # (proxy géographique — l'établissement n'a pas de FK mentor)
            pass  # réservé pour critères futurs

        # -------------------------------------------------
        # 4️⃣ MENTOR FORMÉ
        # -------------------------------------------------
        if mentor.is_trained:
            score += 15

        # -------------------------------------------------
        # 5️⃣ EXPÉRIENCE
        # -------------------------------------------------
        score += min(mentor.closed_mentorats * 3, 30)

        results.append({
            "mentor": mentor,
            "score": score,
            "remaining_capacity": mentor.disponibilite_reelle,
            "city_match": city_match,
            "department_match": department_match,
        })

    return sorted(results, key=lambda x: x["score"], reverse=True)
