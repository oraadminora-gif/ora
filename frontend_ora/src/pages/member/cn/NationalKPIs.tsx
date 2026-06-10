// src/pages/member/cn/NationalKPIs.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import api from '../../../services/api';
import { fetchNationalKPIsDetailed } from '../../../services/kpiService';
import type { KpiPeriod } from '../../../services/kpiService';
import type { NationalKPIDetailed, PoleKPI, PoleSummaryKPI, FinancementKPI, FinancementParAssocKPI } from '../../../types/kpi';
import {
  Users, UserCheck, AlertTriangle, TrendingUp, TrendingDown,
  RefreshCw, Activity, FileDown, ChevronUp, ChevronDown,
  ArrowLeft, CheckCircle, XCircle, Hourglass, Clock, Zap,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Pole { id: number; name: string; code: string; }

type SortKey = keyof PoleSummaryKPI;
type SortDir = 'asc' | 'desc';

const PERIOD_LABELS: Record<KpiPeriod, string> = {
  semester: '6 mois',
  year:     '12 mois',
  all:      'Tout',
};

// ─────────────────────────────────────────────────────────────
// SHARED VISUAL HELPERS
// ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color = 'blue', up }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'pink' | 'purple' | 'amber' | 'slate';
  up?: boolean;
}) {
  const bg: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600',   green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',     pink:   'bg-pink-50 text-pink-600',
    purple: 'bg-purple-50 text-purple-600', amber: 'bg-amber-50 text-amber-600',
    slate:  'bg-slate-100 text-slate-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${bg[color]}`}>{icon}</div>
        {up !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-600 leading-tight">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, className = '' }: {
  title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function TauxBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-bold text-slate-900">{value}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-3">
      {children}
    </h2>
  );
}

function ProfilBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round(count / total * 100) : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-500 text-xs">
          {count} <span className="font-bold text-slate-900 ml-1">{pct}%</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONSTANTES MÉTIER
// ─────────────────────────────────────────────────────────────
const PROBLEMATIQUES_LABELS: Record<string, string> = {
  aide_informatique:  'Aide informatique',
  fle:                'Apprentissage du français (FLE)',
  changer_employeur:  "Changer d'employeur",
  handicap:           'Handicap',
  logement:           'Logement',
  orientation:        'Orientation',
  prob_administratif: 'Problème administratif',
  prob_financier:     'Problème financier',
  fragilite_mentale:  'Fragilité mentale',
  prep_dossier:       'Prép. dossier professionnel',
  relation_employeur: "Relation avec l'employeur",
  recherche_contrat:  'Recherche contrat apprentissage',
  salaire:            'Salaire / Convention',
  soutien_moral:      'Soutien moral',
  soutien_scolaire:   'Soutien scolaire',
  autre:              'Autre',
};

const PROB_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// ─────────────────────────────────────────────────────────────
// MODAL SÉLECTION SECTIONS PDF
// ─────────────────────────────────────────────────────────────
const NATIONAL_PRINT_SECTIONS = [
  { key: 'overview',     label: "Vue d'ensemble" },
  { key: 'charts',       label: 'Graphiques (genre & statut)' },
  { key: 'performance',  label: 'Performance nationale' },
  { key: 'profil',       label: 'Profil des jeunes' },
  { key: 'financements', label: 'Financements' },
  { key: 'poles',        label: 'Comparaison inter-pôles' },
];

const POLE_PRINT_SECTIONS = [
  { key: 'overview',     label: 'Vue globale' },
  { key: 'mentors',      label: 'Mentors & Capacité' },
  { key: 'performance',  label: 'Performance qualitative' },
  { key: 'charts',       label: 'Graphiques' },
  { key: 'profil',       label: 'Profil des bénéficiaires' },
  { key: 'financements', label: 'Financements du pôle' },
  { key: 'aps',          label: 'APs & Urgences' },
];

