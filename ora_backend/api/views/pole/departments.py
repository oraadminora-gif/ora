# api/views/pole/departments.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Department


class DepartmentsView(APIView):
    """Liste de tous les départements (référentiel pour formulaires)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        departments = Department.objects.all().order_by('code')
        data = [
            {"id": d.id, "code": d.code, "name": d.name, "label": f"{d.code} – {d.name}"}
            for d in departments
        ]
        return Response({"count": len(data), "departments": data})
