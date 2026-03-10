# api/views/cn/retribution.py
"""
Vue CN — Calcul des rétributions par pôle / association / financeur / segment.

Règles de calcul des tranches :
  • Mentorat CLOS     → max(1, ceil(durée_mois / 12))
  • Mentorat ACTIF    → floor(durée_mois / 12)
      Si durée < 12 mois : 0 tranche (en attente), mais toujours listé.

Segmentation :
  • Situation   : apprentissage | recherche
  • Niveau dip. : Supérieur (niv. 6-7) | Autre (niv. 3-5)
  • Financeur   : « Sans financement » | Financement X | Financement Y…
    Un mentorat multi-financé apparaît dans chaque ligne financeur.
"""

from math import ceil, floor

from dateutil.relativedelta import relativedelta
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.permissions import IsCN
from core.models import Mentorat, Pole

NIVEAUX_SUP = {'LIC_PRO', 'BUT', 'MASTER', 'DEA', 'DES', 'ING'}

_SITUATION_LABELS = {
    'apprentissage': 'En apprentissage',
    'recherche':     "En recherche d'apprentissage",
    'inconnu':       'Non renseigné',
}
_NIVEAU_LABELS = {
    'superieur': 'Niveaux 6-7 (Licence, BUT, Master, Ing.)',
    'autre':     'Niveaux 3-5 (CAP, Bac, BTS…)',
}
SEGMENTS = [
    ('apprentissage', 'superieur'),
    ('apprentissage', 'autre'),
    ('recherche',     'superieur'),
    ('recherche',     'autre'),
    ('inconnu',       'superieur'),
    ('inconnu',       'autre'),
]
NO_FINANCEMENT_KEY = '__aucun__'


def _duree_mois(mentorat: Mentorat) -> int:
    if not mentorat.assigned_at:
        return 0
    end = mentorat.closed_at or timezone.now().date()
    d = relativedelta(end, mentorat.assigned_at)
    return d.years * 12 + d.months


def _tranches(status: str, mois: int) -> int:
    if status == 'CLOSED':
        return max(1, ceil(mois / 12))
    if status == 'ACTIVE':
        return floor(mois / 12)
    return 0


def _niveau_cat(diplome: str) -> str:
    return 'superieur' if diplome in NIVEAUX_SUP else 'autre'


def _situation_cat(situation: str) -> str:
    return situation if situation in ('apprentissage', 'recherche') else 'inconnu'


def _empty_seg():
    return {
        'nb_clos':              0,
        'nb_actifs_eligible':   0,   # ACTIVE ≥ 12 mois → ≥ 1 tranche
        'nb_actifs_attente':    0,   # ACTIVE < 12 mois → 0 tranche
        'tranches':             0,
        'duree_mois':           0,
    }


