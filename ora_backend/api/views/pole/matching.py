import logging
import threading
from django.db import transaction, IntegrityError
from django.utils import timezone
from django.core.mail import EmailMessage
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from core.models import YoungRequest, Mentor, Mentorat, MatchingDecision, Animateur
from core.services.matching import get_mentor_suggestions
from api.permissions import IsACP, CanMatchRequest

logger = logging.getLogger(__name__)

_GENDER_LABELS = {'M': 'Garçon', 'F': 'Fille', 'O': 'Autre'}

RECOMMANDATIONS = """
_______________________________________________________

Recommandations Importantes

1/ Vous établirez le premier contact avec l'apprenti, par téléphone dès que cela vous sera possible. Ce premier contact est essentiel pour bien comprendre quelle est la problématique pour laquelle l'apprenti demande un soutien. À l'occasion de ce premier contact, vous pourrez convenir des modalités de vos échanges ultérieurs, en particulier la première rencontre « de visu » en terrain neutre (recommandé !)

1bis/ N'oubliez pas que votre Animateur d'association du Pôle est à votre disposition pour vous conseiller et vous soutenir dans votre démarche !

2/ Si, à la suite de ce premier contact, vous décidiez de ne pas prendre en charge ce mentorat (et ce quelle qu'en soit la raison), vous devez le signaler à votre Animateur d'association du Pôle, par mail, et en documentant les informations que vous aurez pu collecter (en particulier la problématique de l'apprenti, et ses éventuelles contraintes horaires ou géographiques…). Ceci afin que nous puissions trouver un autre mentor au vu de ces éléments.

3/ Si l'apprenti ne répond pas à votre appel téléphonique, laissez un message vocal, et accompagnez par un SMS lui demandant de vous rappeler. Si, après quelques tentatives (laissez passer 3 jours entre chaque tentative, et espacez ensuite d'une ou deux semaines), l'apprenti n'a envoyé aucune réponse, merci de le signaler à votre Animateur d'association du Pôle, par mail. Selon vos éléments, nous clôturerons sa demande comme n'ayant pas aboutie (sans contact).

4/ Si l'apprenti ne semble pas bien comprendre pourquoi vous le contactez (cela peut arriver en particulier si sa demande remonte à quelques mois ou si l'inscription a été faite à l'initiative d'un formateur de son CFA ou d'un tiers), essayez quand même de le faire parler pour vous faire une idée plus précise de la situation ; puis remontez ces informations à votre Animateur d'association du Pôle.

En cas de difficulté, n'hésitez pas à contacter votre Animateur d'association du Pôle !
"""


def _send_mentorat_emails(mentorat_id: int, acp_animateur_id: int | None = None):
    """Email d'affectation au mentor (To) + AP suivi (Cc) avec liens accept/refuse."""
    try:
        from core.models import AcceptanceMentorat, Animateur as Anim, Mentorat as M
        m = M.objects.select_related(
            'mentor', 'pole',
            'young_request',
            'ap_responsable',
        ).get(id=mentorat_id)

        mentor = m.mentor
        jeune  = m.young_request
        ap     = m.ap_responsable
        pole_code = m.pole.code or m.pole.name

        acp = None
        if acp_animateur_id:
            try:
                acp = Anim.objects.get(id=acp_animateur_id)
            except Anim.DoesNotExist:
                pass

        # Créer le token d'acceptation
        acceptance = AcceptanceMentorat.create_for_mentorat(m, assigned_by=acp)
        accept_url = f"{settings.FRONTEND_URL}/accepter-mentorat/{acceptance.token}?action=accept"
        refuse_url = f"{settings.FRONTEND_URL}/accepter-mentorat/{acceptance.token}?action=refuse"

        # ── Résumé des infos du jeune ────────────────────────────
        diplome   = jeune.get_diplome_prepare_display() if jeune.diplome_prepare else ''
        situation = jeune.get_situation_display() if jeune.situation else ''
        bd = jeune.birth_date
        bd_str = bd.strftime('%d/%m/%Y') if hasattr(bd, 'strftime') else str(bd) if bd else ''

        champs = []
        champs.append(f"Prénom : {jeune.first_name}")
        champs.append(f"Nom : {jeune.last_name}")
        if jeune.email:
            champs.append(f"Email : {jeune.email}")
        if jeune.phone:
            champs.append(f"Téléphone : {jeune.phone}")
        if bd_str:
            champs.append(f"Date de naissance : {bd_str}")
        if jeune.gender:
            champs.append(f"Genre : {_GENDER_LABELS.get(jeune.gender, jeune.gender)}")
        if jeune.commune:
            champs.append(f"Commune : {jeune.commune}")
        if jeune.code_postal:
            champs.append(f"Code postal : {jeune.code_postal}")
        if situation:
            champs.append(f"Situation : {situation}")
        if diplome:
            champs.append(f"Diplôme préparé : {diplome}")
        if jeune.nom_etablissement:
            champs.append(f"Établissement / CFA : {jeune.nom_etablissement}")
        if jeune.needs_description:
            champs.append(f"Demande / besoin :\n  {jeune.needs_description}")

        champs_texte = "\n· ".join(champs)

        ap_info = ""
        if ap:
            ap_info = (
                f"\nVotre Animateur de Pôle chargé du suivi de ce mentorat :\n"
                f"  {ap.first_name} {ap.last_name}"
                f"{' — ' + ap.email if ap.email else ''}"
                f"{' — ' + ap.phone if ap.phone else ''}\n"
            )

        corps_mentor = (
            f"Bonjour {mentor.first_name} {mentor.last_name},\n\n"
            f"Voici une demande d'un jeune et les informations qu'il a laissées à l'inscription :\n\n"
            f"· {champs_texte}\n\n"
            f"Je te l'affecte aujourd'hui par ce message. Je te remercie d'en prendre connaissance "
            f"et de bien vouloir en accuser bonne réception.\n\n"
            f"Ce présent mail et ta réponse constituent à partir d'aujourd'hui ton contrat de mission "
            f"pour réaliser ce mentorat dans le respect de la charte ORA et conformément à ta formation Mentor.\n\n"
            f"👉 J'ACCEPTE ce mentorat : {accept_url}\n\n"
            f"👉 Je REFUSE ce mentorat : {refuse_url}\n"
            f"{ap_info}\n"
            f"Bien sûr ton Animateur de Pôle reste à ta disposition pour toute difficulté ou question.\n\n"
            f"Merci pour ton engagement, bon mentorat !\n\n"
            f"Cordialement,\n"
            f"ORA {pole_code}\n"
            f"OPORA\nobjectifreussirapprentissage.eu"
            f"{RECOMMANDATIONS}"
        )

        if mentor.email:
            reply_to = []
            if acp and acp.email:
                reply_to = [acp.email]
            elif ap and ap.email:
                reply_to = [ap.email]

            cc_emails = [ap.email] if (ap and ap.email) else []

            msg = EmailMessage(
                subject=f"{pole_code} Attention ! Affectation d'un nouveau mentorat !",
                body=corps_mentor,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[mentor.email],
                cc=cc_emails,
                reply_to=reply_to or [settings.DEFAULT_FROM_EMAIL],
            )
            msg.send(fail_silently=False)

    except Exception as e:
        logger.error("Email affectation mentorat failed (mentorat=%s): %s", mentorat_id, e)


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
        acp_animateur = getattr(request.user, 'animateur', None)
        threading.Thread(
            target=_send_mentorat_emails,
            args=(mentorat.id, acp_animateur.id if acp_animateur else None),
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
