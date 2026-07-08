import logging
import threading

from django.utils import timezone
from django.core.mail import EmailMessage
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.models import AcceptanceMentorat

logger = logging.getLogger(__name__)


def _send_response_notification(acceptance_id: int):
    try:
        acc = AcceptanceMentorat.objects.select_related(
            'mentorat', 'mentorat__mentor',
            'mentorat__young_request', 'mentorat__pole',
            'mentorat__ap_responsable',
            'assigned_by',
        ).get(id=acceptance_id)
    except AcceptanceMentorat.DoesNotExist:
        return

    m      = acc.mentorat
    mentor = m.mentor
    jeune  = m.young_request
    ap     = m.ap_responsable
    acp    = acc.assigned_by

    action_label = "ACCEPTÉ" if acc.statut == 'ACCEPTE' else "REFUSÉ"
    pole_code    = m.pole.code or m.pole.name

    to_emails = []
    cc_emails = []
    if acp and acp.email:
        to_emails.append(acp.email)
    if ap and ap.email and ap.email not in to_emails:
        cc_emails.append(ap.email)

    if not to_emails and not cc_emails:
        return

    sujet = f"{pole_code} – Le mentor {mentor.first_name} {mentor.last_name} a {action_label} le mentorat"

    if acc.statut == 'ACCEPTE':
        corps = (
            f"Bonjour,\n\n"
            f"Le mentor {mentor.first_name} {mentor.last_name} a ACCEPTÉ le mentorat "
            f"avec {jeune.first_name} {jeune.last_name}.\n\n"
            f"Le mentorat est en cours. Vous pouvez en assurer le suivi sur OPORA : "
            f"{settings.FRONTEND_URL}\n\n"
            f"Cordialement,\nOPORA\nobjectifreussirapprentissage.eu"
        )
    else:
        corps = (
            f"Bonjour,\n\n"
            f"Le mentor {mentor.first_name} {mentor.last_name} a REFUSÉ le mentorat "
            f"avec {jeune.first_name} {jeune.last_name}.\n\n"
            f"Merci de prendre les dispositions nécessaires pour trouver un autre mentor "
            f"ou contacter le jeune directement.\n\n"
            f"Cordialement,\nOPORA\nobjectifreussirapprentissage.eu"
        )

    try:
        msg = EmailMessage(
            subject=sujet,
            body=corps,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to_emails or cc_emails,
            cc=cc_emails if to_emails else [],
            reply_to=[settings.DEFAULT_FROM_EMAIL],
        )
        msg.send(fail_silently=False)
    except Exception as e:
        logger.error("Email réponse acceptance failed (mentorat=%s): %s", m.id, e)


class PublicMentoratAcceptanceView(APIView):
    permission_classes = []

    def get(self, request, token):
        try:
            acc = AcceptanceMentorat.objects.select_related(
                'mentorat', 'mentorat__mentor',
                'mentorat__young_request', 'mentorat__pole',
            ).get(token=token)
        except AcceptanceMentorat.DoesNotExist:
            return Response({"error": "Lien invalide ou expiré."}, status=status.HTTP_404_NOT_FOUND)

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
            return Response({"error": "Lien invalide ou expiré."}, status=status.HTTP_404_NOT_FOUND)

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

        acc.statut     = 'ACCEPTE' if action == 'accept' else 'REFUSE'
        acc.repondu_at = timezone.now()
        acc.save()

        threading.Thread(
            target=_send_response_notification,
            args=(acc.id,),
            daemon=True,
        ).start()

        return Response({
            "success": True,
            "statut":  acc.statut,
            "message": "Votre réponse a bien été enregistrée. Merci !",
        })