class RetributionView(APIView):
    """
    GET /api/cn/retribution/?pole_id=&annee=

    Résultat groupé par : pôle → association → financeur → segment (sit×niveau)
    """
    permission_classes = [IsAuthenticated, IsCN]

    def get(self, request):
        pole_id = request.query_params.get('pole_id')
        annee   = request.query_params.get('annee')

        qs = (
            Mentorat.objects
            .filter(status__in=('CLOSED', 'ACTIVE'))
            .select_related(
                'mentor__association',
                'pole',
                'young_request',
            )
            .prefetch_related('financements__financement')
        )
        if pole_id:
            qs = qs.filter(pole_id=pole_id)

        # ── Structures de résultat ────────────────────────────────────────────
        # pole_map[p_id][a_id][fin_key][(sit,niveau)] → seg_data
        pole_map    : dict = {}
        pole_names  : dict = {}
        assoc_names : dict = {}
        # fin_key → {id, name, type}
        fin_meta    : dict = {NO_FINANCEMENT_KEY: {'id': None, 'name': 'Sans financement', 'type': ''}}

        for m in qs:
            mois = _duree_mois(m)

            if annee:
                tr_annee = self._tranches_en_annee(m, mois, int(annee))
                if m.status == 'ACTIVE' and tr_annee == 0 and mois == 0:
                    # Inclure quand même les mentorats actifs sans tranche (en attente)
                    pass
                tranches = tr_annee
            else:
                tranches = _tranches(m.status, mois)

            p_id = m.pole_id
            a_id = m.mentor.association_id
            sit  = _situation_cat(m.young_request.situation if m.young_request else '')
            niv  = _niveau_cat(m.young_request.diplome_prepare if m.young_request else '')

            pole_names[p_id]  = m.pole.name
            assoc_names[a_id] = m.mentor.association.name

            # Financeurs liés à ce mentorat
            mf_list = list(m.financements.all())
            if mf_list:
                fin_keys = []
                for mf in mf_list:
                    fk = f'fin_{mf.financement_id}'
                    fin_keys.append(fk)
                    if fk not in fin_meta:
                        fin_meta[fk] = {
                            'id':   mf.financement_id,
                            'name': mf.financement.nom,
                            'type': mf.financement.type,
                        }
            else:
                fin_keys = [NO_FINANCEMENT_KEY]

            # Alimentation des buckets
            pole_map.setdefault(p_id, {})
            pole_map[p_id].setdefault(a_id, {})

            for fk in fin_keys:
                pole_map[p_id][a_id].setdefault(fk, {seg: _empty_seg() for seg in SEGMENTS})
                seg = pole_map[p_id][a_id][fk][(sit, niv)]

                if m.status == 'CLOSED':
                    seg['nb_clos'] += 1
                elif tranches > 0:
                    seg['nb_actifs_eligible'] += 1
                else:
                    seg['nb_actifs_attente'] += 1

                seg['tranches']   += tranches
                seg['duree_mois'] += mois

        # ── Sérialisation ────────────────────────────────────────────────────
        poles_out        = []
        grand_total_tr   = 0
        grand_nb_clos    = 0
        grand_nb_actifs  = 0
        grand_nb_attente = 0

        for p_id, assoc_map in sorted(pole_map.items(), key=lambda x: pole_names[x[0]]):
            assocs_out = []
            pole_total = 0

            for a_id, fin_map in sorted(assoc_map.items(), key=lambda x: assoc_names[x[0]]):
                financeurs_out = []
                assoc_total    = 0

                # Ordonner : sans financement en premier, puis par nom
                def fin_sort(fk):
                    if fk == NO_FINANCEMENT_KEY:
                        return ('', '')
                    return ('z', fin_meta[fk]['name'])

                for fk in sorted(fin_map.keys(), key=fin_sort):
                    segs = fin_map[fk]
                    lignes = []
                    fin_total = 0

                    for (sit, niv), data in segs.items():
                        total_m = data['nb_clos'] + data['nb_actifs_eligible'] + data['nb_actifs_attente']
                        if total_m == 0:
                            continue
                        lignes.append({
                            'situation':           sit,
                            'situation_label':     _SITUATION_LABELS.get(sit, sit),
                            'niveau':              niv,
                            'niveau_label':        _NIVEAU_LABELS.get(niv, niv),
                            'nb_clos':             data['nb_clos'],
                            'nb_actifs_eligible':  data['nb_actifs_eligible'],
                            'nb_actifs_attente':   data['nb_actifs_attente'],
                            'tranches':            data['tranches'],
                            'duree_mois':          data['duree_mois'],
                        })
                        fin_total += data['tranches']
                        grand_nb_clos    += data['nb_clos']
                        grand_nb_actifs  += data['nb_actifs_eligible']
                        grand_nb_attente += data['nb_actifs_attente']

                    if not lignes:
                        continue

                    meta = fin_meta[fk]
                    financeurs_out.append({
                        'key':           fk,
                        'id':            meta['id'],
                        'name':          meta['name'],
                        'type':          meta['type'],
                        'lignes':        lignes,
                        'total_tranches': fin_total,
                    })
                    assoc_total += fin_total

                assocs_out.append({
                    'id':            a_id,
                    'name':          assoc_names[a_id],
                    'financeurs':    financeurs_out,
                    'total_tranches': assoc_total,
                })
                pole_total += assoc_total

            poles_out.append({
                'id':             p_id,
                'name':           pole_names[p_id],
                'associations':   assocs_out,
                'total_tranches': pole_total,
            })
            grand_total_tr += pole_total

        all_poles = list(
            Pole.objects.filter(status='ACTIVE').order_by('name').values('id', 'name')
        )

        return Response({
            'poles':              poles_out,
            'grand_total':        grand_total_tr,
            'grand_nb_clos':      grand_nb_clos,
            'grand_nb_actifs':    grand_nb_actifs,
            'grand_nb_attente':   grand_nb_attente,
            'all_poles':          all_poles,
            'filtre_pole_id':     int(pole_id) if pole_id else None,
            'filtre_annee':       int(annee)    if annee    else None,
        })

    @staticmethod
    def _tranches_en_annee(m: Mentorat, mois_total: int, annee: int) -> int:
        if not m.assigned_at:
            return 0
        count = 0
        for n in range(1, mois_total // 12 + 1):
            anniversary = m.assigned_at + relativedelta(months=n * 12)
            end_limit   = m.closed_at or timezone.now().date()
            if anniversary <= end_limit and anniversary.year == annee:
                count += 1
        if m.status == 'CLOSED' and m.closed_at and m.closed_at.year == annee:
            if mois_total % 12 > 0 or mois_total == 0:
                count += 1
        return count
