import threading

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.models import YoungRequest, Pole, Department
from core.services.geocoding import geocode_commune


def _geocode_and_save(young_request_id: int, commune: str, code_postal: str):
    """Géocode en arrière-plan et met à jour la demande."""
    coords = geocode_commune(commune, code_postal)
    if coords:
        YoungRequest.objects.filter(id=young_request_id).update(
            latitude=coords[0],
            longitude=coords[1],
        )


class CreateYoungRequestView(APIView):
    """
    Création publique d'une demande jeune.
    Pas d'authentification requise.
    """
    permission_classes = []  # Public

    def post(self, request):
        data = request.data

        # Validation minimale
        required = ['first_name', 'last_name', 'needs_description']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {"error": f"Champs obligatoires manquants: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Détermine le pôle : priorité au choix direct, sinon par département
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

        commune    = data.get('commune', '').strip()
        code_postal = data.get('code_postal', '').strip()

        # Création
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
            urgency_level=data.get('urgency_level', 1),
            pole=pole,
            status='NEW',
        )

        # Géocodage asynchrone (ne bloque pas la réponse)
        if commune or code_postal:
            t = threading.Thread(
                target=_geocode_and_save,
                args=(young_request.id, commune, code_postal),
                daemon=True,
            )
            t.start()

        return Response({
            "success": True,
            "message": "Votre demande a été enregistrée. Un animateur vous contactera prochainement.",
            "demande_id": young_request.id,
            "pole_attribue": pole.name if pole else "À déterminer"
        }, status=status.HTTP_201_CREATED)