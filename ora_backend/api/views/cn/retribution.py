# api/views/cn/retribution.py
"""
Vue CN — Calcul des rétributions par pôle et par association.

Règles de calcul des tranches :
  • Mentorat CLOS     → max(1, ceil(durée_mois / 12))
      Ex : 8 mois clos  → 1 tranche
           14 mois clos  → 2 tranches
  • Mentorat ACTIF    → floor(durée_mois / 12)   (déclenché à chaque anniversaire)
      Ex : 10 mois actif → 0 tranche
           13 mois actif → 1 tranche
           37 mois actif → 3 tranches

Segmentation :
  • Situation   : apprentissage | recherche
  • Niveau dip. : Supérieur (niveaux 6-7) | Autre (niveaux 3-5)
"""

from math import ceil, floor

from dateutil.relativedelta import relativedelta
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.permissions import IsCN
from core.models import Association, Mentorat, Pole

# Diplômes de niveau 6 et 7
NIVEAUX_SUP = {'LIC_PRO', 'BUT', 'MASTER', 'DEA', 'DES', 'ING'}


def _duree_mois(mentorat: Mentorat) -> int:
    """Durée en mois entre assigned_at et closed_at (ou aujourd'hui)."""
    if not mentorat.assigned_at:
        return 0
    end = mentorat.closed_at or timezone.now().date()
    d = relativedelta(end, mentorat.assigned_at)
    return d.years * 12 + d.months


def _tranches(mentorat: Mentorat, mois: int) -> int:
    """Nombre de tranches de rétribution pour ce mentorat."""
    if mentorat.status == 'CLOSED':
        return max(1, ceil(mois / 12))
    if mentorat.status == 'ACTIVE':
        return floor(mois / 12)
    return 0


def _niveau_cat(diplome: str) -> str:
    return 'superieur' if diplome in NIVEAUX_SUP else 'autre'


def _situation_cat(situation: str) -> str:
    return situation if situation in ('apprentissage', 'recherche') else 'inconnu'


# ── Clé de segment ────────────────────────────────────────────────────────────
SEGMENTS = [
    ('apprentissage', 'superieur'),
    ('apprentissage', 'autre'),
    ('recherche',     'superieur'),
    ('recherche',     'autre'),
    ('inconnu',       'superieur'),
    ('inconnu',       'autre'),
]

_SITUATION_LABELS = {
    'apprentissage': 'En apprentissage',
    'recherche':     "En recherche d'apprentissage",
    'inconnu':       'Non renseigné',
}
_NIVEAU_LABELS = {
    'superieur': 'Niveaux 6-7 (Licence, BUT, Master, Ing.)',
    'autre':     'Niveaux 3-5 (CAP, Bac, BTS…)',
}


def _empty_segment():
    return {
        'nb_clos':             0,
        'nb_actifs_eligible':  0,
        'tranches':            0,
        'duree_mois':          0,
    }


