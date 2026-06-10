# api/views/financements.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from core.models import Financement
from api.permissions import IsCN, IsACP, IsAnimateur


class FinancementsListView(APIView):
    """
    GET  /api/financements/   – liste tous les financements (tous authentifiés)
    POST /api/financements/   – créer un financement (ACP ou CN)
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsACP()]
        return [IsAuthenticated()]

    def get(self, request):
        qs = Financement.objects.all().order_by('type', 'nom')
        data = [self._serialize(f) for f in qs]
        return Response({'count': len(data), 'financements': data})

    def post(self, request):
        nom  = request.data.get('nom', '').strip()
        code = request.data.get('code', '').strip().upper()
        type_ = request.data.get('type', '').strip()

        if not nom or not code or not type_:
            return Response({'error': 'nom, code et type sont requis'}, status=status.HTTP_400_BAD_REQUEST)

        if type_ not in ('local', 'national'):
            return Response({'error': 'type doit être "local" ou "national"'}, status=status.HTTP_400_BAD_REQUEST)

        if Financement.objects.filter(code=code).exists():
            return Response({'error': f'Un financement avec le code {code} existe déjà'}, status=status.HTTP_400_BAD_REQUEST)

        f = Financement.objects.create(nom=nom, code=code, type=type_)
        return Response(self._serialize(f), status=status.HTTP_201_CREATED)

    @staticmethod
    def _serialize(f):
        return {
            'id':         f.id,
            'nom':        f.nom,
            'code':       f.code,
            'type':       f.type,
            'type_label': f.get_type_display(),
        }
