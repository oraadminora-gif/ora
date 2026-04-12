# api/views/public/stats.py
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Count, Q

from core.models import Pole, Mentorat


class PublicStatsView(APIView):
    """
    GET /api/public/stats/
    Chiffres clés publics pour la page d'accueil.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        poles = Pole.objects.filter(status='ACTIVE').prefetch_related('departments')

        dept_codes = set()
        for pole in poles:
            for d in pole.departments.all():
                dept_codes.add(d.code)

        return Response({
            'total_poles':               poles.count(),
            'total_departments_covered': len(dept_codes),
        })
