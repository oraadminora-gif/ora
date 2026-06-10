# api/views/public/mentor_candidature.py
import logging
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.models import CandidatureMentor, Pole, Department

logger = logging.getLogger(__name__)

CANDIDATURE_DEST = 'ora-france@outlook.com'


def _dept_code_from_cp(code_postal: str) -> str:
    """Extrait le code département depuis un code postal."""
    cp = (code_postal or '').strip()
    if cp.startswith('97'):
        return cp[:3]
    return cp[:2]


class PublicMentorCandidatureView(APIView):
    """POST public — soumettre une candidature mentor (sans authentification)."""
    permission_classes = []

    def post(self, request):
        data = request.data

        # Champs obligatoires
        required = ['first_name', 'last_name', 'email', 'code_postal']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {'detail': f"Champs manquants : {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Détection du pôle par code postal
        dept_code = _dept_code_from_cp(data['code_postal'])
        pole = None
        try:
            dept = Department.objects.get(code=dept_code)
            pole = Pole.objects.filter(
                departments=dept, status='ACTIVE'
            ).first()
        except Department.DoesNotExist:
            pass

        first_name  = data['first_name'].strip()
        last_name   = data['last_name'].strip().upper()
        email       = data['email'].strip().lower()
        phone       = data.get('phone', '').strip()
        code_postal = data['code_postal'].strip()
        commune     = data.get('commune', '').strip()
        motivation  = data.get('motivation', '').strip()

        candidature = CandidatureMentor.objects.create(
            first_name  = first_name,
            last_name   = last_name,
            email       = email,
            phone       = phone,
            code_postal = code_postal,
            commune     = commune,
            pole        = pole,
            motivation  = motivation,
        )

        # ── Envoi email de notification ──────────────────────────────────
        pole_info = pole.name if pole else 'Aucun pôle détecté pour ce département'
        localisation = f"{commune} ({code_postal})" if commune else code_postal

        subject = f"[ORA] Nouvelle candidature mentor — {first_name} {last_name}"

        body = f"""Bonjour,

Une nouvelle candidature mentor vient d'être soumise sur le site ORA.

─────────────────────────────────────────
COORDONNÉES DU CANDIDAT
─────────────────────────────────────────
Prénom       : {first_name}
Nom          : {last_name}
Email        : {email}
Téléphone    : {phone or 'Non renseigné'}
Localisation : {localisation}

─────────────────────────────────────────
PÔLE DÉTECTÉ
─────────────────────────────────────────
{pole_info}

─────────────────────────────────────────
MOTIVATION
─────────────────────────────────────────
{motivation or 'Non renseignée'}

─────────────────────────────────────────
Candidature n° {candidature.id}
"""

        try:
            send_mail(
                subject       = subject,
                message       = body,
                from_email    = settings.DEFAULT_FROM_EMAIL,
                recipient_list= [CANDIDATURE_DEST],
                fail_silently = False,
            )
        except Exception as exc:
            logger.error("Échec envoi email candidature mentor #%s : %s", candidature.id, exc)

        return Response({
            'id':           candidature.id,
            'pole_name':    pole.name if pole else None,
            'pole_found':   pole is not None,
        }, status=status.HTTP_201_CREATED)
