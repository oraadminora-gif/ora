# api/views/pole/mentorats.py
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from core.models import Mentorat, Animateur, Mentor, Pole, YoungRequest
from api.permissions import IsACP

STATUS_LABELS = {
    'PENDING': 'En attente',
    'ACTIVE':  'Actif',
    'CLOSED':  'Clôturé',
    'ABORTED': 'Abandonné',
}


def _serialize_mentorat(m):
    req = m.young_request
    return {
        "id":               m.id,
        "mentor_id":        m.mentor_id,
        "mentor_name":      f"{m.mentor.first_name} {m.mentor.last_name}",
        "mentor_assoc":     m.mentor.association.name,
        "jeune_name":       f"{req.first_name} {req.last_name}",
        "jeune_ville":      req.city,
        "status":           m.status,
        "status_label":     STATUS_LABELS.get(m.status, m.status),
        "assigned_at":      m.assigned_at,
        "expected_end_date": m.expected_end_date,
        "closed_at":        m.closed_at,
        "alerte_rouge":     m.alerte_rouge,
        "dernier_contact":  m.dernier_contact,
        "notes_suivi":      m.notes_suivi,
        "closure_reason":   m.closure_reason,
        "pole_id":          m.pole_id,
        "pole_name":        m.pole.name if m.pole else None,
        "jeune_birth_date":      req.birth_date,
        "jeune_gender":          req.gender or '',
        "jeune_gender_label":    req.get_gender_display() if req.gender else '',
        "jeune_diplome_prepare": req.diplome_prepare or '',
        "jeune_diplome_label":   req.get_diplome_prepare_display() if req.diplome_prepare else '',
        "jeune_situation":       req.situation or '',
        "jeune_situation_label": req.get_situation_display() if req.situation else '',
        "jeune_etablissement_id": req.etablissement_id,
        "jeune_nom_etablissement": (
            req.etablissement.nom if req.etablissement_id else req.nom_etablissement
        ) or '',
        "ap_responsable_id":   m.ap_responsable_id,
        "ap_responsable_name": (
            f"{m.ap_responsable.first_name} {m.ap_responsable.last_name}"
            if m.ap_responsable else None
        ),
        "ap_responsable_assoc": (
            m.ap_responsable.association.name if m.ap_responsable else None
        ),
        "problematiques": m.problematiques if isinstance(m.problematiques, list) else [],
    }


class PoleMentoratListView(APIView):
    """
    GET /pole/mentorats/  – liste paginée des mentorats du pôle

    Query params:
      status    : ACTIVE | CLOSED | ABORTED | PENDING | all  (défaut: all)
      search    : filtre texte (mentor, jeune, AP)
      page      : numéro de page 1-based  (défaut: 1)
      page_size : taille de page          (défaut: 20, max: 100)

    Réponse:
      count, page, page_size, total_pages, has_next,
      counts { all, ACTIVE, PENDING, CLOSED, ABORTED },
      mentorats [ … ]
    """
    permission_classes = [IsAuthenticated, IsACP]

    def get(self, request):
        if not hasattr(request.user, 'animateur'):
            return Response({"error": "Pas de pôle"}, status=400)
        pole_id = request.user.animateur.pole_id

        status_filter = request.query_params.get('status', 'all')
        search        = request.query_params.get('search', '').strip()
        try:
            page      = max(1, int(request.query_params.get('page', 1)))
            page_size = min(100, max(1, int(request.query_params.get('page_size', 20))))
        except (ValueError, TypeError):
            page, page_size = 1, 20

        base_qs = Mentorat.objects.filter(pole_id=pole_id)

        # Compteurs par statut (toujours calculés sur la base entière)
        from django.db.models import Count as _Count
        counts_raw = (
            base_qs.values('status')
            .annotate(n=_Count('id'))
        )
        counts = {'all': 0, 'ACTIVE': 0, 'PENDING': 0, 'CLOSED': 0, 'ABORTED': 0}
        for row in counts_raw:
            s = row['status']
            counts[s] = row['n']
            counts['all'] += row['n']

        # Filtrage
        qs = base_qs.select_related(
            'mentor', 'mentor__association',
            'young_request', 'young_request__etablissement',
            'ap_responsable', 'ap_responsable__association',
            'pole',
        )

        if status_filter in ('ACTIVE', 'CLOSED', 'ABORTED', 'PENDING'):
            qs = qs.filter(status=status_filter)

        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(mentor__first_name__icontains=search) |
                Q(mentor__last_name__icontains=search)  |
                Q(young_request__first_name__icontains=search) |
                Q(young_request__last_name__icontains=search)  |
                Q(mentor__association__name__icontains=search)  |
                Q(ap_responsable__first_name__icontains=search) |
                Q(ap_responsable__last_name__icontains=search)
            )

        # Tri : alertes rouges en premier pour ACTIVE, sinon plus récent d'abord
        if status_filter == 'ACTIVE':
            qs = qs.order_by('-alerte_rouge', '-assigned_at')
        else:
            qs = qs.order_by('-created_at')

        total  = qs.count()
        offset = (page - 1) * page_size
        items  = list(qs[offset: offset + page_size])

        return Response({
            "counts":      counts,
            "count":       total,
            "page":        page,
            "page_size":   page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
            "has_next":    offset + page_size < total,
            "mentorats":   [_serialize_mentorat(m) for m in items],
        })


