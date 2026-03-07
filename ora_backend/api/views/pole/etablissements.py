# api/views/pole/etablissements.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from core.models import Etablissement
from api.permissions import IsACP


class PoleEtablissementsView(APIView):
    """
    GET  /api/pole/etablissements/  – liste des établissements du pôle de l'ACP
    POST /api/pole/etablissements/  – créer un établissement dans le pôle
    """
    permission_classes = [IsAuthenticated, IsACP]

    def _pole_id(self, user):
        return user.animateur.pole_id if hasattr(user, 'animateur') else None

    def get(self, request):
        pole_id = self._pole_id(request.user)
        if not pole_id:
            return Response({'error': 'Pas de pôle'}, status=400)

        etabs = Etablissement.objects.filter(pole_id=pole_id, is_active=True).order_by('nom')
        data = [self._serialize(e) for e in etabs]
        return Response({'count': len(data), 'etablissements': data})

    def post(self, request):
        pole_id = self._pole_id(request.user)
        if not pole_id:
            return Response({'error': 'Pas de pôle'}, status=400)

        nom = request.data.get('nom', '').strip()
        code_postal = request.data.get('code_postal', '').strip()

        if not nom:
            return Response({'error': 'Le nom est requis'}, status=status.HTTP_400_BAD_REQUEST)

        etab = Etablissement.objects.create(
            nom=nom,
            code_postal=code_postal,
            pole_id=pole_id,
            is_active=True,
        )
        return Response(self._serialize(etab), status=status.HTTP_201_CREATED)

    @staticmethod
    def _serialize(e):
        return {
            'id':          e.id,
            'nom':         e.nom,
            'code_postal': e.code_postal,
            'is_active':   e.is_active,
        }
