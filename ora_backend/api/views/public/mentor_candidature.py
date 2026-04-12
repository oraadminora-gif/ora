# api/views/public/mentor_candidature.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.models import CandidatureMentor, Pole, Department


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

        candidature = CandidatureMentor.objects.create(
            first_name      = data['first_name'].strip(),
            last_name       = data['last_name'].strip().upper(),
            email           = data['email'].strip().lower(),
            phone           = data.get('phone', '').strip(),
            code_postal     = data['code_postal'].strip(),
            commune         = data.get('commune', '').strip(),
            pole            = pole,
            motivation      = data.get('motivation', '').strip(),
        )

        return Response({
            'id':           candidature.id,
            'pole_name':    pole.name if pole else None,
            'pole_found':   pole is not None,
        }, status=status.HTTP_201_CREATED)
