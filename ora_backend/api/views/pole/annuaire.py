# api/views/pole/annuaire.py
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Animateur, Mentor, CNMember
from api.permissions import IsAnimateur


class PoleAnnuaireView(APIView):
    """
    GET /api/pole/annuaire/

    Annuaire du pôle : ACP + APs + Mentors.
    Accessible à tous les animateurs (ACP et AP) du pôle.
    """
    permission_classes = [IsAuthenticated, IsAnimateur]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'animateur') or not user.animateur.pole:
            return Response({"error": "Pas de pôle assigné"}, status=400)

        pole   = user.animateur.pole
        search = request.query_params.get('search', '').strip()

        # ── Animateurs (ACP + APs) ────────────────────────────
        anim_qs = (
            Animateur.objects
            .filter(pole=pole)
            .select_related('association')
            .order_by('-is_acp', 'last_name', 'first_name')
        )
        if search:
            anim_qs = anim_qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(email__icontains=search)
            )

        # ── Membres CN rattachés au pôle ─────────────────────
        cn_qs = (
            CNMember.objects
            .filter(is_active=True)
            .select_related('association')
            .order_by('last_name', 'first_name')
        )
        if search:
            cn_qs = cn_qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(email__icontains=search)
            )

        # ── Mentors ───────────────────────────────────────────
        mentor_qs = (
            Mentor.objects
            .filter(pole=pole)
            .select_related('association', 'department')
            .order_by('last_name', 'first_name')
        )
        if search:
            mentor_qs = mentor_qs.filter(
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
                "association_id":   a.association_id,
                "association_name": a.association.name,
                "is_acp":           a.is_acp,
                "is_ap":            a.is_ap,
                "is_active":        a.is_active,
            }
            for a in anim_qs
        ]

        mentors_data = [
            {
                "id":               m.id,
                "first_name":       m.first_name,
                "last_name":        m.last_name,
                "email":            m.email,
                "phone":            m.phone,
                "city":             m.city,
                "association_id":   m.association_id,
                "association_name": m.association.name,
                "is_trained":       m.is_trained,
                "is_active":        m.is_active,
                "disponibilite":    m.disponibilite_reelle,
                "capacite_max":     m.max_capacity,
            }
            for m in mentor_qs
        ]

        cn_data = [
            {
                "id":               c.id,
                "first_name":       c.first_name,
                "last_name":        c.last_name,
                "email":            c.email,
                "phone":            c.phone,
                "ville":            c.ville,
                "fonction":         c.fonction,
                "fonction_label":   c.get_fonction_display(),
                "association_name": c.association.name if c.association_id else "",
                "is_active":        c.is_active,
            }
            for c in cn_qs
        ]

        animateur = user.animateur
        return Response({
            "pole": {
                "id":     pole.id,
                "name":   pole.name,
                "code":   pole.code,
                "villes": pole.villes if isinstance(pole.villes, list) else [],
            },
            "moi": {
                "first_name": animateur.first_name,
                "last_name":  animateur.last_name,
            },
            "cn_members":  cn_data,
            "animateurs":  animateurs_data,
            "mentors":     mentors_data,
            "total":       len(cn_data) + len(animateurs_data) + len(mentors_data),
        })
