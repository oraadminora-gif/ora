import logging
import threading

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.core.mail import EmailMessage
from django.conf import settings

from core.models import EvaluationMentor, Animateur

logger = logging.getLogger(__name__)

STAR_LABELS = {1: '★ Insuffisant', 2: '★★ Passable', 3: '★★★ Satisfaisant', 4: '★★★★ Bien', 5: '★★★★★ Excellent'}


def _send_eval_results_to_acp(ev_id: int):
    """Envoie les résultats de l'évaluation à l'ACP du pôle."""
    try:
        ev = EvaluationMentor.objects.select_related(
            'mentorat', 'mentorat__mentor',
            'mentorat__young_request', 'mentorat__pole',
        ).get(id=ev_id)

        m      = ev.mentorat
        jeune  = m.young_request
        mentor = m.mentor
        pole   = m.pole

        acp = Animateur.objects.filter(
            pole=pole, is_acp=True, is_active=True
        ).first()

        if not acp or not acp.email:
            return

        pole_code = pole.code or pole.name

        def stars(val):
            if val is None:
                return '— (non renseigné)'
            return STAR_LABELS.get(val, str(val))

        corps = (
            f"Bonjour {acp.first_name},\n\n"
            f"Le jeune {jeune.first_name} {jeune.last_name} vient de soumettre son évaluation "
            f"du mentorat avec {mentor.first_name} {mentor.last_name}.\n\n"
            f"─────────────────────────────────\n"
            f"Résultats de l'évaluation\n"
            f"─────────────────────────────────\n"
            f"1. Tes objectifs personnels ont-ils été atteints ?\n"
            f"   {stars(ev.rating_objectifs)}\n\n"
            f"2. As-tu apprécié la qualité de l'accompagnement par le Mentor ?\n"
            f"   {stars(ev.rating_accompagnement)}\n\n"
            f"3. Recommanderais-tu ORA à un copain ?\n"
            f"   {stars(ev.rating_recommandation)}\n\n"
            f"Commentaire libre :\n"
            f"  {ev.comment or '(aucun commentaire)'}\n\n"
            f"─────────────────────────────────\n\n"
            f"Soumis le : {ev.submitted_at.strftime('%d/%m/%Y à %H:%M')}\n\n"
            f"Cordialement,\nOPORA\nobjectifreussirapprentissage.eu"
        )

        msg = EmailMessage(
            subject=f"{pole_code} – Évaluation reçue : {jeune.first_name} {jeune.last_name} / {mentor.first_name} {mentor.last_name}",
            body=corps,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[acp.email],
            reply_to=[settings.DEFAULT_FROM_EMAIL],
        )
        msg.send(fail_silently=False)
    except Exception as e:
        logger.error("Email résultats évaluation ACP failed (ev=%s): %s", ev_id, e)


class PublicEvaluationView(APIView):
    """
    Évaluation publique du mentor par le jeune via lien tokenisé.
    GET  /api/public/evaluation/{token}/ → infos pour afficher le formulaire
    POST /api/public/evaluation/{token}/ → soumettre les 3 notes + commentaire
    """
    permission_classes = [AllowAny]

    def _get_evaluation(self, token):
        try:
            return EvaluationMentor.objects.select_related(
                'mentorat__mentor', 'mentorat__young_request', 'mentorat__pole',
            ).get(token=token)
        except EvaluationMentor.DoesNotExist:
            return None

    def get(self, request, token):
        ev = self._get_evaluation(token)
        if not ev:
            return Response({'error': 'Lien invalide ou expiré.'}, status=status.HTTP_404_NOT_FOUND)

        mentorat = ev.mentorat
        mentor   = mentorat.mentor
        jeune    = mentorat.young_request
        pole     = mentorat.pole

        return Response({
            'already_submitted':     ev.submitted_at is not None,
            'mentor_name':           f"{mentor.first_name} {mentor.last_name}",
            'jeune_name':            f"{jeune.first_name} {jeune.last_name}" if jeune else '',
            'pole_code':             pole.code or pole.name if pole else '',
            'date_fin':              mentorat.closed_at,
            'date_demande':          jeune.request_date if jeune else None,
            'rating_objectifs':      ev.rating_objectifs,
            'rating_accompagnement': ev.rating_accompagnement,
            'rating_recommandation': ev.rating_recommandation,
            'comment':               ev.comment,
            'submitted_at':          ev.submitted_at,
        })

    def post(self, request, token):
        ev = self._get_evaluation(token)
        if not ev:
            return Response({'error': 'Lien invalide ou expiré.'}, status=status.HTTP_404_NOT_FOUND)

        if ev.submitted_at is not None:
            return Response(
                {'error': 'Vous avez déjà soumis votre évaluation.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        def parse_rating(key):
            val = request.data.get(key)
            if val is None:
                return None, f"La note « {key} » est requise."
            try:
                val = int(val)
            except (TypeError, ValueError):
                return None, f"La note « {key} » doit être un entier."
            if not (1 <= val <= 5):
                return None, f"La note « {key} » doit être entre 1 et 5."
            return val, None

        r1, e1 = parse_rating('rating_objectifs')
        r2, e2 = parse_rating('rating_accompagnement')
        r3, e3 = parse_rating('rating_recommandation')

        first_error = e1 or e2 or e3
        if first_error:
            return Response({'error': first_error}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get('comment', '')

        ev.rating_objectifs      = r1
        ev.rating_accompagnement = r2
        ev.rating_recommandation = r3
        ev.comment               = comment
        ev.submitted_at          = timezone.now()
        ev.save(update_fields=[
            'rating_objectifs', 'rating_accompagnement', 'rating_recommandation',
            'comment', 'submitted_at',
        ])

        threading.Thread(
            target=_send_eval_results_to_acp,
            args=(ev.id,),
            daemon=True,
        ).start()

        return Response({'success': True})
