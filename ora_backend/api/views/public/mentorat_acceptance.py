import logging
import threading

from django.db import transaction
from django.utils import timezone
from django.core.mail import EmailMessage
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle

from core.models import AcceptanceMentorat

logger = logging.getLogger(__name__)


def _send_response_notification(acc: AcceptanceMentorat):
    """
    Reçoit l'objet AcceptanceMentorat déjà chargé (select_related) en mémoire.
    En cas de refus, le mentorat est supprimé en base AVANT l'envoi de ce mail :
    on ne doit donc jamais re-requêter la DB ici, seulement lire les attributs
    déjà résolus par select_related sur l'objet Python passé en argument.
    """
    m      = acc.mentorat
    mentor = m.mentor
    jeune  = m.young_request
    ap     = m.ap_responsable
    acp    = acc.assigned_by

    action_label = "ACCEPTÉ" if acc.statut == 'ACCEPTE' else "REFUSÉ"
    pole_code    = m.pole.code or m.pole.name

    # Acceptation -> uniquement l'AP responsable du suivi.
    # Refus -> uniquement celui qui a fait l'affectation (ACP ou AP).
    if acc.statut == 'ACCEPTE':
        to_emails = [ap.email] if ap and ap.email else []
    else:
        to_emails = [acp.email] if acp and acp.email else []

    if not to_emails:
        return

    sujet = f"[OPORA] Pôle {pole_code} - Le mentor {mentor.first_name} {mentor.last_name} a {action_label} le mentorat"

    if acc.statut == 'ACCEPTE':
        corps = (
            f"Bonjour,\n\n"
            f"Le mentor {mentor.first_name} {mentor.last_name} a ACCEPTÉ le mentorat "
            f"avec {jeune.first_name} {jeune.last_name}.\n\n"
            f"Le mentorat est en cours. En assurer le suivi sur OPORA : "
            f"{settings.FRONTEND_URL}\n\n"
            f"Cordialement,\nOPORA\nobjectifreussirapprentissage.eu"
        )
    else:
        corps = (
            f"Bonjour,\n\n"
            f"Le mentor {mentor.first_name} {mentor.last_name} a REFUSÉ le mentorat "
            f"avec {jeune.first_name} {jeune.last_name}.\n\n"
            f"Merci de prendre les dispositions nécessaires pour trouver un autre mentor.\n\n"
            f"Cordialement,\nOPORA\nobjectifreussirapprentissage.eu"
        )

    try:
        msg = EmailMessage(
            subject=sujet,
            body=corps,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to_emails,
            reply_to=[settings.DEFAULT_FROM_EMAIL],
        )
        msg.send(fail_silently=False)
    except Exception as e:
        logger.error("Email réponse acceptance failed (mentorat=%s): %s", m.id, e)


class PublicMentoratAcceptanceView(APIView):
    permission_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'public_write'

    def get(self, request, token):
        try:
            acc = AcceptanceMentorat.objects.select_related(
                'mentorat', 'mentorat__mentor',
                'mentorat__young_request', 'mentorat__pole',
            ).get(token=token)
        except AcceptanceMentorat.DoesNotExist:
            return Response(
                {"error": "Lien invalide, déjà traité (mentor réaffecté depuis) ou expiré."},
                status=status.HTTP_404_NOT_FOUND,
            )

        m = acc.mentorat
        return Response({
            "already_responded": acc.statut != 'PENDING',
            "statut":      acc.statut,
            "mentor_name": f"{m.mentor.first_name} {m.mentor.last_name}",
            "jeune_name":  f"{m.young_request.first_name} {m.young_request.last_name}",
            "pole_code":   m.pole.code or m.pole.name,
            "repondu_at":  acc.repondu_at.isoformat() if acc.repondu_at else None,
        })

    def post(self, request, token):
        try:
            acc = AcceptanceMentorat.objects.select_related(
                'mentorat', 'mentorat__mentor',
                'mentorat__young_request', 'mentorat__pole',
                'mentorat__ap_responsable',
                'assigned_by',
            ).get(token=token)
        except AcceptanceMentorat.DoesNotExist:
            return Response(
                {"error": "Lien invalide, déjà traité (mentor réaffecté depuis) ou expiré."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if acc.statut != 'PENDING':
            return Response({
                "already_responded": True,
                "statut": acc.statut,
                "message": "Vous avez déjà répondu à cette affectation.",
            })

        action = request.data.get('action', '')
        if action not in ('accept', 'refuse'):
            return Response(
                {"error": "Action invalide. Valeurs acceptées : accept, refuse."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        m = acc.mentorat
        acc.statut     = 'ACCEPTE' if action == 'accept' else 'REFUSE'
        acc.repondu_at = timezone.now()

        with transaction.atomic():
            if action == 'accept':
                acc.save()
                # PENDING → ACTIVE : décompte la disponibilité du mentor
                m.activer()
                m.young_request.status = 'ASSIGNED'
                m.young_request.save()
            else:
                # Le mentor refuse : le mentorat PENDING n'a jamais réellement
                # démarré, on le supprime pour libérer la demande — elle
                # réapparaît immédiatement sur le tableau de matching pour
                # être affectée à un autre mentor. La suppression du
                # mentorat entraîne (CASCADE) celle de cet AcceptanceMentorat.
                young_request = m.young_request
                m.delete()
                # Remet la demande à NEW : sinon son statut reste bloqué sur
                # PENDING (fixé lors de la proposition) et elle affiche
                # "En attente" indéfiniment sur le tableau de bord, avec les
                # boutons Refuser/Transférer désactivés à tort.
                young_request.status = 'NEW'
                young_request.save()

        threading.Thread(
            target=_send_response_notification,
            args=(acc,),
            daemon=True,
        ).start()

        return Response({
            "success": True,
            "statut":  acc.statut,
            "message": (
                "Merci, votre acceptation a bien été enregistrée. Le mentorat est désormais actif !"
                if action == 'accept' else
                "Votre refus a bien été enregistré. Merci de nous en avoir informés."
            ),
        })
