// pages/member/cn/RetributionCN.tsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  DollarSign, ChevronDown, ChevronRight, Download, Filter,
  CheckCircle, Clock, XCircle, Banknote, Ban,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Segment {
  situation:           string;
  situation_label:     string;
  niveau:              string;
  niveau_label:        string;
  nb_clos:             number;
  nb_actifs_eligible:  number;   // ACTIVE ≥ 12 mois
  nb_actifs_attente:   number;   // ACTIVE < 12 mois (pas encore de tranche)
  tranches:            number;
  duree_mois:          number;
}

interface FinanceurSection {
  key:             string;
  id:              number | null;
  name:            string;
  type:            string;       // 'local' | 'national' | ''
  lignes:          Segment[];
  total_tranches:  number;
}

interface AssocData {
  id:             number;
  name:           string;
  financeurs:     FinanceurSection[];
  total_tranches: number;
}

interface PoleData {
  id:             number;
  name:           string;
  associations:   AssocData[];
  total_tranches: number;
}

interface RetributionData {
  poles:            PoleData[];
  grand_total:      number;
  grand_nb_clos:    number;
  grand_nb_actifs:  number;
  grand_nb_attente: number;
  all_poles:        { id: number; name: string }[];
  filtre_pole_id:   number | null;
  filtre_annee:     number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

function fmtMois(m: number): string {
  if (m === 0) return '< 1 mois';
  const y  = Math.floor(m / 12);
  const mo = m % 12;
  const parts: string[] = [];
  if (y  > 0) parts.push(`${y} an${y > 1 ? 's' : ''}`);
  if (mo > 0) parts.push(`${mo} mois`);
  return parts.join(' ');
}

const SIT_BADGE: Record<string, string> = {
  apprentissage: 'bg-blue-100 text-blue-700 border-blue-200',
  recherche:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  inconnu:       'bg-slate-100 text-slate-500 border-slate-200',
};

const NIV_CLS: Record<string, string> = {
  superieur: 'text-purple-700 font-semibold',
  autre:     'text-slate-600',
};

const FIN_TYPE_BADGE: Record<string, string> = {
  national: 'text-xs bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded',
  local:    'text-xs bg-teal-50 text-teal-600 border border-teal-200 px-1.5 py-0.5 rounded',
};

// ── Composant principal ───────────────────────────────────────────────────

export function RetributionCN() {
  const [data, setData]               = useState<RetributionData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [poleFilter, setPoleFilter]   = useState('');
  const [anneeFilter, setAnneeFilter] = useState('');
  const [expanded, setExpanded]       = useState<Set<number>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (poleFilter)  params.pole_id = poleFilter;
      if (anneeFilter) params.annee   = anneeFilter;
      const res = await api.get<RetributionData>('/cn/retribution/', { params });
      setData(res.data);
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

  // ── Export CSV ───────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!data) return;
    const rows: string[][] = [[
      'Pôle', 'Association', 'Financeur', 'Type financement',
      'Situation', 'Niveau',
      'Mentorats clos', 'Actifs éligibles (≥12 mois)', 'Actifs en attente (<12 mois)',
      'Tranches', 'Durée cumulée',
    ]];
    for (const pole of data.poles) {
      for (const assoc of pole.associations) {
        for (const fin of assoc.financeurs) {
          for (const seg of fin.lignes) {
            rows.push([
              pole.name, assoc.name, fin.name, fin.type || 'n/a',
              seg.situation_label, seg.niveau_label,
              String(seg.nb_clos), String(seg.nb_actifs_eligible), String(seg.nb_actifs_attente),
              String(seg.tranches), fmtMois(seg.duree_mois),
            ]);
          }
          rows.push([pole.name, assoc.name, fin.name, '', 'SOUS-TOTAL', '', '', '', '', String(fin.total_tranches), '']);
        }
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
              Tranches par pôle · association · financeur · catégorie
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
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400"
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
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400"
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
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 space-y-2">
        <p className="font-semibold">Règles de calcul</p>
        <div className="grid sm:grid-cols-2 gap-2 text-amber-800 text-xs">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
            <span><strong>Mentorat clôturé</strong> → 1 tranche minimum + 1 par année complète (ex : 14 mois = 2 tranches)</span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 mt-0.5 text-sky-600 flex-shrink-0" />
            <span><strong>Actif ≥ 12 mois</strong> → 1 tranche par année complète (ex : 37 mois = 3 tranches)</span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
            <span><strong>Actif &lt; 12 mois</strong> → En attente (0 tranche pour l'instant)</span>
          </div>
          <div className="flex items-start gap-2">
            <Banknote className="w-3.5 h-3.5 mt-0.5 text-violet-500 flex-shrink-0" />
            <span><strong>Mentorat multi-financé</strong> → apparaît dans chaque ligne financeur</span>
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-12 text-slate-500">Chargement…</div>}
      {error   && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">{error}</div>}

      {!loading && data && (
        <>
          {/* Cartes récap */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={`Total tranches${anneeFilter ? ` — ${anneeFilter}` : ''}`}
              value={data.grand_total}
              color="bg-amber-500"
              icon={<DollarSign className="w-5 h-5" />}
            />
            <StatCard
              label="Mentorats clôturés"
              value={data.grand_nb_clos}
              color="bg-emerald-500"
              icon={<CheckCircle className="w-5 h-5" />}
            />
            <StatCard
              label="Actifs éligibles (≥12 mois)"
              value={data.grand_nb_actifs}
              color="bg-sky-500"
              icon={<Clock className="w-5 h-5" />}
            />
            <StatCard
              label="En attente (<12 mois)"
              value={data.grand_nb_attente}
              color="bg-slate-400"
              icon={<XCircle className="w-5 h-5" />}
            />
          </div>

          {/* Tableaux par pôle */}
          {data.poles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Aucun mentorat actif ou clôturé pour cette sélection.
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

                {expanded.has(pole.id) && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {pole.associations.map(assoc => (
                      <AssocBlock key={assoc.id} assoc={assoc} />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Synthèse multi-pôles */}
          {data.poles.length > 1 && <SyntheseTable poles={data.poles} grandTotal={data.grand_total} />}
        </>
      )}
    </div>
  );
}

// ── Carte statistique ─────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  return (
    <div className={`${color} rounded-xl p-4 text-white flex items-center justify-between`}>
      <div>
        <p className="text-xs font-medium opacity-80 leading-tight">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <div className="opacity-25">{icon}</div>
    </div>
  );
}

// ── Bloc association ──────────────────────────────────────────────────────

function AssocBlock({ assoc }: { assoc: AssocData }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-slate-400" />
          : <ChevronRight className="w-4 h-4 text-slate-400" />
        }
        <span className="font-semibold text-slate-700">{assoc.name}</span>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
          {assoc.total_tranches} tranche{assoc.total_tranches > 1 ? 's' : ''}
        </span>
      </button>

      {open && (
        <div className="pl-4 space-y-4">
          {assoc.financeurs.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucun mentorat éligible.</p>
          ) : (
            assoc.financeurs.map(fin => (
              <FinanceurTable key={fin.key} fin={fin} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Tableau d'un financeur ────────────────────────────────────────────────

function FinanceurTable({ fin }: { fin: FinanceurSection }) {
  const isSans = fin.id === null;
  return (
    <div className={`rounded-lg border ${isSans ? 'border-slate-200 bg-slate-50' : 'border-violet-100 bg-violet-50/30'}`}>
      {/* Header financeur */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-inherit">
        {isSans
          ? <Ban className="w-3.5 h-3.5 text-slate-400" />
          : <Banknote className="w-3.5 h-3.5 text-violet-500" />
        }
        <span className={`text-sm font-semibold ${isSans ? 'text-slate-500 italic' : 'text-violet-700'}`}>
          {fin.name}
        </span>
        {fin.type && (
          <span className={FIN_TYPE_BADGE[fin.type] ?? ''}>
            {fin.type === 'national' ? 'National' : 'Local'}
          </span>
        )}
        <span className="ml-auto text-xs font-semibold text-amber-600">
          {fin.total_tranches} tranche{fin.total_tranches > 1 ? 's' : ''}
        </span>
      </div>

      {/* Lignes */}
      <div className="overflow-x-auto px-3 pb-3">
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-200">
              <th className="pb-1.5 pr-4 font-medium">Situation</th>
              <th className="pb-1.5 pr-4 font-medium">Niveau</th>
              <th className="pb-1.5 pr-3 font-medium text-right" title="Mentorats clôturés">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline" />
              </th>
              <th className="pb-1.5 pr-3 font-medium text-right" title="Actifs éligibles ≥12 mois">
                <Clock className="w-3.5 h-3.5 text-sky-500 inline" />
              </th>
              <th className="pb-1.5 pr-3 font-medium text-right" title="Actifs en attente <12 mois">
                <Clock className="w-3.5 h-3.5 text-slate-300 inline" />
              </th>
              <th className="pb-1.5 pr-4 font-medium text-right">Durée</th>
              <th className="pb-1.5 font-medium text-right text-amber-600">Tranches</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fin.lignes.map((seg, i) => (
              <tr key={i} className="hover:bg-white/60">
                <td className="py-1.5 pr-4">
                  <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${SIT_BADGE[seg.situation] ?? SIT_BADGE['inconnu']}`}>
                    {seg.situation_label}
                  </span>
                </td>
                <td className={`py-1.5 pr-4 text-xs ${NIV_CLS[seg.niveau]}`}>
                  {seg.niveau_label}
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-emerald-600 font-medium">
                  {seg.nb_clos || '—'}
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-sky-600 font-medium">
                  {seg.nb_actifs_eligible || '—'}
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-slate-400">
                  {seg.nb_actifs_attente || '—'}
                </td>
                <td className="py-1.5 pr-4 text-right text-xs text-slate-500 whitespace-nowrap">
                  {fmtMois(seg.duree_mois)}
                </td>
                <td className="py-1.5 text-right">
                  <span className={`font-bold tabular-nums ${seg.tranches > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {seg.tranches > 0 ? seg.tranches : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {fin.lignes.length > 1 && (
            <tfoot>
              <tr className="border-t-2 border-amber-200">
                <td colSpan={6} className="pt-1.5 pr-4 text-right text-xs font-semibold text-slate-600">
                  Sous-total
                </td>
                <td className="pt-1.5 text-right font-bold text-amber-700">
                  {fin.total_tranches}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ── Synthèse multi-pôles ──────────────────────────────────────────────────

function SyntheseTable({ poles, grandTotal }: { poles: PoleData[]; grandTotal: number }) {
  const assocSet = new Map<number, string>();
  for (const p of poles) for (const a of p.associations) assocSet.set(a.id, a.name);
  const assocs = Array.from(assocSet.entries());

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
