from rest_framework.views import APIView
from rest_framework.response import Response

from core.models import Pole


class PublicPolesView(APIView):
    """Liste publique des pôles actifs (pour formulaire d'inscription)."""
    permission_classes = []

    def get(self, request):
        poles = (
            Pole.objects
            .filter(status='ACTIVE')
            .order_by('name')
            .values('id', 'name', 'code')
        )
        return Response(list(poles))
