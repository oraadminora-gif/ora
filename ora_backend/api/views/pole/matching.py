import threading
from django.db import transaction, IntegrityError
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from core.models import YoungRequest, Mentor, Mentorat, MatchingDecision, Animateur
from core.services.matching import get_mentor_suggestions
from api.permissions import IsACP, CanMatchRequest


def _send_mentorat_emails(mentorat_id: int):
    """Envoie les emails de notification au mentor et à l'AP (thread non bloquant)."""
    try:
        from core.models import Mentorat as M
        m = M.objects.select_related(
            'mentor', 'mentor__association',
            'young_request',
            'ap_responsable', 'ap_responsable__association',
        ).get(id=mentorat_id)

        mentor = m.mentor
        jeune  = m.young_request
        ap     = m.ap_responsable

        diplome   = jeune.get_diplome_prepare_display() if jeune.diplome_prepare else ''
        situation = jeune.get_situation_display() if jeune.situation else ''
        etab      = jeune.nom_etablissement or ''

        # ── Email au mentor ──────────────────────────────────────
        if mentor.email:
            sujet_mentor = f"ORA Mentorat – Nouveau mentorat avec {jeune.first_name} {jeune.last_name}"
            corps_mentor = f"""Bonjour {mentor.first_name} {mentor.last_name},

Nous vous remercions chaleureusement pour votre engagement en tant que mentor au sein d'ORA Mentorat.

Un nouveau mentorat vient de vous être assigné. Voici les informations sur le/la jeune que vous allez accompagner :

Nom : {jeune.first_name} {jeune.last_name}
Email : {jeune.email or '—'}
Téléphone : {jeune.phone or '—'}
Commune : {jeune.city or '—'}
{f"Diplôme préparé : {diplome}" if diplome else ""}
{f"Situation : {situation}" if situation else ""}
{f"Établissement / CFA : {etab}" if etab else ""}

Description de sa demande :
{jeune.needs_description}

Votre animateur de suivi est : {ap.first_name} {ap.last_name} ({ap.email})

Merci encore pour votre implication. N'hésitez pas à contacter votre animateur pour toute question.

L'équipe ORA Mentorat
"""
            send_mail(
                subject=sujet_mentor,
                message=corps_mentor,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[mentor.email],
                fail_silently=True,
            )

        # ── Email à l'AP ─────────────────────────────────────────
        if ap and ap.email:
            sujet_ap = f"ORA – Nouveau mentorat à suivre : {mentor.first_name} {mentor.last_name} / {jeune.first_name} {jeune.last_name}"
            corps_ap = f"""Bonjour {ap.first_name} {ap.last_name},

Un nouveau mentorat vient d'être créé dans votre association {ap.association.name}. Vous en assurez le suivi.

Mentor
  Nom : {mentor.first_name} {mentor.last_name}
  Email : {mentor.email or '—'}
  Téléphone : {mentor.phone or '—'}

Jeune accompagné(e)
  Nom : {jeune.first_name} {jeune.last_name}
  Email : {jeune.email or '—'}
  Téléphone : {jeune.phone or '—'}
  Commune : {jeune.city or '—'}
  {f"Diplôme : {diplome}" if diplome else ""}
  {f"Situation : {situation}" if situation else ""}

Demande :
{jeune.needs_description}

Merci de prendre contact avec le mentor pour démarrer le suivi.

L'équipe ORA Mentorat
"""
            send_mail(
                subject=sujet_ap,
                message=corps_ap,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[ap.email],
                fail_silently=True,
            )
    except Exception:
        pass  # Non bloquant — l'affectation reste valide même si l'email échoue


