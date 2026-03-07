# api/views/mentor/dashboard.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count
from datetime import date  # ✅ AJOUTÉ pour validation date

from core.models import Mentorat, Department, SuiviMentorat, Etablissement
from api.permissions import IsMentor

URGENCY_LABELS = {1: 'Faible', 2: 'Modérée', 3: 'Normale', 4: 'Haute', 5: 'Très urgente'}


def serialize_suivi(s):
    return {
        'id':                 s.id,
        'date_rencontre':     s.date_rencontre,
        'duree_minutes':      s.duree_minutes,
        'type_rencontre':     s.type_rencontre,
        'type_rencontre_label': s.get_type_rencontre_display(),
        'objectifs_atteints': s.objectifs_atteints,
        'notes':              s.notes,
        'created_at':         s.created_at,
    }


def get_suivi_stats(mentorat):
    """Retourne nb rencontres + durée totale pour un mentorat."""
    agg = SuiviMentorat.objects.filter(mentorat=mentorat).aggregate(
        nb=Count('id'),
        total_minutes=Sum('duree_minutes'),
    )
    return {
        'nb_rencontres':    agg['nb'] or 0,
        'total_minutes':    agg['total_minutes'] or 0,
        'total_heures':     round((agg['total_minutes'] or 0) / 60, 1),
    }


class MentorDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsMentor]

    def get(self, request):
        mentor = request.user.mentor
        mentorats = Mentorat.objects.filter(mentor=mentor).select_related(
            'young_request', 'young_request__department', 'young_request__etablissement', 'ap_responsable'
        )
        actifs    = mentorats.filter(status='ACTIVE')
        historique = mentorats.filter(status__in=['CLOSED', 'ABORTED']).select_related('evaluation').order_by('-closed_at')
        mentorats_actifs_count = actifs.count()
        disponible_reel = max(0, mentor.max_capacity - mentorats_actifs_count)

        return Response({
            "mentor": {
                "id":           mentor.id,
                "first_name":   mentor.first_name,
                "last_name":    mentor.last_name,
                "email":        mentor.email,
                "phone":        mentor.phone,
                "city":         mentor.city,
                "code_postal":  mentor.code_postal,
                "department": {
                    "id":   mentor.department.id,
                    "code": mentor.department.code,
                    "name": mentor.department.name,
                } if mentor.department else None,
                "pole":        mentor.pole.name if mentor.pole else None,
                "association": mentor.association.name if mentor.association else None,
                "is_trained":  mentor.is_trained,
                "capacite": {
                    "max":       mentor.max_capacity,
                    "disponible": disponible_reel,
                    "utilisee":  mentorats_actifs_count,
                },
            },
            "mentorats": {
                "actifs": [
                    {
                        "id": m.id,
                        "jeune": {
                            "id":                m.young_request.id,
                            "name":              f"{m.young_request.first_name} {m.young_request.last_name}",
                            "email":             m.young_request.email,
                            "phone":             m.young_request.phone,
                            "ville":             m.young_request.city,
                            "department":        m.young_request.department.name if m.young_request.department else None,
                            "gender":            m.young_request.get_gender_display(),
                            "birth_date":        m.young_request.birth_date,
                            "needs_description": m.young_request.needs_description,
                            "urgency_level":     m.young_request.urgency_level,
                            "urgency_label":     URGENCY_LABELS.get(m.young_request.urgency_level, '—'),
                            "request_date":      m.young_request.request_date,
                            "situation":         m.young_request.situation or '',
                            "situation_label":   m.young_request.get_situation_display() if m.young_request.situation else '',
                            "etablissement_id":  m.young_request.etablissement_id,
                            "nom_etablissement": (
                                m.young_request.etablissement.nom
                                if m.young_request.etablissement_id
                                else m.young_request.nom_etablissement
                            ) or '',
                        },
                        "date_debut":    m.assigned_at,
                        "ap_referent":   m.ap_responsable.full_name if m.ap_responsable else "Non assigné",
                        "alerte_rouge":  m.alerte_rouge,
                        "notes_suivi":   m.notes_suivi or '',
                        "problematiques": m.problematiques if isinstance(m.problematiques, list) else [],
                        "duree_mois":    m.get_duree_mois(),
                        # Demande de clôture en attente
                        "cloture_en_attente":      m.cloture_en_attente,
                        "cloture_action_demandee": m.cloture_action_demandee,
                        # Suivis inline
                        "suivis":        [serialize_suivi(s) for s in m.suivis.all()],
                        "suivi_stats":   get_suivi_stats(m),
                    }
                    for m in actifs.prefetch_related('suivis')
                ],
                "historique": [
                    {
                        "id":              m.id,
                        "jeune":           f"{m.young_request.first_name} {m.young_request.last_name}",
                        "statut_final":    m.status,
                        "date_fin":        m.closed_at,
                        "closure_reason":  m.closure_reason,
                        "message_cloture": m.message_cloture or '',
                        "suivi_stats":     get_suivi_stats(m),
                        "evaluation": (
                            {
                                "rating":       m.evaluation.rating,
                                "comment":      m.evaluation.comment,
                                "submitted_at": m.evaluation.submitted_at,
                            }
                            if hasattr(m, 'evaluation') and m.evaluation.submitted_at
                            else None
                        ),
                    }
                    for m in historique
                ]
            }
        })


