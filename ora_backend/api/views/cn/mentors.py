# api/views/cn/mentors.py
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from core.models import Mentor, Association
from api.permissions import IsCN

PAGE_SIZE_DEFAULT = 25
PAGE_SIZE_MAX     = 100


def _serialize_mentor(m):
    return {
        "id":                   m.id,
        "first_name":           m.first_name,
        "last_name":            m.last_name,
        "full_name":            f"{m.first_name} {m.last_name}",
        "email":                m.email,
        "phone":                m.phone or '',
        "city":                 m.city or '',
        "pole_name":            m.pole.name if m.pole else '',
        "pole_id":              m.pole_id,
        "association": {
            "id":   m.association.id,
            "name": m.association.name,
            "code": m.association.code,
        } if m.association else None,
        "is_active":            m.is_active,
        "is_trained":           m.is_trained,
        "training_date":        m.training_date,
        "disponibilite_reelle": m.disponibilite_reelle,
        "max_capacity":         m.max_capacity,
    }


class CNMenteursListView(APIView):
    """
    GET /cn/mentors/
    Params: search, is_active (true|false), pole_id, association_id, page, page_size

    Réponse :
      total_counts  – compteurs sur la base entière (respecte pole/assoc si filtrés)
      count         – total après tous les filtres
      page, page_size, has_next
      mentors       – page courante
    """
    permission_classes = [IsAuthenticated, IsCN]

    def get(self, request):
        search    = request.query_params.get('search', '').strip()
        is_active = request.query_params.get('is_active', '')   # 'true'|'false'|''
        pole_id   = request.query_params.get('pole_id', '')
        assoc_id  = request.query_params.get('association_id', '')
        try:
            page      = max(1, int(request.query_params.get('page', 1)))
            page_size = min(PAGE_SIZE_MAX, max(1, int(request.query_params.get('page_size', PAGE_SIZE_DEFAULT))))
        except (ValueError, TypeError):
            page, page_size = 1, PAGE_SIZE_DEFAULT

        # ── Base (pole + association seulement, pas is_active) ──────────────
        base_qs = Mentor.objects.all()
        if pole_id:
            base_qs = base_qs.filter(pole_id=pole_id)
        if assoc_id:
            base_qs = base_qs.filter(association_id=assoc_id)

        # Compteurs totaux (toujours calculés sur la base, sans filtre is_active/search)
        total_counts = {
            'all':        base_qs.count(),
            'actifs':     base_qs.filter(is_active=True).count(),
            'inactifs':   base_qs.filter(is_active=False).count(),
            'formes':     base_qs.filter(is_trained=True).count(),
            'disponibles': base_qs.filter(is_active=True, disponibilite_reelle__gt=0).count(),
        }

        # ── Filtrage complet ────────────────────────────────────────────────
        qs = base_qs.select_related('pole', 'association').order_by('last_name', 'first_name')

        if is_active == 'true':
            qs = qs.filter(is_active=True)
        elif is_active == 'false':
            qs = qs.filter(is_active=False)

        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(email__icontains=search)       |
                Q(city__icontains=search)        |
                Q(pole__name__icontains=search)
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
            "mentors":      [_serialize_mentor(m) for m in items],
        })


class CNMenteurDetailView(APIView):
    """
    PATCH /cn/mentors/{mentor_id}/  – activer / désactiver
    """
    permission_classes = [IsAuthenticated, IsCN]

    def patch(self, request, mentor_id):
        mentor = get_object_or_404(Mentor, id=mentor_id)
        if 'is_active' in request.data:
            mentor.is_active = bool(request.data['is_active'])
            mentor.save(update_fields=['is_active'])
        return Response(_serialize_mentor(mentor))
