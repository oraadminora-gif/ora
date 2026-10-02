import threading
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle

from django.core.mail import EmailMessage
from django.conf import settings

from core.models import YoungRequest, Pole, Department, Animateur
from core.models.young_request import validate_birth_date
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


def _send_notification_to_pole(yr: YoungRequest, pole: Pole):
    """Notification envoyée au(x) ACP du pôle (pas de copie aux AP)."""
    acps = Animateur.objects.filter(pole=pole, is_active=True, is_acp=True).exclude(email='')

    to_emails = [a.email for a in acps]

    if not to_emails:
        return

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
    if yr.date_previsionnelle:
        label_date = (
            "Date prévisionnelle d'obtention du diplôme"
            if yr.situation == 'apprentissage'
            else 'Date prévisionnelle de début de formation'
        )
        champs.append(f"{label_date} : {yr.date_previsionnelle.strftime('%d/%m/%Y')}")
    if yr.needs_description:
        champs.append(f"Demande / besoin :\n  {yr.needs_description}")

    champs_texte = "\n· ".join(champs)

    corps = (
        f"Bonjour,\n\n"
        f"Ce mail automatique est pour ton action d'Animateur de Pôle coordonnateur.\n\n"
        f"Voici les informations et la demande laissées par le jeune :\n\n"
        f"· {champs_texte}\n\n"
        f"Merci de te rendre sur OPORA pour y donner une suite dans les meilleurs délais : "
        f"affectation à un des mentors du pôle, éventuelle redistribution vers un autre pôle "
        f"voisin (suivant localisation Code Postal) ou pas de suite à donner (pas de disponibilité Mentor).\n\n"
        f"Si la demande ne provenait pas d'un jeune, merci de la traiter en conséquence "
        f"directement par mail, hors SI, depuis ton adresse mail de pôle.\n\n"
        f"Bien à toi,\n"
        f"OPORA\n"
        f"objectifreussirapprentissage.eu"
    )

    try:
        msg = EmailMessage(
            subject=f"[OPORA] Pôle {pole_code}: action requise : nouvelle demande de jeune pour ton pole",
            body=corps,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to_emails,
            reply_to=[settings.DEFAULT_FROM_EMAIL],
        )
        msg.send(fail_silently=False)
    except Exception as e:
        logger.error("Email notification pôle failed (pole=%s, yr=%s): %s", pole_code, yr.id, e)


def _post_create_tasks(yr: YoungRequest, pole: Pole | None,
                       commune: str, code_postal: str):
    """Tâches asynchrones après création : géocodage + email au pôle.
    Le jeune ne reçoit plus d'accusé de réception par mail (supprimé) —
    seul le pôle (ACP/AP) est notifié pour traiter la demande.
    """
    if commune or code_postal:
        _geocode_and_save(yr.id, commune, code_postal)
    if pole:
        _send_notification_to_pole(yr, pole)


class CreateYoungRequestView(APIView):
    """
    Création publique d'une demande jeune.
    Pas d'authentification requise.
    """
    permission_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'public_write'

    def post(self, request):
        data = request.data

        required = ['first_name', 'last_name', 'needs_description']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {"error": f"Champs obligatoires manquants: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        birth_date_error = validate_birth_date(data.get('birth_date'))
        if birth_date_error:
            return Response({"error": birth_date_error}, status=status.HTTP_400_BAD_REQUEST)

        situation = data.get('situation', '')
        if situation and not data.get('date_previsionnelle'):
            champ = (
                "la date prévisionnelle d'obtention du diplôme"
                if situation == 'apprentissage'
                else 'la date prévisionnelle de début de formation'
            )
            return Response(
                {"error": f"Merci de renseigner {champ}."},
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
            situation=situation,
            date_previsionnelle=data.get('date_previsionnelle') or None,
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
