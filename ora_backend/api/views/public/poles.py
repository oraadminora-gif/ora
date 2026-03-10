from rest_framework.views import APIView
from rest_framework.response import Response

from core.models import Pole


class PublicPolesView(APIView):
    """Liste publique des pôles actifs avec leurs départements couverts."""
    permission_classes = []

    def get(self, request):
        poles = (
            Pole.objects
            .filter(status='ACTIVE')
            .prefetch_related('departments')
            .order_by('name')
        )
        data = []
        for pole in poles:
            depts = list(
                pole.departments.order_by('code').values('code', 'name')
            )
            # Résumé lisible : "01, 02, 03 — Ain, Aisne, Allier"
            dept_codes = ', '.join(d['code'] for d in depts)
            dept_names = ', '.join(d['name'] for d in depts)
            data.append({
                'id':          pole.id,
                'name':        pole.name,
                'code':        pole.code,
                'departments': depts,
                'dept_codes':  dept_codes,
                'dept_names':  dept_names,
                # Texte d'orientation affiché sous le nom du pôle
                'hint': f"Départements couverts : {dept_codes}" if dept_codes else '',
            })
        return Response(data)
