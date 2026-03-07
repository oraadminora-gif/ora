# api/views/cn/annuaire.py
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import CNMember, Animateur
from api.permissions import IsCN


class CNAnnuaireView(APIView):
    """
    GET /api/cn/annuaire/?role=CN|ACP|AP&pole_id=&association_id=&search=

    Retourne l'annuaire complet : membres CN + animateurs (ACPs et APs).
    """
    permission_classes = [IsAuthenticated, IsCN]

    def get(self, request):
        role         = request.query_params.get('role', '').upper()
        pole_id      = request.query_params.get('pole_id')
        assoc_id     = request.query_params.get('association_id')
        search       = request.query_params.get('search', '').strip()

        # ── Membres CN ────────────────────────────────────────────────────────
        cn_members_data = []
        if role in ('', 'CN'):
            cn_qs = (
                CNMember.objects
                .select_related('association', 'pole')
                .order_by('last_name', 'first_name')
            )
            if search:
                cn_qs = cn_qs.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search)  |
                    Q(email__icontains=search)
                )
            cn_members_data = [
                {
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
                    "is_active":      m.is_active,
                    "is_super_admin": m.is_super_admin,
                }
                for m in cn_qs
            ]

        # ── Animateurs ────────────────────────────────────────────────────────
        animateurs_data = []
        if role in ('', 'ACP', 'AP'):
            anim_qs = (
                Animateur.objects
                .select_related('pole', 'association')
                .order_by('pole__name', 'last_name')
            )

            if role == 'ACP':
                anim_qs = anim_qs.filter(is_coordinator=True)
            elif role == 'AP':
                anim_qs = anim_qs.filter(is_coordinator=False)

            if pole_id:
                anim_qs = anim_qs.filter(pole_id=pole_id)

            if assoc_id:
                anim_qs = anim_qs.filter(association_id=assoc_id)

            if search:
                anim_qs = anim_qs.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search)  |
                    Q(email__icontains=search)
                )

            animateurs_data = [
                {
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
                }
                for a in anim_qs
            ]

        total = len(cn_members_data) + len(animateurs_data)

        return Response({
            "cn_members": cn_members_data,
            "animateurs": animateurs_data,
            "total":      total,
        })