class MentorUpdateProfileView(APIView):
    permission_classes = [IsAuthenticated, IsMentor]

    def patch(self, request):
        mentor = request.user.mentor
        data   = request.data

        for field in ['first_name', 'last_name', 'email', 'phone', 'city', 'code_postal']:
            if field in data:
                setattr(mentor, field, data[field])

        department_id = data.get('department_id')
        if department_id is not None:
            if department_id == '':
                mentor.department = None
            else:
                try:
                    mentor.department = Department.objects.get(id=department_id)
                except Department.DoesNotExist:
                    return Response({"error": "Département introuvable."}, status=status.HTTP_400_BAD_REQUEST)

        mentor.save()
        return Response({
            "first_name": mentor.first_name,
            "last_name":  mentor.last_name,
            "email":      mentor.email,
            "phone":      mentor.phone,
            "city":        mentor.city,
            "code_postal": mentor.code_postal,
            "department": {
                "id":   mentor.department.id,
                "code": mentor.department.code,
                "name": mentor.department.name,
            } if mentor.department else None,
        })


class MentorUpdateCapaciteView(APIView):
    permission_classes = [IsAuthenticated, IsMentor]

    def patch(self, request):
        mentor = request.user.mentor
        max_capacity = request.data.get('max_capacity')
        if max_capacity is None:
            return Response({"error": "Le champ max_capacity est requis."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            max_capacity = int(max_capacity)
            if max_capacity < 1:
                return Response({"error": "La capacité maximale doit être au moins 1."}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({"error": "Valeur invalide."}, status=status.HTTP_400_BAD_REQUEST)

        mentor.max_capacity = max_capacity
        mentor.save()
        count = Mentorat.objects.filter(mentor=mentor, status='ACTIVE').count()
        return Response({
            "max":        mentor.max_capacity,
            "disponible": max(0, mentor.max_capacity - count),
            "utilisee":   count,
        })


# ── Suivi CRUD ────────────────────────────────────────────────────────────────

class MentorSuiviListCreateView(APIView):
    """GET liste + POST création d'un suivi pour un mentorat."""
    permission_classes = [IsAuthenticated, IsMentor]

    def _get_mentorat(self, request, mentorat_id):
        try:
            return Mentorat.objects.get(id=mentorat_id, mentor=request.user.mentor, status='ACTIVE')
        except Mentorat.DoesNotExist:
            return None

    def get(self, request, mentorat_id):
        m = self._get_mentorat(request, mentorat_id)
        if not m:
            return Response({"error": "Mentorat introuvable."}, status=status.HTTP_404_NOT_FOUND)
        suivis = m.suivis.all()
        return Response({
            "suivis":      [serialize_suivi(s) for s in suivis],
            "suivi_stats": get_suivi_stats(m),
        })

    def post(self, request, mentorat_id):
        m = self._get_mentorat(request, mentorat_id)
        if not m:
            return Response({"error": "Mentorat introuvable."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        required = ['date_rencontre', 'duree_minutes', 'type_rencontre']
        for field in required:
            if not data.get(field):
                return Response({"error": f"Le champ '{field}' est requis."}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ VALIDATION DATE FUTURE INTERDITE
        date_rencontre = data.get('date_rencontre')
        if date_rencontre:
            try:
                from datetime import datetime
                date_parsed = datetime.strptime(date_rencontre, '%Y-%m-%d').date()
                if date_parsed > date.today():
                    return Response(
                        {"error": "La date de rencontre ne peut pas être dans le futur"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {"error": "Format de date invalide (YYYY-MM-DD attendu)"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        valid_types = [c[0] for c in SuiviMentorat.TYPE_CHOICES]
        if data['type_rencontre'] not in valid_types:
            return Response({"error": "Type de rencontre invalide."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            duree = int(data['duree_minutes'])
            if duree < 1:
                raise ValueError
        except (ValueError, TypeError):
            return Response({"error": "La durée doit être un entier positif."}, status=status.HTTP_400_BAD_REQUEST)

        suivi = SuiviMentorat.objects.create(
            mentorat=m,
            date_rencontre=data['date_rencontre'],
            duree_minutes=duree,
            type_rencontre=data['type_rencontre'],
            objectifs_atteints=bool(data.get('objectifs_atteints', False)),
            notes=data.get('notes', ''),
        )
        
        # Mettre à jour le dernier contact
        m.dernier_contact = data['date_rencontre']
        m.save()
        
        return Response(serialize_suivi(suivi), status=status.HTTP_201_CREATED)


class MentorSuiviDetailView(APIView):
    """PATCH update + DELETE suppression d'un suivi."""
    permission_classes = [IsAuthenticated, IsMentor]

    def _get_suivi(self, request, mentorat_id, suivi_id):
        try:
            return SuiviMentorat.objects.get(
                id=suivi_id,
                mentorat__id=mentorat_id,
                mentorat__mentor=request.user.mentor,
            )
        except SuiviMentorat.DoesNotExist:
            return None

    def patch(self, request, mentorat_id, suivi_id):
        s = self._get_suivi(request, mentorat_id, suivi_id)
        if not s:
            return Response({"error": "Suivi introuvable."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        
        # ✅ VALIDATION DATE FUTURE INTERDITE EN PATCH AUSSI
        if 'date_rencontre' in data:
            try:
                from datetime import datetime
                date_parsed = datetime.strptime(data['date_rencontre'], '%Y-%m-%d').date()
                if date_parsed > date.today():
                    return Response(
                        {"error": "La date de rencontre ne peut pas être dans le futur"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {"error": "Format de date invalide (YYYY-MM-DD attendu)"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            s.date_rencontre = data['date_rencontre']
            
        if 'duree_minutes'     in data: s.duree_minutes    = int(data['duree_minutes'])
        if 'type_rencontre'    in data: s.type_rencontre   = data['type_rencontre']
        if 'objectifs_atteints' in data: s.objectifs_atteints = bool(data['objectifs_atteints'])
        if 'notes'             in data: s.notes            = data['notes']
        s.save()
        return Response(serialize_suivi(s))

    def delete(self, request, mentorat_id, suivi_id):
        s = self._get_suivi(request, mentorat_id, suivi_id)
        if not s:
            return Response({"error": "Suivi introuvable."}, status=status.HTTP_404_NOT_FOUND)
        s.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MentorCloturerMentoratView(APIView):
    """
    Le mentor demande la clôture ou l'arrêt d'un mentorat.
    La clôture effective n'est réalisée qu'après confirmation par l'AP.
    """
    permission_classes = [IsAuthenticated, IsMentor]

    def post(self, request, mentorat_id):
        mentor = request.user.mentor
        try:
            mentorat = Mentorat.objects.select_related('young_request').get(
                id=mentorat_id, mentor=mentor, status='ACTIVE'
            )
        except Mentorat.DoesNotExist:
            return Response({"error": "Mentorat introuvable ou déjà clôturé."},  status=status.HTTP_404_NOT_FOUND)

        if mentorat.cloture_en_attente:
            return Response(
                {"error": "Une demande de clôture est déjà en cours pour ce mentorat."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action        = request.data.get('action', 'CLOSED')
        message_jeune = request.data.get('message', '')
        reason        = request.data.get('reason', '')

        if action not in ['CLOSED', 'ABORTED']:
            return Response({"error": "Action invalide."}, status=status.HTTP_400_BAD_REQUEST)

        # Enregistrer la demande — la clôture effective sera faite par l'AP
        mentorat.cloture_en_attente = True
        mentorat.cloture_action_demandee = action
        mentorat.cloture_reason_demandee = reason
        mentorat.cloture_message_demandee = message_jeune
        if message_jeune:
            mentorat.message_cloture = message_jeune
        mentorat.save(update_fields=[
            'cloture_en_attente', 'cloture_action_demandee',
            'cloture_reason_demandee', 'cloture_message_demandee',
            'message_cloture',
        ])

        return Response({
            "success": True,
            "cloture_en_attente": True,
            "action": action,
            "message": "Votre demande de clôture a été transmise à votre AP pour confirmation.",
        })


class MentorUpdateJeuneView(APIView):
    """
    PATCH /mentor/mentorats/{id}/jeune/
    Le mentor peut mettre à jour la situation et le nom de l'établissement du jeune.
    """
    permission_classes = [IsAuthenticated, IsMentor]

    def patch(self, request, mentorat_id):
        mentor = request.user.mentor
        try:
            mentorat = Mentorat.objects.select_related(
                'young_request', 'young_request__etablissement'
            ).get(id=mentorat_id, mentor=mentor, status='ACTIVE')
        except Mentorat.DoesNotExist:
            return Response({"error": "Mentorat introuvable ou non actif."}, status=status.HTTP_404_NOT_FOUND)

        req = mentorat.young_request
        updated = []

        if 'situation' in request.data:
            val = request.data['situation']
            if val not in ('apprentissage', 'recherche', ''):
                return Response({"error": "Situation invalide."}, status=status.HTTP_400_BAD_REQUEST)
            req.situation = val
            updated.append('situation')

        if 'etablissement_id' in request.data:
            etab_id = request.data['etablissement_id']
            if etab_id:
                if not Etablissement.objects.filter(id=etab_id, is_active=True).exists():
                    return Response({"error": "Établissement introuvable."}, status=status.HTTP_400_BAD_REQUEST)
                req.etablissement_id = etab_id
                req.nom_etablissement = ''
                updated.extend(['etablissement_id', 'nom_etablissement'])
            else:
                req.etablissement_id = None
                updated.append('etablissement_id')
        elif 'nom_etablissement' in request.data:
            req.nom_etablissement = str(request.data['nom_etablissement']).strip()
            req.etablissement_id = None
            updated.extend(['nom_etablissement', 'etablissement_id'])

        if updated:
            req.save(update_fields=list(set(updated)))

        return Response({
            "situation":        req.situation or '',
            "situation_label":  req.get_situation_display() if req.situation else '',
            "etablissement_id": req.etablissement_id,
            "nom_etablissement": (
                req.etablissement.nom if req.etablissement_id else req.nom_etablissement
            ) or '',
        })


class MentorEtablissementsView(APIView):
    """
    GET /mentor/etablissements/  – liste des établissements du pôle du mentor
    """
    permission_classes = [IsAuthenticated, IsMentor]

    def get(self, request):
        pole_id = request.user.mentor.pole_id
        etabs = Etablissement.objects.filter(pole_id=pole_id, is_active=True).order_by('nom')
        return Response([
            {'id': e.id, 'nom': e.nom, 'code_postal': e.code_postal}
            for e in etabs
        ])


class DepartmentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(list(Department.objects.all().values('id', 'code', 'name')))