class RetributionView(APIView):
    """
    GET /api/cn/retribution/?pole_id=&annee=

    Retourne la répartition des rétributions par pôle × association × segment.
    Accès : membres CN (acces_complet conseillé mais non imposé — CN readonly ok)
    """
    permission_classes = [IsAuthenticated, IsCN]

    def get(self, request):
        pole_id = request.query_params.get('pole_id')
        annee   = request.query_params.get('annee')  # filtre optionnel (int)

        # ── Chargement des mentorats éligibles ──────────────────────────────
        qs = (
            Mentorat.objects
            .filter(status__in=('CLOSED', 'ACTIVE'))
            .select_related(
                'mentor__association',
                'pole',
                'young_request',
            )
        )

        if pole_id:
            qs = qs.filter(pole_id=pole_id)

        # ── Structure de résultat ────────────────────────────────────────────
        # { pole_id → { assoc_id → { (situation, niveau) → segment_data } } }
        pole_map:   dict[int, dict]  = {}
        pole_names: dict[int, str]   = {}
        assoc_names:dict[int, str]   = {}

        for m in qs:
            mois     = _duree_mois(m)
            tranches = _tranches(m, mois)

            # Filtre année : on regarde si le mentorat génère des tranches dans l'année
            if annee:
                annee_int = int(annee)
                tranches_annee = self._tranches_en_annee(m, mois, annee_int)
                if tranches_annee == 0:
                    continue
                tranches = tranches_annee

            p_id   = m.pole_id
            a_id   = m.mentor.association_id
            sit    = _situation_cat(m.young_request.situation)
            niveau = _niveau_cat(m.young_request.diplome_prepare)

            pole_names[p_id]  = m.pole.name
            assoc_names[a_id] = m.mentor.association.name

            if p_id not in pole_map:
                pole_map[p_id] = {}
            if a_id not in pole_map[p_id]:
                pole_map[p_id][a_id] = {seg: _empty_segment() for seg in SEGMENTS}

            seg = pole_map[p_id][a_id][(sit, niveau)]
            if m.status == 'CLOSED':
                seg['nb_clos'] += 1
            else:
                if tranches > 0:
                    seg['nb_actifs_eligible'] += 1
            seg['tranches']   += tranches
            seg['duree_mois'] += mois

        # ── Sérialisation ────────────────────────────────────────────────────
        poles_out = []
        grand_total_tranches = 0

        for p_id, assoc_map in sorted(pole_map.items(), key=lambda x: pole_names[x[0]]):
            assocs_out = []
            pole_total = 0

            for a_id, segs in sorted(assoc_map.items(), key=lambda x: assoc_names[x[0]]):
                lignes = []
                assoc_total = 0

                for (sit, niveau), data in segs.items():
                    if data['tranches'] == 0 and data['nb_clos'] == 0:
                        continue
                    lignes.append({
                        'situation':          sit,
                        'situation_label':    _SITUATION_LABELS.get(sit, sit),
                        'niveau':             niveau,
                        'niveau_label':       _NIVEAU_LABELS.get(niveau, niveau),
                        'nb_clos':            data['nb_clos'],
                        'nb_actifs_eligible': data['nb_actifs_eligible'],
                        'tranches':           data['tranches'],
                        'duree_mois':         data['duree_mois'],
                    })
                    assoc_total += data['tranches']

                assocs_out.append({
                    'id':            a_id,
                    'name':          assoc_names[a_id],
                    'lignes':        lignes,
                    'total_tranches': assoc_total,
                })
                pole_total += assoc_total

            poles_out.append({
                'id':            p_id,
                'name':          pole_names[p_id],
                'associations':  assocs_out,
                'total_tranches': pole_total,
            })
            grand_total_tranches += pole_total

        # ── Liste des pôles pour le filtre frontend ──────────────────────────
        all_poles = list(
            Pole.objects.filter(status='ACTIVE').order_by('name').values('id', 'name')
        )

        return Response({
            'poles':             poles_out,
            'grand_total':       grand_total_tranches,
            'all_poles':         all_poles,
            'filtre_pole_id':    int(pole_id) if pole_id else None,
            'filtre_annee':      int(annee)    if annee    else None,
        })

    # ── Helpers année ─────────────────────────────────────────────────────────
    @staticmethod
    def _tranches_en_annee(m: Mentorat, mois_total: int, annee: int) -> int:
        """
        Compte les tranches qui tombent dans une année civile donnée.
        - Tranche annuelle : date anniversaire assigned_at + N×12 mois
        - Tranche cloture  : date closed_at (si année = annee)
        """
        if not m.assigned_at:
            return 0

        count = 0

        # Tranches annuelles (anniversaires)
        for n in range(1, mois_total // 12 + 1):
            anniversary = m.assigned_at + relativedelta(months=n * 12)
            end_limit   = m.closed_at or timezone.now().date()
            if anniversary <= end_limit and anniversary.year == annee:
                count += 1

        # Tranche de clôture
        if m.status == 'CLOSED' and m.closed_at and m.closed_at.year == annee:
            # Seulement si ce n'est pas déjà un anniversaire exact
            remaining_months = mois_total % 12
            if remaining_months > 0:
                count += 1
            elif mois_total == 0:
                count += 1  # Mentorat clos < 1 mois

        return count
