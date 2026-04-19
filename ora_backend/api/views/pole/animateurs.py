# api/views/pole/animateurs.py
import secrets
import string

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from core.models import Animateur, Association
from core.models.user import User
from api.permissions import IsACP


def _generate_temp_password(length=12):
    """Génère un mot de passe temporaire sécurisé."""
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def _serialize_ap(ap):
    return {
        "id":               ap.id,
        "name":             f"{ap.first_name} {ap.last_name}",
        "first_name":       ap.first_name,
        "last_name":        ap.last_name,
        "email":            ap.email,
        "phone":            ap.phone,
        "city":             ap.city,
        "association":      ap.association.name,
        "association_id":   ap.association_id,
        "is_active":        ap.is_active,
        "is_coordinator":   ap.is_coordinator,
        "role_label":       "ACP" if ap.is_coordinator else "AP",
    }


class PoleAnimateursView(APIView):
    """
    GET  /pole/animateurs/  – liste des APs du pôle (non coordinateurs)
    POST /pole/animateurs/  – créer un AP avec compte User auto-généré
    """
    permission_classes = [IsAuthenticated, IsACP]

    def _pole_id(self, user):
        return user.animateur.pole_id if hasattr(user, 'animateur') else None

    def get(self, request):
        pole_id = self._pole_id(request.user)
        if not pole_id:
            return Response({"error": "Pas de pôle"}, status=400)

        aps = (
            Animateur.objects
            .filter(pole_id=pole_id, is_active=True)
            .select_related('association')
            .order_by('is_coordinator', 'association__name', 'last_name')
        )
        return Response({"count": aps.count(), "animateurs": [_serialize_ap(ap) for ap in aps]})

    @transaction.atomic
    def post(self, request):
        pole_id = self._pole_id(request.user)
        if not pole_id:
            return Response({"error": "Pas de pôle"}, status=400)

        data = request.data
        required = ['first_name', 'last_name', 'email', 'association_id']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {"error": f"Champs requis : {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = data['email'].strip().lower()

        # Email déjà utilisé ?
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Un compte avec cet email existe déjà"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Association dans le pôle
        try:
            association = Association.objects.get(
                id=data['association_id'], pole_id=pole_id, is_active=True
            )
        except Association.DoesNotExist:
            return Response({"error": "Association introuvable dans ce pôle"}, status=400)

        first_name = data['first_name'].strip()
        last_name  = data['last_name'].strip()

        # Crée le compte User
        temp_password = _generate_temp_password()
        user = User.objects.create_user(
            email=email,
            password=temp_password,
            first_name=first_name,
            last_name=last_name,
        )

        # Crée l'Animateur (AP)
        ap = Animateur.objects.create(
            user=user,
            pole_id=pole_id,
            association=association,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=data.get('phone', '').strip(),
            city=data.get('city', '').strip(),
            is_coordinator=False,
            is_active=True,
        )

        return Response(
            {**_serialize_ap(ap), "temp_password": temp_password},
            status=status.HTTP_201_CREATED,
        )


class PoleAnimateurDetailView(APIView):
    """
    GET   /pole/animateurs/{id}/  – détail d'un AP
    PATCH /pole/animateurs/{id}/  – modifier un AP
    """
    permission_classes = [IsAuthenticated, IsACP]

    def _get_ap_and_pole(self, request, animateur_id):
        if not hasattr(request.user, 'animateur'):
            return None, None, Response({"error": "Pas de pôle"}, status=400)
        pole_id = request.user.animateur.pole_id
        ap = get_object_or_404(
            Animateur, id=animateur_id, pole_id=pole_id, is_coordinator=False
        )
        return ap, pole_id, None

    def get(self, request, animateur_id):
        ap, _, err = self._get_ap_and_pole(request, animateur_id)
        if err:
            return err
        return Response(_serialize_ap(ap))

    def patch(self, request, animateur_id):
        ap, pole_id, err = self._get_ap_and_pole(request, animateur_id)
        if err:
            return err

        data = request.data

        # Association (vérifier pôle)
        if 'association_id' in data:
            try:
                ap.association = Association.objects.get(
                    id=data['association_id'], pole_id=pole_id, is_active=True
                )
            except Association.DoesNotExist:
                return Response({"error": "Association introuvable dans ce pôle"}, status=400)

        # Champs simples (email non modifiable)
        for field in ('first_name', 'last_name', 'phone', 'city'):
            if field in data:
                setattr(ap, field, str(data[field]).strip())

        if 'is_active' in data:
            ap.is_active = bool(data['is_active'])
            # Sync sur le User lié
            if ap.user_id:
                User.objects.filter(id=ap.user_id).update(is_active=ap.is_active)

        ap.save()
        return Response(_serialize_ap(ap))