function PrintModal({ isOpen, isPoleView, onConfirm, onCancel }: {
  isOpen: boolean;
  isPoleView: boolean;
  onConfirm: (sections: Set<string>) => void;
  onCancel: () => void;
}) {
  const sectionList = isPoleView ? POLE_PRINT_SECTIONS : NATIONAL_PRINT_SECTIONS;
  const [selected, setSelected] = useState<Set<string>>(() => new Set(sectionList.map(s => s.key)));

  useEffect(() => {
    if (isOpen) setSelected(new Set(sectionList.map(s => s.key)));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const toggle = (key: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Exporter PDF</h2>
        <p className="text-sm text-slate-500 mb-4">Sélectionnez les rubriques à inclure dans l'export.</p>
        <div className="space-y-2.5">
          {sectionList.map(s => (
            <label key={s.key} className="flex items-center gap-3 cursor-pointer group select-none">
              <input type="checkbox" checked={selected.has(s.key)} onChange={() => toggle(s.key)}
                className="w-4 h-4 accent-violet-600 shrink-0" />
              <span className="text-sm text-slate-700 group-hover:text-slate-900">{s.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Annuler
          </button>
          <button onClick={() => onConfirm(selected)} disabled={selected.size === 0}
            className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 disabled:opacity-40 transition-colors">
            Exporter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE NATIONALE
// ─────────────────────────────────────────────────────────────
function NationalView({
  data, period, onSelectPole,
}: {
  data: NationalKPIDetailed;
  period: KpiPeriod;
  onSelectPole: (p: PoleSummaryKPI) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortedPoles = [...(data.par_pole ?? [])].sort((a, b) => {
    const va = a[sortKey]; const vb = b[sortKey];
    if (typeof va === 'string' && typeof vb === 'string')
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const pieGenre = [
    { name: 'Filles',  value: data.filles_pct,  color: '#ec4899' },
    { name: 'Garçons', value: data.garcons_pct,  color: '#3b82f6' },
    { name: 'Autres',  value: Math.max(0, 100 - data.filles_pct - data.garcons_pct), color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const mentorats_aband = data.mentorats_abandonnes ?? 0;
  const pieStatut = [
    { name: 'Actifs',     value: data.mentorats_actifs,  color: '#22c55e' },
    { name: 'Clôturés',   value: data.mentorats_closes,  color: '#3b82f6' },
    { name: 'Abandonnés', value: mentorats_aband,        color: '#f97316' },
    { name: 'En attente', value: data.mentorats_pending ?? 0, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  function Th({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k;
    return (
      <th onClick={() => handleSort(k)}
        className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none">
        <span className="flex items-center gap-1">
          {label}
          {active ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <section>
        <SectionTitle>Vue d'ensemble nationale · {PERIOD_LABELS[period]}</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard icon={<Activity size={18} />} color="blue"
            label="Pôles actifs" value={data.poles_total} />
          <StatCard icon={<Users size={18} />} color="pink"
            label="Jeunes" value={data.total_jeunes}
            sub={`${data.filles_pct}% F · ${data.garcons_pct}% G`} />
          <StatCard icon={<UserCheck size={18} />} color="green"
            label="Mentorats actifs" value={data.mentorats_actifs}
            sub={`${data.demandes_en_attente} en attente`} />
          <StatCard icon={<TrendingUp size={18} />} color="blue"
            label="Taux de réussite" value={`${data.taux_reussite}%`}
            sub={`Abandon : ${data.taux_abandon}%`} up={data.taux_reussite > 60} />
          <StatCard icon={<Users size={18} />} color="purple"
            label="Mentors"
            value={(data.mentors_total ?? 0) + (data.mentors_inactifs ?? 0)}
            sub={`${data.mentors_total} actifs · ${data.mentors_inactifs ?? 0} inactifs · ${data.mentors_dispo ?? 0} dispos`} />
          <StatCard icon={<AlertTriangle size={18} />} color="red"
            label="Alertes rouges" value={data.alertes_rouges_actives}
            sub={`${data.urgences_non_traitees} urgences`} up={false} />
        </div>
      </section>

      {/* Graphiques */}
      <section>
        <SectionTitle>Répartition nationale</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Genre des bénéficiaires">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={pieGenre} cx="50%" cy="50%" outerRadius={55} dataKey="value">
                  {pieGenre.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
              {pieGenre.map(e => (
                <span key={e.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                  {e.name} <span className="font-semibold">{e.value}%</span>
                </span>
              ))}
            </div>
          </ChartCard>
          <ChartCard title="Statut des mentorats">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={pieStatut} cx="50%" cy="50%" outerRadius={55} dataKey="value">
                  {pieStatut.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
              {pieStatut.map(e => (
                <span key={e.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                  {e.name} <span className="font-semibold">{e.value}</span>
                </span>
              ))}
            </div>
          </ChartCard>
        </div>
      </section>

      {/* Performance nationale */}
      <section>
        <SectionTitle>Performance nationale</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <TauxBar label="Taux de réussite des mentorats"         value={data.taux_reussite}          color="bg-emerald-500" />
            <TauxBar label="Taux d'abandon des mentorats"           value={data.taux_abandon ?? 0}      color="bg-orange-400" />
            <TauxBar label="Taux de couverture (actifs / jeunes)"   value={data.taux_couverture ?? 0}   color="bg-blue-500" />
            <TauxBar label="Taux de saturation des mentors"         value={data.taux_saturation ?? 0}   color="bg-red-400" />
            <TauxBar label="Taux de demandes en attente"            value={data.taux_attente ?? 0}      color="bg-amber-400" />
          </div>
          <div className="space-y-4">
            <StatCard icon={<Clock size={18} />} color="slate"
              label="Délai moyen d'assignation"
              value={`${data.delai_moyen ?? 0} j`}
              sub="entre demande et assignation" />
            <StatCard icon={<Clock size={18} />} color="blue"
              label="Durée moyenne d'un mentorat"
              value={`${data.duree_moyenne ?? 0} mois`}
              sub="sur mentorats actifs & clôturés" />
          </div>
        </div>
      </section>

      {/* Profil des jeunes */}
      {(data.tranches_age || (data.par_diplome ?? []).length > 0 || (data.problematiques_top5 ?? []).length > 0) && (
        <section>
          <SectionTitle>Profil des jeunes</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Tranches d'âge en % */}
            {data.tranches_age && (() => {
              const t = data.tranches_age!;
              const knownTotal = t.moins_18 + t.annees_18_25 + t.annees_26_29 + t.plus_29;
              return (
                <ChartCard title="Tranches d'âge">
                  <div className="space-y-3 mt-1">
                    <ProfilBar label="< 18 ans"    count={t.moins_18}     total={knownTotal} color="#a78bfa" />
                    <ProfilBar label="18 – 25 ans" count={t.annees_18_25} total={knownTotal} color="#3b82f6" />
                    <ProfilBar label="26 – 29 ans" count={t.annees_26_29} total={knownTotal} color="#10b981" />
                    <ProfilBar label="> 29 ans"    count={t.plus_29}      total={knownTotal} color="#ef4444" />
                  </div>
                </ChartCard>
              );
            })()}

            {/* Situation */}
            {((data.en_apprentissage ?? 0) + (data.en_recherche ?? 0)) > 0 && (
              <ChartCard title="Situation">
                <div className="space-y-3 mt-1">
                  <TauxBar
                    label="En apprentissage"
                    value={data.total_jeunes > 0 ? Math.round((data.en_apprentissage ?? 0) / data.total_jeunes * 100) : 0}
                    color="bg-emerald-500"
                  />
                  <TauxBar
                    label="En recherche"
                    value={data.total_jeunes > 0 ? Math.round((data.en_recherche ?? 0) / data.total_jeunes * 100) : 0}
                    color="bg-amber-400"
                  />
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap gap-3">
                    <span><strong className="text-slate-800">{data.en_apprentissage ?? 0}</strong> apprentissage</span>
                    <span><strong className="text-slate-800">{data.en_recherche ?? 0}</strong> recherche</span>
                  </div>
                </div>
              </ChartCard>
            )}

            {/* Diplômes préparés en % */}
            {(data.par_diplome ?? []).length > 0 && (() => {
              const total = (data.par_diplome ?? []).reduce((s, d) => s + d.count, 0);
              const top = (data.par_diplome ?? []).slice(0, 7);
              return (
                <ChartCard title={`Diplômes préparés · ${data.taux_diplome ?? 0}% renseignés`}>
                  <div className="space-y-2 mt-1">
                    {top.map(d => (
                      <ProfilBar key={d.code} label={d.label} count={d.count} total={total} color="#3b82f6" />
                    ))}
                  </div>
                </ChartCard>
              );
            })()}

            {/* Top 5 problématiques des jeunes */}
            {(data.problematiques_top5 ?? []).length > 0 && (() => {
              const total = (data.problematiques_top5 ?? []).reduce((s, d) => s + d.count, 0);
              return (
                <ChartCard title="Top 5 problématiques des jeunes">
                  <div className="space-y-2 mt-1">
                    {(data.problematiques_top5 ?? []).map((d, i) => (
                      <ProfilBar
                        key={d.code}
                        label={PROBLEMATIQUES_LABELS[d.code] ?? d.code}
                        count={d.count}
                        total={total}
                        color={PROB_COLORS[i] ?? '#94a3b8'}
                      />
                    ))}
                  </div>
                </ChartCard>
              );
            })()}
          </div>
        </section>
      )}

      {/* Financements nationaux */}
      {(data.financements_national ?? []).length > 0 && (
        <section>
          <SectionTitle>Mentorats par financeur</SectionTitle>
          <ChartCard title="Répartition nationale des financements">
            <ResponsiveContainer width="100%" height={Math.max(120, data.financements_national!.length * 30)}>
              <BarChart layout="vertical" data={data.financements_national} margin={{ left: 8, right: 48 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="financement__nom" width={150} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, _n, props) => [`${v} mentorat(s)`, props.payload?.financement__type === 'national' ? 'National' : 'Local']} />
                <Bar dataKey="count" name="Mentorats" radius={[0, 4, 4, 0]}>
                  {data.financements_national!.map((f, i) => (
                    <Cell key={i} fill={f.financement__type === 'national' ? '#7c3aed' : '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-violet-700 inline-block" />National</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" />Local</span>
            </div>
          </ChartCard>
        </section>
      )}

      {/* Tableau inter-pôles */}
      <section>
        <SectionTitle>Comparaison inter-pôles</SectionTitle>
        <p className="text-xs text-slate-400 mb-3">Cliquez sur une ligne pour voir les KPIs détaillés du pôle.</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <Th k="name"                label="Pôle" />
                <Th k="total_demandes"      label="Demandes" />
                <Th k="mentorats_actifs"    label="Actifs" />
                <Th k="mentors_total"       label="Mentors" />
                <Th k="taux_reussite"       label="Réussite" />
                <Th k="alertes_rouges"      label="Alertes" />
                <Th k="demandes_en_attente" label="En attente" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedPoles.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400 text-sm">Aucun pôle</td></tr>
              ) : sortedPoles.map(p => (
                <tr key={p.id}
                  onClick={() => onSelectPole(p)}
                  className="hover:bg-violet-50/40 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded mr-2">{p.code}</span>
                    <span className="font-medium text-slate-800">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{p.total_demandes}</td>
                  <td className="px-4 py-3 text-emerald-700 font-medium">{p.mentorats_actifs}</td>
                  <td className="px-4 py-3 text-slate-700">{p.mentors_total}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${p.taux_reussite >= 70 ? 'text-emerald-700' : p.taux_reussite >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {p.taux_reussite}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.alertes_rouges > 0
                      ? <span className="text-red-600 font-bold">{p.alertes_rouges} ⚠</span>
                      : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{p.demandes_en_attente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PIVOT TABLE : financements × associations
// ─────────────────────────────────────────────────────────────
function FinancementsAssocTable({ rows }: { rows: FinancementParAssocKPI[] }) {
  // Build pivot: financements as rows, associations as columns
  const financements = [...new Set(rows.map(r => r.financement__nom))];
  const associations = [...new Set(rows.map(r => r.mentorat__mentor__association__name ?? '—'))];
  const cell = (fin: string, assoc: string) =>
    rows.find(r => r.financement__nom === fin && (r.mentorat__mentor__association__name ?? '—') === assoc)?.count ?? 0;

  if (financements.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left px-3 py-2 font-semibold text-slate-600">Financeur</th>
            {associations.map(a => (
              <th key={a} className="text-center px-3 py-2 font-semibold text-slate-600">{a}</th>
            ))}
            <th className="text-center px-3 py-2 font-semibold text-slate-600">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {financements.map(fin => {
            const total = associations.reduce((s, a) => s + cell(fin, a), 0);
            return (
              <tr key={fin} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-800">{fin}</td>
                {associations.map(a => (
                  <td key={a} className="px-3 py-2 text-center text-slate-700">
                    {cell(fin, a) || <span className="text-slate-300">—</span>}
                  </td>
                ))}
                <td className="px-3 py-2 text-center font-bold text-slate-900">{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE PÔLE DÉTAILLÉE
// ─────────────────────────────────────────────────────────────
function PoleDetailView({ data, poleName }: { data: PoleKPI; poleName: string }) {
  const assocData = (data.mentors_par_association ?? []).map(e => ({
    name: e.association__name, count: e.count,
  }));

  const pieGenre = [
    { name: 'Filles',  value: data.filles,  color: '#ec4899' },
    { name: 'Garçons', value: data.garcons, color: '#3b82f6' },
    { name: 'Autres',  value: data.autres,  color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const pieStatut = [
    { name: 'Actifs',     value: data.mentorats_actifs,    color: '#22c55e' },
    { name: 'Clôturés',   value: data.mentorats_closes,    color: '#3b82f6' },
    { name: 'Abandonnés', value: data.mentorats_abandonnes, color: '#f97316' },
    { name: 'En attente', value: data.mentorats_pending,   color: '#94a3b8' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-200 rounded-xl w-fit text-sm font-medium text-violet-700">
        <Activity size={16} />
        Vue détaillée : {poleName}
      </div>

      {/* Stat globales */}
      <section>
        <SectionTitle>Vue globale</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users size={18} />} color="pink"
            label="Demandes (période)" value={data.total_demandes}
            sub={`${data.filles_pct}% F · ${data.garcons_pct}% G`} />
          <StatCard icon={<Hourglass size={18} />} color="amber"
            label="En attente" value={data.demandes_en_attente}
            sub={`${data.urgences_non_traitees} urgences`} />
          <StatCard icon={<UserCheck size={18} />} color="green"
            label="Mentorats actifs" value={data.mentorats_actifs} />
          <StatCard icon={<AlertTriangle size={18} />} color="red"
            label="Alertes rouges" value={data.alertes_rouges_actives} up={false} />
        </div>
      </section>

      {/* Mentors */}
      <section>
        <SectionTitle>Mentors & Capacité</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users size={18} />} color="purple"
            label="Mentors actifs" value={data.mentors_total} />
          <StatCard icon={<UserCheck size={18} />} color="green"
            label="Disponibles" value={data.mentors_disponibles}
            sub={`Capacité : ${data.capacite_restante}`} />
          <StatCard icon={<Activity size={18} />} color="red"
            label="Saturés" value={data.mentors_satures}
            sub={`${data.taux_saturation}% du pool`} />
          <StatCard icon={<Clock size={18} />} color="slate"
            label="Délai assignation" value={`${data.delai_moyen}j`} />
        </div>
      </section>

      {/* Taux */}
      <section>
        <SectionTitle>Performance qualitative</SectionTitle>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-xl">
          <TauxBar label="Taux de réussite" value={data.taux_reussite} color="bg-emerald-500" />
          <TauxBar label="Taux d'abandon"   value={data.taux_abandon}  color="bg-orange-400" />
          <TauxBar label="Taux de couverture" value={data.taux_couverture} color="bg-blue-500" />
          <TauxBar label="Taux de saturation" value={data.taux_saturation} color="bg-red-400" />
          <div className="flex gap-6 pt-2 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400">Durée moy. mentorat</p>
              <p className="text-lg font-bold text-slate-900">{data.duree_moyenne} mois</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Heures cumulées</p>
              <p className="text-lg font-bold text-slate-900">{data.heures_cumulees} h</p>
            </div>
          </div>
        </div>
      </section>

      {/* Graphiques */}
      <section>
        <SectionTitle>Graphiques</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Genre des bénéficiaires">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={pieGenre} cx="50%" cy="50%" outerRadius={55} dataKey="value">
                  {pieGenre.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
              {pieGenre.map(e => (
                <span key={e.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                  {e.name} <span className="font-semibold">{e.value}</span>
                </span>
              ))}
            </div>
          </ChartCard>
          <ChartCard title="Statut des mentorats">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={pieStatut} cx="50%" cy="50%" outerRadius={55} dataKey="value">
                  {pieStatut.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
              {pieStatut.map(e => (
                <span key={e.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                  {e.name} <span className="font-semibold">{e.value}</span>
                </span>
              ))}
            </div>
          </ChartCard>
          {assocData.length > 0 && (
            <ChartCard title="Mentors par association" className="md:col-span-2">
              <ResponsiveContainer width="100%" height={Math.max(120, assocData.length * 30)}>
                <BarChart layout="vertical" data={assocData} margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      </section>

      {/* Profil des bénéficiaires */}
      {(data.tranches_age || (data.par_diplome ?? []).length > 0) && (
        <section>
          <SectionTitle>Profil des bénéficiaires</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.tranches_age && (() => {
              const t = data.tranches_age!;
              const tranchesData = [
                { name: '< 18 ans',  value: t.moins_18 },
                { name: '18-25 ans', value: t.annees_18_25 },
                { name: '26-29 ans', value: t.annees_26_29 },
                { name: '> 29 ans',  value: t.plus_29 },
              ].filter(d => d.value > 0);
              return (
                <ChartCard title="Tranches d'âge">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={tranchesData} margin={{ left: 0, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
                      <Tooltip />
                      <Bar dataKey="value" name="Jeunes" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              );
            })()}
            {((data.en_apprentissage ?? 0) + (data.en_recherche ?? 0)) > 0 && (
              <ChartCard title="Situation">
                <div className="space-y-3 pt-2">
                  <TauxBar
                    label="En apprentissage"
                    value={data.total_demandes > 0 ? Math.round((data.en_apprentissage ?? 0) / data.total_demandes * 100) : 0}
                    color="bg-emerald-500"
                  />
                  <TauxBar
                    label="En recherche d'apprentissage"
                    value={data.total_demandes > 0 ? Math.round((data.en_recherche ?? 0) / data.total_demandes * 100) : 0}
                    color="bg-amber-400"
                  />
                  <div className="flex gap-6 pt-2 border-t border-slate-100 text-sm text-slate-600">
                    <span><strong className="text-slate-900">{data.en_apprentissage ?? 0}</strong> en apprentissage</span>
                    <span><strong className="text-slate-900">{data.en_recherche ?? 0}</strong> en recherche</span>
                  </div>
                </div>
              </ChartCard>
            )}
            {(data.par_diplome ?? []).length > 0 && (
              <ChartCard title="Diplômes préparés" className="md:col-span-2 xl:col-span-1">
                <ResponsiveContainer width="100%" height={Math.max(140, data.par_diplome!.length * 26)}>
                  <BarChart layout="vertical" data={data.par_diplome} margin={{ left: 8, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Jeunes" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        </section>
      )}

      {/* Financements du pôle */}
      {(data.financements_pole ?? []).length > 0 && (
        <section>
          <SectionTitle>Financements du pôle</SectionTitle>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard title="Mentorats par financeur">
              <ResponsiveContainer width="100%" height={Math.max(120, data.financements_pole!.length * 30)}>
                <BarChart layout="vertical" data={data.financements_pole} margin={{ left: 8, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="financement__nom" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} mentorat(s)`]} />
                  <Bar dataKey="count" name="Mentorats" radius={[0, 4, 4, 0]}>
                    {data.financements_pole!.map((f, i) => (
                      <Cell key={i} fill={f.financement__type === 'national' ? '#7c3aed' : '#06b6d4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-violet-700 inline-block" />National</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" />Local</span>
              </div>
            </ChartCard>
            {(data.financements_par_association ?? []).length > 0 && (
              <ChartCard title="Financements par association">
                <FinancementsAssocTable rows={data.financements_par_association!} />
              </ChartCard>
            )}
          </div>
        </section>
      )}

      {/* APs + Urgences */}
      <section>
        <SectionTitle>APs & Urgences</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl">
          <StatCard icon={<Zap size={18} />} color="purple" label="APs total" value={data.aps_total} />
          <StatCard icon={<CheckCircle size={18} />} color="green" label="APs actifs (suivi)" value={data.aps_actifs} />
          <StatCard icon={<XCircle size={18} />} color="red" label="Urgences non traitées" value={data.urgences_non_traitees} />
        </div>
        {(data.urgences_details ?? []).length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 max-w-xl">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Top urgences</p>
            {data.urgences_details.map((u, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{u.first_name} {u.last_name} · {u.city}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONTENU D'IMPRESSION — dimensions fixes (pas de ResponsiveContainer)
// ─────────────────────────────────────────────────────────────
function PRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#475569', fontSize: 12 }}>{label}</span>
      <strong style={{ fontSize: 12 }}>{value}</strong>
    </div>
  );
}

function PrintContent({ nationalData, poleData, selectedPoleName, period, printSections }: {
  nationalData: NationalKPIDetailed | null;
  poleData: PoleKPI | null;
  selectedPoleName: string;
  period: KpiPeriod;
  printSections: Set<string>;
}) {
  const has = (key: string) => printSections.size === 0 || printSections.has(key);
  const title = selectedPoleName ? `KPIs Pôle : ${selectedPoleName}` : 'KPIs Nationaux';
  const date  = new Date().toLocaleDateString('fr-FR');

  /* ── VUE PÔLE ─────────────────────────────────────────────── */
  if (selectedPoleName && poleData) {
    const pieGenre = [
      { name: 'Filles',  value: poleData.filles,  color: '#ec4899' },
      { name: 'Garçons', value: poleData.garcons,  color: '#3b82f6' },
      { name: 'Autres',  value: poleData.autres,   color: '#94a3b8' },
    ].filter(d => d.value > 0);

    const pieStatut = [
      { name: 'Actifs',     value: poleData.mentorats_actifs,    color: '#22c55e' },
      { name: 'Clôturés',   value: poleData.mentorats_closes,    color: '#3b82f6' },
      { name: 'Abandonnés', value: poleData.mentorats_abandonnes, color: '#f97316' },
      { name: 'En attente', value: poleData.mentorats_pending,   color: '#94a3b8' },
    ].filter(d => d.value > 0);

    const assocData = (poleData.mentors_par_association ?? []).map(e => ({
      name: e.association__name, count: e.count,
    }));

    return (
      <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{title}</h1>
        <p style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>Période : {PERIOD_LABELS[period]} · Généré le {date}</p>

        {has('overview') && <>
          <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '16px 0 8px' }}>Vue globale</h2>
          <PRow label="Demandes (période)"    value={poleData.total_demandes} />
          <PRow label="En attente"            value={poleData.demandes_en_attente} />
          <PRow label="Urgences non traitées" value={poleData.urgences_non_traitees} />
          <PRow label="Mentorats actifs"      value={poleData.mentorats_actifs} />
          <PRow label="Alertes rouges"        value={poleData.alertes_rouges_actives} />
        </>}

        {has('mentors') && <>
          <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '16px 0 8px' }}>Mentors & Capacité</h2>
          <PRow label="Total"            value={poleData.mentors_total} />
          <PRow label="Disponibles"      value={poleData.mentors_disponibles} />
          <PRow label="Saturés"          value={poleData.mentors_satures} />
          <PRow label="Capacité restante" value={poleData.capacite_restante} />
        </>}

        {has('performance') && <>
          <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '16px 0 8px' }}>Performance</h2>
          <PRow label="Taux de réussite"    value={`${poleData.taux_reussite}%`} />
          <PRow label="Taux d'abandon"      value={`${poleData.taux_abandon}%`} />
          <PRow label="Taux de couverture"  value={`${poleData.taux_couverture}%`} />
          <PRow label="Taux de saturation"  value={`${poleData.taux_saturation}%`} />
          <PRow label="Durée moy. mentorat" value={`${poleData.duree_moyenne} mois`} />
          <PRow label="Délai d'assignation" value={`${poleData.delai_moyen} jours`} />
        </>}

        {has('charts') && <>
          <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '20px 0 8px' }}>Graphiques</h2>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {pieGenre.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 4 }}>Genre des bénéficiaires</p>
                <PieChart width={200} height={120}>
                  <Pie data={pieGenre} cx={100} cy={60} outerRadius={50} dataKey="value">
                    {pieGenre.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div style={{ marginTop: 4 }}>
                  {pieGenre.map(e => (
                    <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: e.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, color: '#475569' }}>{e.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 'bold', color: '#1e293b', marginLeft: 'auto' }}>{e.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pieStatut.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 4 }}>Statut des mentorats</p>
                <PieChart width={200} height={120}>
                  <Pie data={pieStatut} cx={100} cy={60} outerRadius={50} dataKey="value">
                    {pieStatut.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div style={{ marginTop: 4 }}>
                  {pieStatut.map(e => (
                    <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: e.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, color: '#475569' }}>{e.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 'bold', color: '#1e293b', marginLeft: 'auto' }}>{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {assocData.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 4 }}>Mentors par association</p>
              <BarChart width={560} height={Math.max(100, assocData.length * 26)}
                layout="vertical" data={assocData} margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10 }} />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </div>
          )}
        </>}

        {has('profil') && (poleData.tranches_age || (poleData.par_diplome ?? []).length > 0) && <>
          <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '16px 0 8px' }}>Profil des bénéficiaires</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {poleData.tranches_age && (() => {
              const t = poleData.tranches_age!;
              const tot = t.moins_18 + t.annees_18_25 + t.annees_26_29 + t.plus_29;
              return (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Tranches d'âge</div>
                  {([['< 18 ans', t.moins_18, '#a78bfa'], ['18-25 ans', t.annees_18_25, '#3b82f6'],
                    ['26-29 ans', t.annees_26_29, '#10b981'], ['> 29 ans', t.plus_29, '#ef4444'],
                  ] as [string, number, string][]).map(([lbl, val, color]) => {
                    const pct = tot > 0 ? Math.round(val / tot * 100) : 0;
                    return (
                      <div key={lbl} style={{ marginBottom: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                          <span>{lbl}</span><span style={{ fontWeight: 600 }}>{val} ({pct}%)</span>
                        </div>
                        <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {(() => {
              const app = poleData.en_apprentissage ?? 0;
              const rech = poleData.en_recherche ?? 0;
              const tot = app + rech;
              if (tot === 0) return null;
              return (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Situation</div>
                  {([['Apprentissage', app, '#10b981'], ['En recherche', rech, '#3b82f6']] as [string, number, string][]).map(([lbl, val, color]) => {
                    const pct = tot > 0 ? Math.round(val / tot * 100) : 0;
                    return (
                      <div key={lbl} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                          <span>{lbl}</span><span style={{ fontWeight: 600, color }}>{val} ({pct}%)</span>
                        </div>
                        <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {(poleData.par_diplome ?? []).length > 0 && (() => {
              const tot = (poleData.par_diplome ?? []).reduce((s, d) => s + d.count, 0);
              return (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Diplômes préparés</div>
                  {(poleData.par_diplome ?? []).slice(0, 7).map(d => {
                    const pct = tot > 0 ? Math.round(d.count / tot * 100) : 0;
                    return (
                      <div key={d.code} style={{ marginBottom: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                          <span>{d.label}</span><span style={{ fontWeight: 600 }}>{d.count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#3b82f6', borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </>}

        {has('financements') && (poleData.financements_pole ?? []).length > 0 && <>
          <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '16px 0 8px' }}>Financements du pôle</h2>
          <BarChart width={660} height={Math.max(80, (poleData.financements_pole ?? []).length * 32)}
            layout="vertical" data={poleData.financements_pole} margin={{ left: 8, right: 52 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="financement__nom" width={150} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [`${v} mentorat(s)`]} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {(poleData.financements_pole ?? []).map((f, i) => (
                <Cell key={i} fill={f.financement__type === 'national' ? '#7c3aed' : '#06b6d4'} />
              ))}
            </Bar>
          </BarChart>
        </>}

        {has('aps') && <>
          <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '16px 0 8px' }}>APs & Urgences</h2>
          <PRow label="APs total"          value={poleData.aps_total} />
          <PRow label="APs actifs (suivi)" value={poleData.aps_actifs} />
          <PRow label="Urgences non traitées" value={poleData.urgences_non_traitees} />
        </>}
      </div>
    );
  }

  /* ── VUE NATIONALE ────────────────────────────────────────── */
  if (!nationalData) return null;

  const pieGenreN = [
    { name: 'Filles',  value: nationalData.filles_pct,  color: '#ec4899' },
    { name: 'Garçons', value: nationalData.garcons_pct,  color: '#3b82f6' },
    { name: 'Autres',  value: Math.max(0, 100 - nationalData.filles_pct - nationalData.garcons_pct), color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const pieStatutN = [
    { name: 'Actifs',     value: nationalData.mentorats_actifs,       color: '#22c55e' },
    { name: 'Clôturés',   value: nationalData.mentorats_closes,       color: '#3b82f6' },
    { name: 'Abandonnés', value: nationalData.mentorats_abandonnes ?? 0, color: '#f97316' },
    { name: 'En attente', value: nationalData.mentorats_pending ?? 0, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{title}</h1>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>Période : {PERIOD_LABELS[period]} · Généré le {date}</p>

      {has('overview') && <>
        <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '0 0 8px' }}>Vue d'ensemble</h2>
        <PRow label="Pôles actifs"          value={nationalData.poles_total} />
        <PRow label="Total jeunes"          value={nationalData.total_jeunes} />
        <PRow label="Dont filles"           value={`${nationalData.filles_pct}%`} />
        <PRow label="Mentorats actifs"      value={nationalData.mentorats_actifs} />
        <PRow label="Demandes en attente"   value={nationalData.demandes_en_attente} />
        <PRow label="Alertes rouges"        value={nationalData.alertes_rouges_actives} />
        <PRow label="Urgences non traitées" value={nationalData.urgences_non_traitees} />
        <PRow label="Mentors total"         value={nationalData.mentors_total} />
        <PRow label="Mentors disponibles"   value={nationalData.mentors_dispo} />
        <PRow label="Mentors saturés"       value={nationalData.mentors_satures} />
      </>}

      {has('performance') && <>
        <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '16px 0 8px' }}>Performance nationale</h2>
        <PRow label="Taux de réussite"           value={`${nationalData.taux_reussite}%`} />
        <PRow label="Taux d'abandon"             value={`${nationalData.taux_abandon ?? 0}%`} />
        <PRow label="Taux de couverture"         value={`${nationalData.taux_couverture ?? 0}%`} />
        <PRow label="Taux de saturation mentors" value={`${nationalData.taux_saturation ?? 0}%`} />
        <PRow label="Taux demandes en attente"   value={`${nationalData.taux_attente ?? 0}%`} />
        <PRow label="Délai moyen d'assignation"  value={`${nationalData.delai_moyen ?? 0} jours`} />
        <PRow label="Durée moy. d'un mentorat"   value={`${nationalData.duree_moyenne ?? 0} mois`} />
      </>}

      {has('charts') && <>
        <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '20px 0 8px' }}>Graphiques</h2>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {pieGenreN.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 4 }}>Genre des bénéficiaires</p>
              <PieChart width={200} height={120}>
                <Pie data={pieGenreN} cx={100} cy={60} outerRadius={50} dataKey="value">
                  {pieGenreN.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
              <div style={{ marginTop: 4 }}>
                {pieGenreN.map(e => (
                  <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: e.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: '#475569' }}>{e.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 'bold', color: '#1e293b', marginLeft: 'auto' }}>{e.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {pieStatutN.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 4 }}>Statut des mentorats</p>
              <PieChart width={200} height={120}>
                <Pie data={pieStatutN} cx={100} cy={60} outerRadius={50} dataKey="value">
                  {pieStatutN.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
              <div style={{ marginTop: 4 }}>
                {pieStatutN.map(e => (
                  <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <div key={e.name} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: e.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: '#475569' }}>{e.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 'bold', color: '#1e293b', marginLeft: 'auto' }}>{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </>}

      {has('profil') && (nationalData.tranches_age || (nationalData.par_diplome ?? []).length > 0 || (nationalData.problematiques_top5 ?? []).length > 0) && <>
        <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '16px 0 8px' }}>Profil des jeunes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {nationalData.tranches_age && (() => {
            const t = nationalData.tranches_age!;
            const tot = t.moins_18 + t.annees_18_25 + t.annees_26_29 + t.plus_29;
            return (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Tranches d'âge</div>
                {([['< 18 ans', t.moins_18, '#a78bfa'], ['18-25 ans', t.annees_18_25, '#3b82f6'],
                  ['26-29 ans', t.annees_26_29, '#10b981'], ['> 29 ans', t.plus_29, '#ef4444'],
                ] as [string, number, string][]).map(([lbl, val, color]) => {
                  const pct = tot > 0 ? Math.round(val / tot * 100) : 0;
                  return (
                    <div key={lbl} style={{ marginBottom: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                        <span>{lbl}</span><span style={{ fontWeight: 600 }}>{val} ({pct}%)</span>
                      </div>
                      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          {(nationalData.par_diplome ?? []).length > 0 && (() => {
            const tot = (nationalData.par_diplome ?? []).reduce((s, d) => s + d.count, 0);
            return (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Diplômes préparés</div>
                {(nationalData.par_diplome ?? []).slice(0, 7).map(d => {
                  const pct = tot > 0 ? Math.round(d.count / tot * 100) : 0;
                  return (
                    <div key={d.code} style={{ marginBottom: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                        <span>{d.label}</span><span style={{ fontWeight: 600 }}>{d.count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#3b82f6', borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          {(nationalData.problematiques_top5 ?? []).length > 0 && (() => {
            const tot = (nationalData.problematiques_top5 ?? []).reduce((s, d) => s + d.count, 0);
            return (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Top 5 problématiques</div>
                {(nationalData.problematiques_top5 ?? []).map((d, i) => {
                  const pct = tot > 0 ? Math.round(d.count / tot * 100) : 0;
                  return (
                    <div key={d.code} style={{ marginBottom: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                        <span>{PROBLEMATIQUES_LABELS[d.code] ?? d.code}</span><span style={{ fontWeight: 600 }}>{d.count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: PROB_COLORS[i] ?? '#94a3b8', borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </>}

      {has('financements') && (nationalData.financements_national ?? []).length > 0 && <>
        <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '16px 0 8px' }}>Financements</h2>
        <BarChart width={660} height={Math.max(80, (nationalData.financements_national ?? []).length * 32)}
          layout="vertical" data={nationalData.financements_national} margin={{ left: 8, right: 52 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="financement__nom" width={150} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v) => [`${v} mentorat(s)`]} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {(nationalData.financements_national ?? []).map((f, i) => (
              <Cell key={i} fill={f.financement__type === 'national' ? '#7c3aed' : '#06b6d4'} />
            ))}
          </Bar>
        </BarChart>
      </>}

      {has('poles') && (nationalData.par_pole ?? []).length > 0 && <>
        <h2 style={{ fontSize: 13, fontWeight: 'bold', margin: '16px 0 8px' }}>Comparaison par pôle</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Pôle', 'Demandes', 'Actifs', 'Mentors', 'Réussite', 'Alertes', 'Attente'].map(h => (
                <th key={h} style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 'bold', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nationalData.par_pole.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '4px 8px' }}>{p.name}</td>
                <td style={{ padding: '4px 8px' }}>{p.total_demandes}</td>
                <td style={{ padding: '4px 8px' }}>{p.mentorats_actifs}</td>
                <td style={{ padding: '4px 8px' }}>{p.mentors_total}</td>
                <td style={{ padding: '4px 8px' }}>{p.taux_reussite}%</td>
                <td style={{ padding: '4px 8px' }}>{p.alertes_rouges}</td>
                <td style={{ padding: '4px 8px' }}>{p.demandes_en_attente}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export function NationalKPIs() {
  const [poles, setPoles]             = useState<Pole[]>([]);
  const [nationalData, setNational]   = useState<NationalKPIDetailed | null>(null);
  const [poleData, setPoleData]       = useState<PoleKPI | null>(null);
  const [selectedPoleId, setSelectedPoleId] = useState<number | null>(null);
  const [selectedPoleName, setSelectedPoleName] = useState('');
  const [period, setPeriod]           = useState<KpiPeriod>('year');
  const [loading, setLoading]         = useState(true);
  const [loadingPole, setLoadingPole] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSections, setPrintSections] = useState<Set<string>>(new Set());

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `kpis-national-${period}-${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 15mm; }
      @media print {
        body { font-size: 11px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .no-print { display: none !important; }
      }
    `,
  });

  const handleConfirmPrint = (selected: Set<string>) => {
    setPrintSections(selected);
    setShowPrintModal(false);
    setTimeout(() => handlePrint(), 300);
  };

  // Charger les pôles
  useEffect(() => {
    api.get('/poles/').then(r => {
      const list: Pole[] = r.data.results ?? r.data ?? [];
      setPoles(list);
    }).catch(() => {});
  }, []);

  // Charger les KPIs nationaux
  const loadNational = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNationalKPIsDetailed(period);
      setNational(data);
    } catch { setError('Impossible de charger les données nationales'); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => {
    if (!selectedPoleId) loadNational();
  }, [selectedPoleId, loadNational]);

  // Charger les KPIs d'un pôle spécifique
  const loadPole = useCallback(async (poleId: number) => {
    setLoadingPole(true);
    setError(null);
    try {
      const data = await fetchNationalKPIsDetailed(period, poleId);
      setPoleData(data as unknown as PoleKPI);
    } catch { setError('Impossible de charger les données du pôle'); }
    finally { setLoadingPole(false); }
  }, [period]);

  useEffect(() => {
    if (selectedPoleId) loadPole(selectedPoleId);
  }, [selectedPoleId, loadPole]);

  const handleSelectPoleFromTable = (p: PoleSummaryKPI) => {
    setSelectedPoleId(p.id);
    setSelectedPoleName(p.name);
    setPoleData(null);
  };

  const handlePoleDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedPoleId(null);
      setSelectedPoleName('');
      setPoleData(null);
    } else {
      const pid = Number(val);
      const found = poles.find(p => p.id === pid);
      setSelectedPoleId(pid);
      setSelectedPoleName(found?.name ?? '');
      setPoleData(null);
    }
  };

  const isLoading = loading || loadingPole;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">KPIs Nationaux</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {selectedPoleName ? `Pôle : ${selectedPoleName}` : 'Vue nationale — tous les pôles'}
          </p>
        </div>
        <button onClick={() => setShowPrintModal(true)}
          className="no-print flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-all">
          <FileDown className="w-4 h-4" />Exporter PDF
        </button>
      </div>

      {/* Contrôles */}
      <div className="no-print flex flex-wrap gap-3 items-center">
        {/* Sélecteur pôle */}
        <div className="flex items-center gap-2">
          {selectedPoleId && (
            <button onClick={() => { setSelectedPoleId(null); setSelectedPoleName(''); setPoleData(null); }}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Retour national">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <select value={selectedPoleId ?? ''} onChange={handlePoleDropdown}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30">
            <option value="">Tous les pôles (national)</option>
            {poles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Sélecteur période */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(Object.entries(PERIOD_LABELS) as [KpiPeriod, string][]).map(([k, v]) => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${period === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {v}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button onClick={() => selectedPoleId ? loadPole(selectedPoleId) : loadNational()}
          disabled={isLoading}
          className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : selectedPoleId && poleData ? (
        <PoleDetailView data={poleData} poleName={selectedPoleName} />
      ) : nationalData ? (
        <NationalView data={nationalData} period={period} onSelectPole={handleSelectPoleFromTable} />
      ) : null}

      {/* Modal sélection rubriques PDF */}
      <PrintModal
        isOpen={showPrintModal}
        isPoleView={!!selectedPoleId && !!poleData}
        onConfirm={handleConfirmPrint}
        onCancel={() => setShowPrintModal(false)}
      />

      {/* Zone hors-écran pour impression — position fixe pour que Recharts puisse mesurer les textes/labels */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '210mm', zIndex: -1 }}>
        <div ref={printRef}>
          <PrintContent
            nationalData={nationalData}
            poleData={poleData}
            selectedPoleName={selectedPoleName}
            period={period}
            printSections={printSections}
          />
        </div>
      </div>
    </div>
  );
}
