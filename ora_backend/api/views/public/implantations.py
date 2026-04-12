# api/views/public/implantations.py
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.models import Pole


class PublicImplantationsView(APIView):
    """
    GET /api/public/implantations/

    Données publiques de la carte d'implantation :
    pôles actifs, départements couverts, villes, contact.
    Aucune statistique sensible exposée.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        poles = (
            Pole.objects
            .filter(status='ACTIVE')
            .prefetch_related('departments')
            .order_by('code')
        )

        poles_data = []
        department_pole_map = {}  # dept_code → pole_id

        for pole in poles:
            etat = pole.etat_activite or ''
            depts = [
                {'code': d.code, 'name': d.name}
                for d in pole.departments.all()
            ]

            for d in depts:
                if d['code'] not in department_pole_map:
                    department_pole_map[d['code']] = {
                        'pole_id':       pole.id,
                        'etat_activite': etat,
                    }

            poles_data.append({
                'id':             pole.id,
                'code':           pole.code,
                'name':           pole.name,
                'etat_activite':  etat,
                'villes':         pole.villes or [],
                'contact_email':  pole.contact_email,
                'contact_phone':  pole.contact_phone,
                'departments':    depts,
            })

        return Response({
            'poles':               poles_data,
            'department_pole_map': department_pole_map,
            'stats': {
                'total_poles':               len(poles_data),
                'total_departments_covered': len(department_pole_map),
            },
        })