class PoleMentoratDetailView(APIView):
    """
    GET   /pole/mentorats/{id}/  – détail d'un mentorat
    PATCH /pole/mentorats/{id}/  – modifier un mentorat
    """
    permission_classes = [IsAuthenticated, IsACP]

    def _get_mentorat(self, request, mentorat_id):
        if not hasattr(request.user, 'animateur'):
            return None, None, Response({"error": "Pas de pôle"}, status=400)
        pole_id = request.user.animateur.pole_id
        m = get_object_or_404(
            Mentorat.objects.select_related(
                'mentor', 'mentor__association',
                'young_request', 'young_request__etablissement',
                'ap_responsable', 'ap_responsable__association',
                'pole',
            ),
            id=mentorat_id, pole_id=pole_id,
        )
        return m, pole_id, None

    def get(self, request, mentorat_id):
        m, _, err = self._get_mentorat(request, mentorat_id)
        if err:
            return err
        return Response(_serialize_mentorat(m))

    @transaction.atomic
    def patch(self, request, mentorat_id):
        m, pole_id, err = self._get_mentorat(request, mentorat_id)
        if err:
            return err

        data = request.data

        # ── Changement de statut ─────────────────────────────────
        if 'status' in data:
            new_status = data['status']
            # L'ACP peut modifier librement le statut dans toutes les directions
            allowed_transitions = {
                'PENDING': ['ACTIVE', 'ABORTED'],
                'ACTIVE':  ['CLOSED', 'ABORTED'],
                'CLOSED':  ['ACTIVE', 'ABORTED'],   # ACP peut réactiver ou recatégoriser
                'ABORTED': ['ACTIVE', 'CLOSED'],    # ACP peut réactiver ou recatégoriser
            }
            if new_status not in allowed_transitions.get(m.status, []):
                return Response(
                    {"error": f"Transition {m.status} → {new_status} non autorisée"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            was_terminated = m.status in ('CLOSED', 'ABORTED')
            if new_status in ('CLOSED', 'ABORTED'):
                if not data.get('closure_reason', '').strip():
                    return Response(
                        {"error": "Une raison de clôture est requise"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                m.closure_reason = data['closure_reason'].strip()
                if not was_terminated:
                    # Passage depuis ACTIVE : libère une place et ferme la demande
                    m.closed_at = timezone.now().date()
                    mentor = m.mentor
                    mentor.disponibilite_reelle = min(
                        mentor.disponibilite_reelle + 1, mentor.max_capacity
                    )
                    mentor.save()
                    m.young_request.status = 'CLOSED'
                    m.young_request.save()
                # Sinon (CLOSED↔ABORTED) : juste mise à jour du statut + raison, pas d'effet de bord
            elif new_status == 'ACTIVE' and was_terminated:
                # Réactivation par l'ACP : restaure la capacité et la demande
                m.closed_at = None
                m.closure_reason = ''
                mentor = m.mentor
                mentor.disponibilite_reelle = max(0, mentor.disponibilite_reelle - 1)
                mentor.save()
                m.young_request.status = 'MATCHED'
                m.young_request.save()
            m.status = new_status

        # ── AP responsable ───────────────────────────────────────
        if 'ap_responsable_id' in data:
            ap_id = data['ap_responsable_id']
            if ap_id:
                try:
                    ap = Animateur.objects.get(
                        id=ap_id, pole_id=pole_id, is_ap=True, is_active=True
                    )
                    m.ap_responsable = ap
                except Animateur.DoesNotExist:
                    return Response({"error": "AP introuvable dans ce pôle"}, status=400)
            else:
                m.ap_responsable = None

        # ── Champs de suivi ──────────────────────────────────────
        if 'notes_suivi' in data:
            m.notes_suivi = data['notes_suivi']

        if 'alerte_rouge' in data:
            m.alerte_rouge = bool(data['alerte_rouge'])

        if 'dernier_contact' in data:
            m.dernier_contact = data['dernier_contact'] or None

        if 'expected_end_date' in data:
            m.expected_end_date = data['expected_end_date'] or None

        if 'problematiques' in data:
            val = data['problematiques']
            if not isinstance(val, list):
                return Response({"error": "problematiques doit être une liste"}, status=400)
            if len(val) > 3:
                return Response({"error": "Maximum 3 problématiques autorisées"}, status=400)
            m.problematiques = val

        # ── Champs du jeune ──────────────────────────────────────
        req = m.young_request
        req_updated = []
        if 'gender' in data:
            val = data['gender']
            if val not in ('M', 'F', 'O', ''):
                return Response({"error": "Genre invalide."}, status=status.HTTP_400_BAD_REQUEST)
            req.gender = val
            req_updated.append('gender')
        if 'birth_date' in data:
            req.birth_date = data['birth_date'] or None
            req_updated.append('birth_date')
        if 'diplome_prepare' in data:
            val = data['diplome_prepare']
            valid_codes = [c[0] for c in YoungRequest.DIPLOME_CHOICES]
            if val and val not in valid_codes:
                return Response({"error": "Diplôme invalide."}, status=status.HTTP_400_BAD_REQUEST)
            req.diplome_prepare = val
            req_updated.append('diplome_prepare')
        if 'situation' in data:
            val = data['situation']
            if val not in ('apprentissage', 'recherche', ''):
                return Response({"error": "Situation invalide"}, status=status.HTTP_400_BAD_REQUEST)
            req.situation = val
            req_updated.append('situation')
        if 'etablissement_id' in data:
            etab_id = data['etablissement_id']
            if etab_id:
                from core.models import Etablissement as _Etab
                if not _Etab.objects.filter(id=etab_id, pole_id=pole_id, is_active=True).exists():
                    return Response({"error": "Établissement introuvable dans ce pôle."}, status=status.HTTP_400_BAD_REQUEST)
                req.etablissement_id = etab_id
                req.nom_etablissement = ''
                req_updated.extend(['etablissement_id', 'nom_etablissement'])
            else:
                req.etablissement_id = None
                req_updated.append('etablissement_id')
        elif 'nom_etablissement' in data:
            req.nom_etablissement = str(data['nom_etablissement']).strip()
            req.etablissement_id = None
            req_updated.extend(['nom_etablissement', 'etablissement_id'])
        if req_updated:
            req.save(update_fields=list(set(req_updated)))

        # ── Réassignation du mentor ──────────────────────────────
        if 'mentor_id' in data:
            new_mentor_id = data.get('mentor_id')
            if new_mentor_id and int(new_mentor_id) != m.mentor_id:
                try:
                    new_mentor = Mentor.objects.select_related('association').get(
                        id=new_mentor_id, pole_id=pole_id, is_active=True
                    )
                except Mentor.DoesNotExist:
                    return Response(
                        {"error": "Mentor introuvable ou inactif dans ce pôle"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                # Adjust mentor slots only for active mentorats
                if m.status == 'ACTIVE':
                    old_mentor = m.mentor
                    old_mentor.disponibilite_reelle = min(
                        old_mentor.disponibilite_reelle + 1, old_mentor.max_capacity
                    )
                    old_mentor.save()
                    new_mentor.disponibilite_reelle = max(0, new_mentor.disponibilite_reelle - 1)
                    new_mentor.save()
                m.mentor = new_mentor

        # ── Transfert vers un autre pôle ────────────────────────
        if 'pole_id' in data:
            new_pole_id = data.get('pole_id')
            if new_pole_id and int(new_pole_id) != pole_id:
                try:
                    new_pole = Pole.objects.get(id=new_pole_id, status='ACTIVE')
                except Pole.DoesNotExist:
                    return Response(
                        {"error": "Pôle introuvable ou inactif"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                m.pole = new_pole
                m.ap_responsable = None  # AP belongs to the old pole

        m.save()

        # Recharge avec relations pour la réponse
        m.refresh_from_db()
        m = Mentorat.objects.select_related(
            'mentor', 'mentor__association',
            'young_request',
            'ap_responsable', 'ap_responsable__association',
            'pole',
        ).get(id=m.id)
        return Response(_serialize_mentorat(m))
