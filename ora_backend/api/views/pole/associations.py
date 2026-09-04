# api/views/pole/associations.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Association
from api.permissions import IsAnimateur


class PoleAssociationsView(APIView):
    """
    Liste des associations disponibles pour la création de mentors.
    - AP       → uniquement sa propre association (présélectionnée, non modifiable)
    - ACP / CN → les 4 associations nationales, qu'elles soient ou non déjà
                 représentées dans le pôle (une APC doit pouvoir démarrer un
                 nouveau partenariat local avec une association encore absente)
    """
    permission_classes = [IsAuthenticated, IsAnimateur]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'animateur'):
            return Response({"error": "Pas de pôle"}, status=400)

        animateur = user.animateur

        if animateur.is_acp:
            # ACP : les 4 associations nationales
            associations = Association.objects.filter(is_active=True).order_by('name')
        else:
            # AP : seulement sa propre association
            associations = Association.objects.filter(
                id=animateur.association_id, is_active=True
            )

        data = [
            {"id": a.id, "name": a.name, "code": a.code}
            for a in associations
        ]
        return Response({"count": len(data), "associations": data})
