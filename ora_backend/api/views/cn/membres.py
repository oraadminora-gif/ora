# api/views/cn/membres.py
import secrets
import string
from django.db import transaction
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from core.models import CNMember, User, Association, Pole
from api.permissions import IsCN


def _generate_temp_password(length=12):
    chars = string.ascii_letters + string.digits + '!@#$%'
    return ''.join(secrets.choice(chars) for _ in range(length))


def _serialize(m):
    return {
        "id":             m.id,
        "first_name":     m.first_name,
        "last_name":      m.last_name,
        "email":          m.email,
        "phone":          m.phone,
        "ville":          m.ville,
        "fonction":       m.fonction,
        "fonction_label": m.get_fonction_display(),
        "association_id":   m.association_id,
        "association_name": m.association.name if m.association else None,
        "pole_id":        m.pole_id,
        "pole_name":      m.pole.name if m.pole else None,
        "is_active":        m.is_active,
        "is_super_admin":   m.is_super_admin,
        "cn_acces_complet": m.cn_acces_complet,
        "has_account":      m.user_id is not None,
        "created_at":     m.created_at,
    }


def _resolve_association(association_id):
    """Returns (Association|None, error_response|None)."""
    if not association_id:
        return None, None
    try:
        return Association.objects.get(id=association_id), None
    except Association.DoesNotExist:
        return None, Response({"error": "Association introuvable"}, status=400)


def _resolve_pole(pole_id):
    """Returns (Pole|None, error_response|None)."""
    if not pole_id:
        return None, None
    try:
        return Pole.objects.get(id=pole_id), None
    except Pole.DoesNotExist:
        return None, Response({"error": "Pôle introuvable"}, status=400)


class CNMembresView(APIView):
    """
    GET  /api/cn/membres/  – Liste des membres CN
    POST /api/cn/membres/  – Créer un nouveau membre CN
    """
    permission_classes = [IsAuthenticated, IsCN]

    def get(self, request):
        search = request.query_params.get('search', '').strip()
        qs = (
            CNMember.objects
            .select_related('association', 'pole')
            .order_by('last_name', 'first_name')
        )
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(email__icontains=search)
            )
        return Response([_serialize(m) for m in qs])

    @transaction.atomic
    def post(self, request):
        first_name     = request.data.get('first_name', '').strip()
        last_name      = request.data.get('last_name', '').strip()
        email          = request.data.get('email', '').strip().lower()
        phone          = request.data.get('phone', '').strip()
        ville          = request.data.get('ville', '').strip()
        fonction       = request.data.get('fonction', 'membre').strip()
        association_id = request.data.get('association_id')
        pole_id        = request.data.get('pole_id')
        is_super_admin = bool(request.data.get('is_super_admin', False))

        if not all([first_name, last_name, email]):
            return Response(
                {"error": "Prénom, nom et email sont obligatoires"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate fonction
        valid_fonctions = [c[0] for c in CNMember.FONCTION_CHOICES]
        if fonction not in valid_fonctions:
            fonction = 'membre'

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": f"Un compte avec l'email {email} existe déjà"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        association, err = _resolve_association(association_id)
        if err:
            return err
        pole, err = _resolve_pole(pole_id)
        if err:
            return err

        temp_password = _generate_temp_password(12)
        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=temp_password,
        )
        member = CNMember.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            ville=ville,
            fonction=fonction,
            association=association,
            pole=pole,
            is_super_admin=is_super_admin,
        )
        data = _serialize(member)
        data["temp_password"] = temp_password
        return Response(data, status=status.HTTP_201_CREATED)


class CNMembreDetailView(APIView):
    """
    PATCH /api/cn/membres/{pk}/ – Modifier un membre CN
    """
    permission_classes = [IsAuthenticated, IsCN]

    def patch(self, request, pk):
        try:
            member = CNMember.objects.select_related('association', 'pole').get(pk=pk)
        except CNMember.DoesNotExist:
            return Response({"error": "Membre introuvable"}, status=status.HTTP_404_NOT_FOUND)

        # Prevent self-deactivation
        if (
            hasattr(request.user, 'cn_member') and
            request.user.cn_member.id == member.id and
            request.data.get('is_active') is False
        ):
            return Response(
                {"error": "Vous ne pouvez pas vous désactiver vous-même"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for field in ['first_name', 'last_name', 'phone', 'ville', 'fonction',
                      'is_active', 'is_super_admin', 'cn_acces_complet']:
            if field in request.data:
                setattr(member, field, request.data[field])

        if 'association_id' in request.data:
            assoc, err = _resolve_association(request.data['association_id'])
            if err:
                return err
            member.association = assoc

        if 'pole_id' in request.data:
            pole, err = _resolve_pole(request.data['pole_id'])
            if err:
                return err
            member.pole = pole

        member.save()
        return Response(_serialize(member))


class CNMembreMeView(APIView):
    """
    GET   /api/cn/membres/me/ – Profil du CN connecté
    PATCH /api/cn/membres/me/ – Modifier son propre profil
    """
    permission_classes = [IsAuthenticated, IsCN]

    def get(self, request):
        m = CNMember.objects.select_related('association', 'pole').get(
            pk=request.user.cn_member.pk
        )
        return Response(_serialize(m))

    def patch(self, request):
        member = CNMember.objects.select_related('association', 'pole').get(
            pk=request.user.cn_member.pk
        )

        for field in ['first_name', 'last_name', 'phone', 'ville', 'fonction']:
            if field in request.data:
                setattr(member, field, request.data[field])

        if 'association_id' in request.data:
            assoc, err = _resolve_association(request.data['association_id'])
            if err:
                return err
            member.association = assoc

        if 'pole_id' in request.data:
            pole, err = _resolve_pole(request.data['pole_id'])
            if err:
                return err
            member.pole = pole

        member.save()

        # Sync Django user name fields
        user = request.user
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        user.save()

        return Response(_serialize(member))
