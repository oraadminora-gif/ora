# api/views/pole/associations.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from core.models import Association
from api.permissions import IsAnimateur


class PoleAssociationsView(APIView):
    """
    Liste des associations disponibles pour la création de mentors.
    - AP            → uniquement sa propre association
    - ACP / CN      → toutes les associations présentes dans le pôle
                      (via animateurs ou mentors déjà rattachés)
    """
    permission_classes = [IsAuthenticated, IsAnimateur]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'animateur'):
            return Response({"error": "Pas de pôle"}, status=400)

        animateur = user.animateur
        pole_id   = animateur.pole_id

        if animateur.is_acp:
            # ACP : toutes les associations représentées dans le pôle
            associations = (
                Association.objects
                .filter(
                    Q(animateurs__pole_id=pole_id) | Q(mentors__pole_id=pole_id),
                    is_active=True,
                )
                .distinct()
                .order_by('name')
            )
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