class MatchingSuggestionsView(APIView):
    """
    ACP : Suggestions de mentors pour une demande.
    Voir tous les mentors du pôle (toutes associations).
    """
    permission_classes = [IsAuthenticated, IsACP, CanMatchRequest]

    def get(self, request, request_id):
        young_request = get_object_or_404(YoungRequest, id=request_id)
        self.check_object_permissions(request, young_request)

        suggestions = get_mentor_suggestions(young_request)

        data = []
        for s in suggestions:
            mentor = s["mentor"]
            data.append({
                "mentor_id":            mentor.id,
                "mentor_name":          f"{mentor.first_name} {mentor.last_name}",
                "association":          mentor.association.name,
                "association_id":       mentor.association_id,
                "city":                 mentor.city,
                "department":           mentor.department.name if mentor.department else None,
                "is_trained":           mentor.is_trained,
                "training_date":        mentor.training_date.isoformat() if mentor.training_date else None,
                "disponibilite_reelle": mentor.disponibilite_reelle,
                "max_capacity":         mentor.max_capacity,
                "nb_termines":          mentor.closed_mentorats,
                "score":                s["score"],
                "city_match":           s["city_match"],
                "department_match":     s["department_match"],
                "distance_km":          s.get("distance_km"),
                # Équité associations
                "equite_score":         s.get("equite_score", 0),
                "assoc_count":          s.get("assoc_count", 0),
                "assoc_min_count":      s.get("assoc_min_count", 0),
                # Formation
                "formation_score":      s.get("formation_score", 0),
                # Seuil "haute priorité" adapté au nouveau score max (370 pts)
                "priority":             "high" if s["score"] >= 200 else "medium" if s["score"] >= 120 else "low",
            })

        data.sort(key=lambda x: -x['score'])

        # Infos établissement de la demande
        etab_nom = (
            young_request.etablissement.nom
            if young_request.etablissement_id
            else young_request.nom_etablissement
        )
        return Response({
            "demande": {
                "id":              young_request.id,
                "jeune":           f"{young_request.first_name} {young_request.last_name}",
                "etablissement":   etab_nom or '',
                "diplome_prepare": young_request.get_diplome_prepare_display() if young_request.diplome_prepare else '',
                "situation":       young_request.get_situation_display() if young_request.situation else '',
                "pole":            young_request.pole.name if young_request.pole else None,
            },
            "suggestions": data[:10],
            "stats": {
                "total_disponibles": len(data),
                "score_eleve":       len([d for d in data if d['score'] >= 80]),
            }
        })


