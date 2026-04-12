# api/views/cn/animateurs.py
import secrets
import string

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from core.models import Animateur, Association, Pole
from core.models.user import User
from api.permissions import IsCN


def _generate_temp_password(length=12):
    """Génère un mot de passe temporaire sécurisé."""
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def _serialize_animateur(a):
    return {
        "id":               a.id,
        "first_name":       a.first_name,
        "last_name":        a.last_name,
        "email":            a.email,
        "phone":            a.phone,
        "city":             a.city,
        "pole_id":          a.pole_id,
        "pole_name":        a.pole.name,
        "pole_code":        a.pole.code,
        "association_id":   a.association_id,
        "association_name": a.association.name,
        "is_coordinator":   a.is_coordinator,
        "is_active":        a.is_active,
        "has_account":      a.user_id is not None,
    }


PAGE_SIZE_DEFAULT = 25
PAGE_SIZE_MAX     = 100


class CNAnimateursView(APIView):
    """
    GET  /api/cn/animateurs/?pole_id=&role=ACP|AP&is_active=true|false&search=&page=&page_size=
    POST /api/cn/animateurs/  – créer un animateur (ACP ou AP) sur n'importe quel pôle
    """
    permission_classes = [IsAuthenticated, IsCN]

    def get(self, request):
        pole_id   = request.query_params.get('pole_id', '')
        role      = request.query_params.get('role', '').upper()
        is_active = request.query_params.get('is_active', '')   # 'true'|'false'|''
        search    = request.query_params.get('search', '').strip()
        try:
            page      = max(1, int(request.query_params.get('page', 1)))
            page_size = min(PAGE_SIZE_MAX, max(1, int(request.query_params.get('page_size', PAGE_SIZE_DEFAULT))))
        except (ValueError, TypeError):
            page, page_size = 1, PAGE_SIZE_DEFAULT

        # ── Base (pole seulement, pour les compteurs totaux) ────────────────
        base_qs = Animateur.objects.all()
        if pole_id:
            base_qs = base_qs.filter(pole_id=pole_id)

        total_counts = {
            'all':          base_qs.count(),
            'acps':         base_qs.filter(is_coordinator=True).count(),
            'aps':          base_qs.filter(is_coordinator=False).count(),
            'with_account': base_qs.filter(user__isnull=False).count(),
            'actifs':       base_qs.filter(is_active=True).count(),
            'inactifs':     base_qs.filter(is_active=False).count(),
        }

        # ── Filtrage complet ────────────────────────────────────────────────
        qs = base_qs.select_related('pole', 'association').order_by('pole__name', 'last_name')

        if role == 'ACP':
            qs = qs.filter(is_coordinator=True)
        elif role == 'AP':
            qs = qs.filter(is_coordinator=False)

        if is_active == 'true':
            qs = qs.filter(is_active=True)
        elif is_active == 'false':
            qs = qs.filter(is_active=False)

        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(email__icontains=search)
            )

        total  = qs.count()
        offset = (page - 1) * page_size
        items  = list(qs[offset: offset + page_size])

        return Response({
            "total_counts": total_counts,
            "count":        total,
            "page":         page,
            "page_size":    page_size,
            "has_next":     offset + page_size < total,
            "animateurs":   [_serialize_animateur(a) for a in items],
        })

    @transaction.atomic
    def post(self, request):
        data = request.data
        required = ['first_name', 'last_name', 'email', 'association_id', 'pole_id']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {"error": f"Champs requis : {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = data['email'].strip().lower()
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Un compte avec cet email existe déjà"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pole = Pole.objects.get(id=data['pole_id'])
        except Pole.DoesNotExist:
            return Response({"error": "Pôle introuvable"}, status=400)

        try:
            association = Association.objects.get(
                id=data['association_id'], is_active=True
            )
        except Association.DoesNotExist:
            return Response({"error": "Association introuvable"}, status=400)

        first_name     = data['first_name'].strip()
        last_name      = data['last_name'].strip()
        is_coordinator = bool(data.get('is_coordinator', False))

        temp_password = _generate_temp_password()
        user = User.objects.create_user(
            email=email,
            password=temp_password,
            first_name=first_name,
            last_name=last_name,
        )

        animateur = Animateur.objects.create(
            user=user,
            pole=pole,
            association=association,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=data.get('phone', '').strip(),
            city=data.get('city', '').strip(),
            is_coordinator=is_coordinator,
            is_active=True,
        )

        return Response(
            {**_serialize_animateur(animateur), "temp_password": temp_password},
            status=status.HTTP_201_CREATED,
        )


class CNAnimateurDetailView(APIView):
    """
    GET   /api/cn/animateurs/{pk}/  – détail d'un animateur
    PATCH /api/cn/animateurs/{pk}/  – modifier (pôle, association, rôle, infos, is_active)
    """
    permission_classes = [IsAuthenticated, IsCN]

    def get(self, request, pk):
        animateur = get_object_or_404(
            Animateur.objects.select_related('pole', 'association'), id=pk
        )
        return Response(_serialize_animateur(animateur))

    def patch(self, request, pk):
        animateur = get_object_or_404(
            Animateur.objects.select_related('pole', 'association'), id=pk
        )
        data = request.data

        # Changement de pôle
        if 'pole_id' in data:
            try:
                animateur.pole = Pole.objects.get(id=data['pole_id'])
            except Pole.DoesNotExist:
                return Response({"error": "Pôle introuvable"}, status=400)

        # Changement d'association
        if 'association_id' in data:
            try:
                animateur.association = Association.objects.get(
                    id=data['association_id'], is_active=True
                )
            except Association.DoesNotExist:
                return Response({"error": "Association introuvable"}, status=400)

        for field in ('first_name', 'last_name', 'phone', 'city'):
            if field in data:
                setattr(animateur, field, str(data[field]).strip())

        if 'is_coordinator' in data:
            animateur.is_coordinator = bool(data['is_coordinator'])

        if 'is_active' in data:
            animateur.is_active = bool(data['is_active'])
            if animateur.user_id:
                User.objects.filter(id=animateur.user_id).update(is_active=animateur.is_active)

        animateur.save()
        return Response(_serialize_animateur(animateur))
