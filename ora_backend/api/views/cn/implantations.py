# api/views/cn/implantations.py
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Pole
from core.services.geocoding import geocode_commune
from api.permissions import IsCNOrACP

ETAT_LABELS = {
    'a_letude':    "À l'étude",
    'demarre':     'Démarré',
    'fragile':     'Fragile',
    'experimente': 'Expérimenté',
    'arrete':      'Arrêté',
}

# Cache process-level pour éviter de rappeler l'API à chaque requête
_VILLE_COORDS: dict[str, tuple[float, float] | None] = {}


def _geocode_villes(villes: list[str]) -> dict[str, tuple[float, float] | None]:
    """Géocode une liste de villes en parallèle (avec cache en mémoire)."""
    missing = [v for v in villes if v.lower().strip() not in _VILLE_COORDS]
    if missing:
        with ThreadPoolExecutor(max_workers=min(len(missing), 10)) as pool:
            futures = {pool.submit(geocode_commune, v): v for v in missing}
            for fut in as_completed(futures):
                v = futures[fut]
                _VILLE_COORDS[v.lower().strip()] = fut.result()
    return {v: _VILLE_COORDS.get(v.lower().strip()) for v in villes}


class CNImplantationsView(APIView):
    """
    GET /api/cn/implantations/

    Carte d'implantation des pôles : données enrichies pour la carte
    interactive (départements couverts, état d'activité, stats, villes géocodées).
    """
    permission_classes = [IsAuthenticated, IsCNOrACP]

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
                mentorats_clotures = Count(
                    'young_requests__mentorat',
                    filter=Q(young_requests__mentorat__status='CLOSED'),
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

        # Géocode toutes les villes d'un coup (parallèle + cache)
        all_villes = [v for pole in poles for v in (pole.villes or [])]
        coords_map = _geocode_villes(all_villes) if all_villes else {}

        poles_data = []
        department_pole_map = {}
        par_etat = {}

        for pole in poles:
            etat = pole.etat_activite or ''
            par_etat[etat] = par_etat.get(etat, 0) + 1

            depts = [
                {'code': d.code, 'name': d.name}
                for d in pole.departments.all()
            ]

            for d in depts:
                if d['code'] not in department_pole_map:
                    department_pole_map[d['code']] = {
                        'pole_id':       pole.id,
                        'etat_activite': etat,
                        'etat_label':    ETAT_LABELS.get(etat, '—'),
                    }

            villes_geo = []
            for v in (pole.villes or []):
                coords = coords_map.get(v)
                villes_geo.append({
                    'name': v,
                    'lat':  coords[0] if coords else None,
                    'lon':  coords[1] if coords else None,
                })

            poles_data.append({
                'id':               pole.id,
                'code':             pole.code,
                'name':             pole.name,
                'status':           pole.status,
                'etat_activite':    etat,
                'etat_label':       ETAT_LABELS.get(etat, '—'),
                'villes':           villes_geo,
                'contact_email':    pole.contact_email,
                'contact_phone':    pole.contact_phone,
                'departments':      depts,
                'mentors_count':    pole.mentors_count,
                'animateurs_count': pole.animateurs_count,
                'mentorats_actifs':   pole.mentorats_actifs,
                'mentorats_clotures': pole.mentorats_clotures,
                'jeunes_en_attente':  pole.jeunes_en_attente,
            })

        return Response({
            'poles':               poles_data,
            'department_pole_map': department_pole_map,
            'stats': {
                'total_poles':               len(poles_data),
                'total_departments_covered': len(department_pole_map),
                'par_etat':                  par_etat,
            },
        })
