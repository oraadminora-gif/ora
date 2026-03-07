# api/views/public/evaluation.py
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from core.models import EvaluationMentor


class PublicEvaluationView(APIView):
    """
    Évaluation publique du mentor par le jeune via lien tokenisé.
    GET  /api/public/evaluation/{token}/ → infos pour afficher le formulaire
    POST /api/public/evaluation/{token}/ → soumettre la note + commentaire
    Pas d'authentification requise.
    """
    permission_classes = [AllowAny]

    def _get_evaluation(self, token):
        try:
            return EvaluationMentor.objects.select_related(
                'mentorat__mentor', 'mentorat__young_request'
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

        return Response({
            'already_submitted': ev.submitted_at is not None,
            'mentor_name': f"{mentor.first_name} {mentor.last_name}",
            'jeune_name':  f"{jeune.first_name} {jeune.last_name}" if jeune else '',
            'date_fin':    mentorat.closed_at,
            'rating':      ev.rating,
            'comment':     ev.comment,
            'submitted_at': ev.submitted_at,
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

        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        if rating is None:
            return Response({'error': 'Une note est requise.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rating = int(rating)
        except (TypeError, ValueError):
            return Response({'error': 'La note doit être un entier.'}, status=status.HTTP_400_BAD_REQUEST)

        if not (1 <= rating <= 5):
            return Response({'error': 'La note doit être comprise entre 1 et 5.'}, status=status.HTTP_400_BAD_REQUEST)

        ev.rating = rating
        ev.comment = comment
        ev.submitted_at = timezone.now()
        ev.save(update_fields=['rating', 'comment', 'submitted_at'])

        return Response({'success': True, 'rating': ev.rating})
