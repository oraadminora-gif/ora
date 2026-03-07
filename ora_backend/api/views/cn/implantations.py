# api/views/cn/implantations.py
from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Pole
from api.permissions import IsCN

ETAT_LABELS = {
    'a_letude':    "À l'étude",
    'demarre':     'Démarré',
    'fragile':     'Fragile',
    'experimente': 'Expérimenté',
    'arrete':      'Arrêté',
}


class CNImplantationsView(APIView):
    """
    GET /api/cn/implantations/

    Carte d'implantation des pôles : données enrichies pour la carte
    interactive (départements couverts, état d'activité, stats).
    """
    permission_classes = [IsAuthenticated, IsCN]

    def get(self, request):
        poles = (
            Pole.objects
            .prefetch_related('departments')
            .annotate(
                mentors_count    = Count('mentors',    distinct=True),
                animateurs_count = Count('animateurs', distinct=True),
                mentorats_actifs = Count(
                    'young_requests__mentorat',
                    filter=Q(young_requests__mentorat__status='ACTIVE'),
                    distinct=True,
                ),
                jeunes_en_attente = Count(
                    'young_requests',
                    filter=Q(young_requests__status__in=['NEW', 'PENDING']),
                    distinct=True,
                ),
            )
            .order_by('code')
        )

        poles_data = []
        department_pole_map = {}   # dept_code → { pole_id, etat }
        par_etat = {}              # etat_activite → count

        for pole in poles:
            etat = pole.etat_activite or ''
            par_etat[etat] = par_etat.get(etat, 0) + 1

            depts = [
                {'code': d.code, 'name': d.name}
                for d in pole.departments.all()
            ]

            for d in depts:
                # En cas de chevauchement, le pôle le plus avancé (experimente > demarre …)
                # prend la priorité. Ici on prend simplement le premier rencontré.
                if d['code'] not in department_pole_map:
                    department_pole_map[d['code']] = {
                        'pole_id':      pole.id,
                        'etat_activite': etat,
                        'etat_label':   ETAT_LABELS.get(etat, '—'),
                    }

            poles_data.append({
                'id':               pole.id,
                'code':             pole.code,
                'name':             pole.name,
                'status':           pole.status,
                'etat_activite':    etat,
                'etat_label':       ETAT_LABELS.get(etat, '—'),
                'villes':           pole.villes or [],
                'contact_email':    pole.contact_email,
                'contact_phone':    pole.contact_phone,
                'departments':      depts,
                'mentors_count':    pole.mentors_count,
                'animateurs_count': pole.animateurs_count,
                'mentorats_actifs': pole.mentorats_actifs,
                'jeunes_en_attente': pole.jeunes_en_attente,
            })

        total_depts_covered = len(department_pole_map)

        return Response({
            'poles':               poles_data,
            'department_pole_map': department_pole_map,
            'stats': {
                'total_poles':              len(poles_data),
                'total_departments_covered': total_depts_covered,
                'par_etat':                 par_etat,
            },
        })
