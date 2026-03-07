from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Mentor, Mentorat
from api.permissions import IsAP


class APDashboardView(APIView):
    """
    Dashboard AP - Vue de son association (lecture seule).
    """
    permission_classes = [IsAuthenticated, IsAP]

    def get(self, request):
        user = request.user
        ap = user.animateur

        # Mentors de MON association
        mentors = Mentor.objects.filter(
            association=ap.association,
            is_active=True
        )
        
        # Mentorats où le mentor est de MON association
        # (c'est-à-dire ceux que je dois suivre)
        mentorats = Mentorat.objects.filter(
            mentor__association=ap.association
        ).select_related('mentor', 'young_request', 'ap_responsable')

        actifs = mentorats.filter(status='ACTIVE')

        return Response({
            "mon_perimetre": {
                "role": "AP",
                "association": {
                    "id": ap.association.id,
                    "name": ap.association.name,
                },
                "pole": {
                    "id": ap.pole.id,
                    "name": ap.pole.name,
                    "code": ap.pole.code,
                }
            },
            "stats": {
                "mentors": {
                    "total": mentors.count(),
                    "disponibles": mentors.filter(disponibilite_reelle__gt=0).count(),
                    "satures": mentors.filter(disponibilite_reelle=0).count(),
                },
                "mentorats": {
                    "actifs": actifs.count(),
                    "alertes": actifs.filter(alerte_rouge=True).count(),
                    "sans_ap": actifs.filter(ap_responsable__isnull=True).count(),
                }
            },
            "mes_mentorats": [
                {
                    "id": m.id,
                    "mentor": {
                        "id": m.mentor.id,
                        "name": f"{m.mentor.first_name} {m.mentor.last_name}",
                        "email": m.mentor.email,
                    },
                    "jeune": {
                        "id": m.young_request.id,
                        "name": f"{m.young_request.first_name} {m.young_request.last_name}",
                        "ville": m.young_request.city,
                    },
                    "date_debut": m.assigned_at,
                    "duree_mois": m.get_duree_mois() if hasattr(m, 'get_duree_mois') else None,
                    "alerte_rouge": m.alerte_rouge,
                    "je_suis_responsable": m.ap_responsable_id == ap.id if m.ap_responsable else False,
                }
                for m in actifs.order_by('-alerte_rouge', '-assigned_at')[:20]
            ],
            "actions_disponibles": [
                "Voir détail mentorat",
                "Contacter mentor",
                "Contacter jeune",
                "Signaler une alerte",
                "Ajouter une note de suivi",
            ],
            "actions_interdites": [
                "Faire un matching (réservé ACP)",
                "Créer un mentorat",
                "Modifier un mentor",
            ]
        })