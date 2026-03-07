from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Pole, Mentor, YoungRequest, Mentorat
from api.permissions import IsCN


class CNDashboardView(APIView):
    """
    Dashboard CN - Vue nationale complète.
    """
    permission_classes = [IsAuthenticated, IsCN]

    def get(self, request):
        # Stats nationales
        poles = Pole.objects.filter(status='ACTIVE')
        mentors = Mentor.objects.filter(is_active=True)
        demandes = YoungRequest.objects.all()
        mentorats = Mentorat.objects.all()

        return Response({
            "role": "CN",
            "acces": "National (tous pôles, toutes associations)",
            "stats_nationales": {
                "poles_actifs": poles.count(),
                "mentors": {
                    "total": mentors.count(),
                    "disponibles": mentors.filter(disponibilite_reelle__gt=0).count(),
                    "satures": mentors.filter(disponibilite_reelle=0).count(),
                },
                "jeunes": {
                    "total_demandes": demandes.count(),
                    "en_attente": demandes.filter(status__in=['NEW', 'PENDING']).count(),
                    "assignes": demandes.filter(status='ASSIGNED').count(),
                },
                "mentorats": {
                    "actifs": mentorats.filter(status='ACTIVE').count(),
                    "clos": mentorats.filter(status='CLOSED').count(),
                    "alertes": mentorats.filter(status='ACTIVE', alerte_rouge=True).count(),
                }
            },
            "poles": [
                {
                    "id": p.id,
                    "code": p.code,
                    "name": p.name,
                    "mentors_count": Mentor.objects.filter(pole=p, is_active=True).count(),
                    "demandes_en_attente": YoungRequest.objects.filter(pole=p, status__in=['NEW', 'PENDING']).count(),
                }
                for p in poles
            ],
            "liens_admin": {
                "gestion_poles": "/admin/core/pole/",
                "gestion_associations": "/admin/core/association/",
                "gestion_utilisateurs": "/admin/core/user/",
            }
        })