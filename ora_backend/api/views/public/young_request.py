from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.models import YoungRequest, Pole, Department


class CreateYoungRequestView(APIView):
    """
    Création publique d'une demande jeune.
    Pas d'authentification requise.
    """
    permission_classes = []  # Public
    
    def post(self, request):
        data = request.data
        
        # Validation minimale
        required = ['first_name', 'last_name', 'city', 'needs_description']
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

        # Création
        young_request = YoungRequest.objects.create(
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            birth_date=data.get('birth_date'),
            gender=data.get('gender', ''),
            city=data.get('city', ''),
            department=dept,
            nom_etablissement=data.get('nom_etablissement', '').strip(),
            diplome_prepare=data.get('diplome_prepare', ''),
            situation=data.get('situation', ''),
            needs_description=data['needs_description'],
            urgency_level=data.get('urgency_level', 1),
            pole=pole,
            status='NEW',
        )
        
        return Response({
            "success": True,
            "message": "Votre demande a été enregistrée. Un animateur vous contactera prochainement.",
            "demande_id": young_request.id,
            "pole_attribue": pole.name if pole else "À déterminer"
        }, status=status.HTTP_201_CREATED)