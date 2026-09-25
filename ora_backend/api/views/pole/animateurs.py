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


def _user_roles_summary(user):
    """Rôles déjà détenus par ce compte (voir CustomTokenObtainPairSerializer)."""
    roles = []
    if hasattr(user, 'mentor'):
        roles.append('MENTOR')
    if hasattr(user, 'animateur'):
        if user.animateur.is_acp:
            roles.append('ACP')
        if user.animateur.is_ap:
            roles.append('AP')
    if hasattr(user, 'cn_member'):
        roles.append('CN')
    return roles


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
        "is_acp":           ap.is_acp,
        "is_ap":            ap.is_ap,
        "role_label":       ("APC/AP" if (ap.is_acp and ap.is_ap) else ("APC" if ap.is_acp else "AP")),
    }


class PoleCheckEmailView(APIView):
    """
    GET /pole/animateurs/check-email/?email=...
    Indique si un compte existe déjà pour cet email, afin de proposer d'y
    rattacher un nouveau rôle Animateur plutôt que d'échouer à la création.
    """
    permission_classes = [IsAuthenticated, IsACP]

    def get(self, request):
        email = request.query_params.get('email', '').strip().lower()
        if not email:
            return Response({"exists": False})

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"exists": False})

        return Response({
            "exists":                 True,
            "first_name":             user.first_name,
            "last_name":              user.last_name,
            "roles":                  _user_roles_summary(user),
            "has_animateur_profile":  hasattr(user, 'animateur'),
        })


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
            .order_by('is_acp', 'association__name', 'last_name')
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

        # Email déjà utilisé par un animateur existant ?
        existing_user = User.objects.filter(email=email).first()
        if existing_user and hasattr(existing_user, 'animateur'):
            return Response(
                {"error": "Cette personne a déjà un profil Animateur."},
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

        # Crée le compte User (ou réutilise celui d'un mentor existant)
        temp_password = None
        if existing_user:
            user = existing_user
        else:
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
            is_ap=True,
            is_acp=False,
            is_active=True,
        )

        response_data = {**_serialize_ap(ap)}
        if temp_password:
            response_data["temp_password"] = temp_password
        else:
            response_data["linked_existing_account"] = True
        return Response(response_data, status=status.HTTP_201_CREATED)


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
            Animateur, id=animateur_id, pole_id=pole_id, is_ap=True
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