class AssignMentorView(APIView):
    """
    ACP : Assigne un mentor à une demande jeune.
    - Validation stricte avant création
    - Capture IntegrityError pour doublon
    - ap_id optionnel : si absent, AP auto (même association)
    """
    permission_classes = [IsAuthenticated, IsACP, CanMatchRequest]

    @transaction.atomic
    def post(self, request):
        data = request.data
        required = ['mentor_id', 'request_id']

        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {"error": f"Champs manquants : {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mentor_id   = data['mentor_id']
        request_id  = data['request_id']
        ap_id       = data.get('ap_id')
        justification = data.get('justification', '')
        ai_score    = data.get('ai_score')

        # ── Récupération des objets ──────────────────────────────
        try:
            mentor = (
                Mentor.objects
                .select_related('association', 'pole')
                .get(id=mentor_id)
            )
        except Mentor.DoesNotExist:
            return Response({"error": "Mentor introuvable"}, status=status.HTTP_404_NOT_FOUND)

        try:
            young_request = (
                YoungRequest.objects
                .select_related('pole')
                .get(id=request_id)
            )
        except YoungRequest.DoesNotExist:
            return Response({"error": "Demande introuvable"}, status=status.HTTP_404_NOT_FOUND)

        # ── Permissions objet ────────────────────────────────────
        self.check_object_permissions(request, young_request)

        # ── Vérification pôle ────────────────────────────────────
        user_pole_id = getattr(getattr(request.user, 'animateur', None), 'pole_id', None)
        if user_pole_id and mentor.pole_id != user_pole_id:
            return Response(
                {"error": "Ce mentor n'est pas dans votre pôle"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # ── Vérification capacité ────────────────────────────────
        if mentor.disponibilite_reelle <= 0:
            return Response(
                {"error": f"Ce mentor est complet (capacité max : {mentor.max_capacity})"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Vérification doublon ─────────────────────────────────
        if Mentorat.objects.filter(young_request=young_request).exists():
            # Corrige l'incohérence en base
            if young_request.status in ('NEW', 'PENDING'):
                young_request.status = 'ASSIGNED'
                young_request.save()
            return Response(
                {"error": "Cette demande a déjà un mentor assigné"},
                status=status.HTTP_409_CONFLICT,
            )

        # ── AP responsable ───────────────────────────────────────
        ap_responsable = self._get_ap_responsable(request, mentor, ap_id)
        if not ap_responsable:
            return Response(
                {
                    "error": "Aucun AP disponible pour le suivi de cette association",
                    "code": "NO_AP_AVAILABLE",
                    "mentor_association": mentor.association.name,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Création du mentorat ─────────────────────────────────
        try:
            mentorat = Mentorat.objects.create(
                mentor=mentor,
                young_request=young_request,
                ap_responsable=ap_responsable,
                pole=mentor.pole,
                status='ACTIVE',
                assigned_at=timezone.now().date(),
            )
        except IntegrityError:
            return Response(
                {"error": "Cette demande a déjà un mentor assigné (conflit base de données)"},
                status=status.HTTP_409_CONFLICT,
            )

        # ── Mises à jour ─────────────────────────────────────────
        mentor.disponibilite_reelle -= 1
        mentor.save()

        young_request.status = 'ASSIGNED'
        young_request.save()

        # ── Emails de notification (non bloquants) ───────────────
        threading.Thread(
            target=_send_mentorat_emails,
            args=(mentorat.id,),
            daemon=True,
        ).start()

        # ── Audit (ne bloque jamais l'assignation) ───────────────
        if ai_score is not None:
            try:
                MatchingDecision.objects.create(
                    young_request=young_request,
                    mentor=mentor,
                    decided_by=request.user,
                    ai_score=int(ai_score),
                    overridden=bool(justification),
                    justification=justification or '',
                )
            except Exception:
                pass

        return Response(
            {
                "success": True,
                "mentorat_id": mentorat.id,
                "details": {
                    "mentor": {
                        "id":          mentor.id,
                        "name":        f"{mentor.first_name} {mentor.last_name}",
                        "association": mentor.association.name,
                    },
                    "jeune": {
                        "id":   young_request.id,
                        "name": f"{young_request.first_name} {young_request.last_name}",
                    },
                    "ap_suivi": {
                        "id":          ap_responsable.id,
                        "name":        f"{ap_responsable.first_name} {ap_responsable.last_name}",
                        "association": ap_responsable.association.name,
                    },
                },
                "message": (
                    f"Mentorat créé. "
                    f"{ap_responsable.first_name} ({ap_responsable.association.name}) "
                    f"assure le suivi."
                ),
            },
            status=status.HTTP_201_CREATED,
        )

    # ── Helpers ──────────────────────────────────────────────────
    def _get_ap_responsable(self, request, mentor, ap_id=None):
        """Détermine l'AP responsable.
        1) ap_id fourni manuellement → on le valide
        2) Sinon : AP de l'association du mentor dans le même pôle
        """
        user = request.user

        if ap_id:
            try:
                ap = Animateur.objects.get(id=ap_id, is_active=True)
                if hasattr(user, 'animateur') and ap.pole_id != user.animateur.pole_id:
                    return None
                return ap
            except Animateur.DoesNotExist:
                return None

        # Priorité : AP de l'association du mentor, sinon ACP du pôle
        return (
            Animateur.objects.filter(
                association=mentor.association,
                pole=mentor.pole,
                is_active=True,
            )
            .order_by('is_acp')  # AP-only avant ACP
            .first()
        )
