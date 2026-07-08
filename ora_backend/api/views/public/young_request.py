import threading
import logging
from datetime import date

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.core.mail import EmailMessage
from django.conf import settings

from core.models import YoungRequest, Pole, Department, Animateur
from core.services.geocoding import geocode_commune

logger = logging.getLogger(__name__)

# ── Libellés lisibles ────────────────────────────────────────────────────────
_DIPLOME_LABELS = dict(YoungRequest.DIPLOME_CHOICES)
_SITUATION_LABELS = dict(YoungRequest.SITUATION_CHOICES)
_GENDER_LABELS = {'M': 'Garçon', 'F': 'Fille', 'O': 'Autre'}


def _geocode_and_save(young_request_id: int, commune: str, code_postal: str):
    coords = geocode_commune(commune, code_postal)
    if coords:
        YoungRequest.objects.filter(id=young_request_id).update(
            latitude=coords[0],
            longitude=coords[1],
        )


def _send_confirmation_to_jeune(yr: YoungRequest):
    """Accusé de réception envoyé au jeune après sa demande."""
    if not yr.email:
        return
    try:
        msg = EmailMessage(
            subject="ORA Mentorat — Confirmation de votre demande",
            body=(
                f"Bonjour {yr.first_name},\n\n"
                "Nous avons bien reçu votre demande de mentorat et nous vous en remercions chaleureusement.\n\n"
                "Votre dossier est en cours de traitement. Un animateur de votre pôle de référence "
                "vous contactera dans les meilleurs délais afin de vous proposer un accompagnement "
                "personnalisé adapté à votre situation.\n\n"
                "En attendant, n'hésitez pas à revenir vers nous si vous avez des questions.\n\n"
                "Merci de faire confiance à ORA Mentorat pour votre réussite !\n\n"
                "Bien cordialement,\n"
                "L'équipe ORA Mentorat\n"
                "objectifreussirapprentissage.eu"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[yr.email],
            reply_to=[settings.DEFAULT_FROM_EMAIL],
        )
        msg.send(fail_silently=False)
    except Exception as e:
        logger.error("Email confirmation jeune failed (id=%s): %s", yr.id, e)


def _send_notification_to_pole(yr: YoungRequest, pole: Pole):
    """Notification envoyée à l'ACP (To) et aux AP (Cc) du pôle."""
    animateurs = list(
        Animateur.objects.filter(pole=pole, is_active=True).select_related('pole')
    )
    acps = [a for a in animateurs if a.is_acp and a.email]
    aps  = [a for a in animateurs if not a.is_acp and a.is_ap and a.email]

    to_emails = [a.email for a in acps]
    cc_emails = [a.email for a in aps]

    if not to_emails and not cc_emails:
        return

    today = date.today().strftime('%d %m %Y')
    pole_code = pole.code or pole.name

    # ── Résumé des champs du formulaire ──────────────────────────────────────
    champs = []
    champs.append(f"Prénom : {yr.first_name}")
    champs.append(f"Nom : {yr.last_name}")
    if yr.email:
        champs.append(f"Email : {yr.email}")
    if yr.phone:
        champs.append(f"Téléphone : {yr.phone}")
    if yr.birth_date:
        bd = yr.birth_date
        bd_str = bd.strftime('%d/%m/%Y') if hasattr(bd, 'strftime') else str(bd)
        champs.append(f"Date de naissance : {bd_str}")
    if yr.gender:
        champs.append(f"Genre : {_GENDER_LABELS.get(yr.gender, yr.gender)}")
    if yr.commune:
        champs.append(f"Commune : {yr.commune}")
    if yr.code_postal:
        champs.append(f"Code postal : {yr.code_postal}")
    if yr.situation:
        champs.append(f"Situation : {_SITUATION_LABELS.get(yr.situation, yr.situation)}")
    if yr.diplome_prepare:
        champs.append(f"Diplôme préparé : {_DIPLOME_LABELS.get(yr.diplome_prepare, yr.diplome_prepare)}")
    if yr.nom_etablissement:
        champs.append(f"Établissement : {yr.nom_etablissement}")
    if yr.needs_description:
        champs.append(f"Demande / besoin :\n  {yr.needs_description}")

    champs_texte = "\n· ".join(champs)

    corps = (
        f"Bonjour,\n\n"
        f"Ce mail automatique est pour ton action d'animateur de Pôle coordonnateur "
        f"selon votre organisation locale au sein de ORA {pole_code}.\n\n"
        f"Voici les informations et la demande laissées par le jeune :\n\n"
        f"· {champs_texte}\n\n"
        f"Merci de te rendre sur OPORA pour y donner une suite dans les meilleurs délais : "
        f"affectation à un des mentors du pôle, éventuelle redistribution vers un autre pôle "
        f"voisin (suivant localisation Code Postal).\n\n"
        f"Si la demande ne provenait pas d'un jeune, merci de la traiter en conséquence "
        f"directement par mail, hors SI, depuis ton adresse mail de pôle.\n\n"
        f"En cas de difficulté, ne pas hésiter à recontacter le Webmaster OPORA "
        f"ou l'animateur du Réseau des Pôles.\n\n"
        f"Bien à toi,\n"
        f"OPORA\n"
        f"objectifreussirapprentissage.eu"
    )

    try:
        msg = EmailMessage(
            subject=f"OPORA : nouvelle demande de jeune pour ton pôle en date du {today}",
            body=corps,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to_emails or cc_emails,
            cc=cc_emails if to_emails else [],
            reply_to=[settings.DEFAULT_FROM_EMAIL],
        )
        msg.send(fail_silently=False)
    except Exception as e:
        logger.error("Email notification pôle failed (pole=%s, yr=%s): %s", pole_code, yr.id, e)


def _post_create_tasks(yr: YoungRequest, pole: Pole | None,
                       commune: str, code_postal: str):
    """Tâches asynchrones après création : géocodage + emails."""
    if commune or code_postal:
        _geocode_and_save(yr.id, commune, code_postal)
    _send_confirmation_to_jeune(yr)
    if pole:
        _send_notification_to_pole(yr, pole)


class CreateYoungRequestView(APIView):
    """
    Création publique d'une demande jeune.
    Pas d'authentification requise.
    """
    permission_classes = []

    def post(self, request):
        data = request.data

        required = ['first_name', 'last_name', 'needs_description']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {"error": f"Champs obligatoires manquants: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        pole = None
        dept = None

        pole_id = data.get('pole_id')
        if pole_id:
            try:
                pole = Pole.objects.get(id=pole_id, status='ACTIVE')
            except Pole.DoesNotExist:
                return Response(
                    {"error": "Pôle introuvable ou inactif."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            department_code = data.get('department_code')
            if department_code:
                try:
                    dept = Department.objects.get(code=department_code)
                    pole = Pole.objects.filter(departments=dept, status='ACTIVE').first()
                except Department.DoesNotExist:
                    pass

        commune     = data.get('commune', '').strip()
        code_postal = data.get('code_postal', '').strip()

        young_request = YoungRequest.objects.create(
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            birth_date=data.get('birth_date'),
            gender=data.get('gender', ''),
            city=commune or data.get('city', ''),
            commune=commune,
            code_postal=code_postal,
            department=dept,
            nom_etablissement=data.get('nom_etablissement', '').strip(),
            diplome_prepare=data.get('diplome_prepare', ''),
            situation=data.get('situation', ''),
            needs_description=data['needs_description'],
            pole=pole,
            status='NEW',
        )

        # Géocodage + emails en arrière-plan (ne bloque pas la réponse)
        threading.Thread(
            target=_post_create_tasks,
            args=(young_request, pole, commune, code_postal),
            daemon=True,
        ).start()

        return Response({
            "success": True,
            "message": "Votre demande a été enregistrée. Un animateur vous contactera prochainement.",
            "demande_id": young_request.id,
            "pole_attribue": pole.name if pole else "À déterminer"
        }, status=status.HTTP_201_CREATED)
