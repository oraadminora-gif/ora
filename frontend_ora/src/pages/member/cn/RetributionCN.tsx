// pages/member/cn/RetributionCN.tsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { DollarSign, ChevronDown, ChevronRight, Download, Filter } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Segment {
  situation:          string;
  situation_label:    string;
  niveau:             string;
  niveau_label:       string;
  nb_clos:            number;
  nb_actifs_eligible: number;
  tranches:           number;
  duree_mois:         number;
}

interface AssocData {
  id:             number;
  name:           string;
  lignes:         Segment[];
  total_tranches: number;
}

interface PoleData {
  id:             number;
  name:           string;
  associations:   AssocData[];
  total_tranches: number;
}

interface RetributionData {
  poles:          PoleData[];
  grand_total:    number;
  all_poles:      { id: number; name: string }[];
  filtre_pole_id: number | null;
  filtre_annee:   number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

function fmtMois(m: number) {
  if (m === 0) return '—';
  const y = Math.floor(m / 12);
  const mo = m % 12;
  const parts = [];
  if (y > 0) parts.push(`${y} an${y > 1 ? 's' : ''}`);
  if (mo > 0) parts.push(`${mo} mois`);
  return parts.join(' ');
}

const SITUATION_COLORS: Record<string, string> = {
  apprentissage: 'bg-blue-50 text-blue-700 border-blue-200',
  recherche:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  inconnu:       'bg-slate-50 text-slate-500 border-slate-200',
};

const NIVEAU_COLORS: Record<string, string> = {
  superieur: 'text-purple-700 font-semibold',
  autre:     'text-slate-600',
};

// ── Composant principal ───────────────────────────────────────────────────

export function RetributionCN() {
  const [data, setData]             = useState<RetributionData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [poleFilter, setPoleFilter] = useState('');
  const [anneeFilter, setAnneeFilter] = useState('');
  const [expanded, setExpanded]     = useState<Set<number>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (poleFilter) params.pole_id = poleFilter;
      if (anneeFilter) params.annee = anneeFilter;
      const res = await api.get<RetributionData>('/cn/retribution/', { params });
      setData(res.data);
      // Ouvrir tous les pôles par défaut
      setExpanded(new Set(res.data.poles.map(p => p.id)));
    } catch {
      setError('Impossible de charger les données de rétribution.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [poleFilter, anneeFilter]);

  const togglePole = (id: number) =>
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!data) return;
    const rows: string[][] = [
      ['Pôle', 'Association', 'Situation', 'Niveau', 'Mentorats clos', 'Actifs éligibles', 'Tranches', 'Durée cumulée (mois)'],
    ];
    for (const pole of data.poles) {
      for (const assoc of pole.associations) {
        for (const seg of assoc.lignes) {
          rows.push([
            pole.name, assoc.name,
            seg.situation_label, seg.niveau_label,
            String(seg.nb_clos), String(seg.nb_actifs_eligible),
            String(seg.tranches), String(seg.duree_mois),
          ]);
        }
        rows.push([pole.name, assoc.name, 'TOTAL', '', '', '', String(assoc.total_tranches), '']);
      }
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `retribution_ora${anneeFilter ? `_${anneeFilter}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Rétribution</h1>
            <p className="text-sm text-slate-500">
              Tranches par pôle, association et catégorie de mentorat
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={!data}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-end">
        <Filter className="w-4 h-4 text-slate-400 mt-5" />
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Pôle</label>
          <select
            value={poleFilter}
            onChange={e => setPoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          >
            <option value="">Tous les pôles</option>
            {data?.all_poles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Année</label>
          <select
            value={anneeFilter}
            onChange={e => setAnneeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          >
            <option value="">Toutes les années (cumulatif)</option>
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {(poleFilter || anneeFilter) && (
          <button
            onClick={() => { setPoleFilter(''); setAnneeFilter(''); }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Légende */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 space-y-1">
        <p className="font-semibold">Règles de calcul des tranches :</p>
        <ul className="list-disc list-inside space-y-0.5 text-amber-800">
          <li>
            <strong>Mentorat clôturé</strong> — 1 tranche minimum + 1 tranche par année complète
            <span className="text-xs ml-1">(ex : 14 mois → 2 tranches)</span>
          </li>
          <li>
            <strong>Mentorat actif &gt; 12 mois</strong> — 1 tranche par année complète écoulée
            <span className="text-xs ml-1">(ex : 37 mois → 3 tranches)</span>
          </li>
        </ul>
      </div>

      {/* Contenu */}
      {loading && (
        <div className="text-center py-12 text-slate-500">Chargement…</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">{error}</div>
      )}

      {!loading && data && (
        <>
          {/* Carte récap */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">
                Total tranches{anneeFilter ? ` — ${anneeFilter}` : ' (cumulatif)'}
                {poleFilter ? ` — ${data.all_poles.find(p => String(p.id) === poleFilter)?.name}` : ''}
              </p>
              <p className="text-4xl font-bold mt-1">{data.grand_total}</p>
            </div>
            <DollarSign className="w-16 h-16 opacity-20" />
          </div>

          {/* Tableau par pôle */}
          {data.poles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Aucun mentorat éligible pour cette sélection.
            </div>
          ) : (
            data.poles.map(pole => (
              <div key={pole.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">

                {/* Header pôle */}
                <button
                  onClick={() => togglePole(pole.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expanded.has(pole.id)
                      ? <ChevronDown className="w-5 h-5 text-slate-400" />
                      : <ChevronRight className="w-5 h-5 text-slate-400" />
                    }
                    <span className="font-bold text-slate-800 text-lg">{pole.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    {pole.total_tranches} tranche{pole.total_tranches > 1 ? 's' : ''}
                  </span>
                </button>

                {/* Associations du pôle */}
                {expanded.has(pole.id) && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {pole.associations.map(assoc => (
                      <AssocTable key={assoc.id} assoc={assoc} />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Tableau récapitulatif global */}
          {data.poles.length > 1 && (
            <SynthesePoles poles={data.poles} grandTotal={data.grand_total} />
          )}
        </>
      )}
    </div>
  );
}

// ── Sous-composant : tableau d'une association ─────────────────────────────

function AssocTable({ assoc }: { assoc: AssocData }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-semibold text-slate-700">{assoc.name}</span>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
          {assoc.total_tranches} tranche{assoc.total_tranches > 1 ? 's' : ''}
        </span>
      </div>

      {assoc.lignes.length === 0 ? (
        <p className="text-sm text-slate-400 italic pl-2">Aucune tranche générée.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="pb-2 pr-4 font-medium">Situation</th>
                <th className="pb-2 pr-4 font-medium">Niveau</th>
                <th className="pb-2 pr-4 font-medium text-right">Clos</th>
                <th className="pb-2 pr-4 font-medium text-right">Actifs élig.</th>
                <th className="pb-2 pr-4 font-medium text-right">Durée cumulée</th>
                <th className="pb-2 font-medium text-right text-amber-700">Tranches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assoc.lignes.map((seg, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2 pr-4">
                    <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-medium ${
                      SITUATION_COLORS[seg.situation] ?? SITUATION_COLORS['inconnu']
                    }`}>
                      {seg.situation_label}
                    </span>
                  </td>
                  <td className={`py-2 pr-4 text-xs ${NIVEAU_COLORS[seg.niveau]}`}>
                    {seg.niveau_label}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-slate-600">
                    {seg.nb_clos}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-slate-600">
                    {seg.nb_actifs_eligible}
                  </td>
                  <td className="py-2 pr-4 text-right text-xs text-slate-500">
                    {fmtMois(seg.duree_mois)}
                  </td>
                  <td className="py-2 text-right">
                    <span className="font-bold text-amber-600 tabular-nums">
                      {seg.tranches}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-amber-200 bg-amber-50">
                <td colSpan={5} className="pt-2 text-right text-sm font-semibold text-slate-700 pr-4">
                  Total {assoc.name}
                </td>
                <td className="pt-2 text-right font-bold text-amber-700 text-base">
                  {assoc.total_tranches}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Sous-composant : synthèse multi-pôles ─────────────────────────────────

function SynthesePoles({ poles, grandTotal }: { poles: PoleData[]; grandTotal: number }) {
  // Toutes les associations distinctes
  const assocSet = new Map<number, string>();
  for (const p of poles) for (const a of p.associations) assocSet.set(a.id, a.name);
  const assocs = Array.from(assocSet.entries());

  // Matrice pole × assoc → tranches
  const matrix: Record<number, Record<number, number>> = {};
  for (const p of poles) {
    matrix[p.id] = {};
    for (const a of p.associations) matrix[p.id][a.id] = a.total_tranches;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 font-semibold text-slate-800">
        Synthèse — Tous les pôles
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              <th className="pb-2 pr-6 font-medium">Pôle</th>
              {assocs.map(([id, name]) => (
                <th key={id} className="pb-2 pr-4 font-medium text-right">{name}</th>
              ))}
              <th className="pb-2 font-medium text-right text-amber-700">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {poles.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="py-2 pr-6 font-medium text-slate-700">{p.name}</td>
                {assocs.map(([a_id]) => (
                  <td key={a_id} className="py-2 pr-4 text-right tabular-nums text-slate-600">
                    {matrix[p.id][a_id] ?? 0}
                  </td>
                ))}
                <td className="py-2 text-right font-bold text-amber-600 tabular-nums">
                  {p.total_tranches}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-amber-200 bg-amber-50">
              <td className="pt-2 font-bold text-slate-800">Total</td>
              {assocs.map(([a_id]) => {
                const tot = poles.reduce((s, p) => s + (matrix[p.id][a_id] ?? 0), 0);
                return (
                  <td key={a_id} className="pt-2 pr-4 text-right font-semibold text-slate-700 tabular-nums">
                    {tot}
                  </td>
                );
              })}
              <td className="pt-2 text-right font-bold text-amber-700 text-base tabular-nums">
                {grandTotal}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
