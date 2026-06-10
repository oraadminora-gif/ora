# api/views/public/contact.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
import logging

from core.models import ContactMessage

logger = logging.getLogger(__name__)

SUJET_LABELS = {
    'apprentice': 'Je suis apprenti(e)',
    'mentor':     'Je veux devenir mentor',
    'partner':    'Partenariat',
    'press':      'Presse / Média',
    'other':      'Autre',
}


class PublicContactView(APIView):
    """POST public — formulaire de contact (sans authentification)."""
    permission_classes = []

    def post(self, request):
        data = request.data

        # Validation
        required = ['name', 'email', 'subject', 'message']
        missing = [f for f in required if not str(data.get(f, '')).strip()]
        if missing:
            return Response(
                {'detail': f"Champs manquants : {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if data['subject'] not in SUJET_LABELS:
            return Response(
                {'detail': 'Sujet invalide.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Sauvegarde en base
        msg = ContactMessage.objects.create(
            name    = data['name'].strip(),
            email   = data['email'].strip().lower(),
            phone   = data.get('phone', '').strip(),
            subject = data['subject'],
            message = data['message'].strip(),
        )

        # Email de notification à l'équipe ORA
        sujet_label = SUJET_LABELS[data['subject']]
        phone_line  = f"Téléphone : {msg.phone}\n" if msg.phone else ''
        body = (
            f"Nouveau message de contact reçu sur le site ORA.\n\n"
            f"De : {msg.name}\n"
            f"Email : {msg.email}\n"
            f"{phone_line}"
            f"Sujet : {sujet_label}\n\n"
            f"Message :\n{msg.message}\n\n"
            f"---\n"
            f"Reçu le {msg.created_at.strftime('%d/%m/%Y à %Hh%M')}\n"
            f"ID message : #{msg.id}"
        )

        try:
            send_mail(
                subject        = f"[ORA Contact] {sujet_label} — {msg.name}",
                message        = body,
                from_email     = settings.DEFAULT_FROM_EMAIL,
                recipient_list = ['ora-france@outlook.com'],
                fail_silently  = False,
            )
        except Exception as e:
            logger.error("Échec envoi email contact #%d : %s", msg.id, e)

        # Email de confirmation à l'expéditeur
        try:
            send_mail(
                subject    = "ORA — Nous avons bien reçu votre message",
                message    = (
                    f"Bonjour {msg.name},\n\n"
                    f"Nous avons bien reçu votre message concernant : {sujet_label}.\n\n"
                    f"Notre équipe vous répondra dans les plus brefs délais.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe ORA — Objectif Réussir l'Apprentissage"
                ),
                from_email    = settings.DEFAULT_FROM_EMAIL,
                recipient_list = [msg.email],
                fail_silently  = True,  # Ne pas bloquer si l'adresse est invalide
            )
        except Exception:
            pass

        return Response({'detail': 'Message envoyé avec succès.', 'id': msg.id},
                        status=status.HTTP_201_CREATED)
