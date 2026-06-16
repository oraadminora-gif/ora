// src/pages/member/cn/NationalKPIs.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import api from '../../../services/api';
import { fetchNationalKPIsDetailed } from '../../../services/kpiService';
import type { KpiPeriod } from '../../../services/kpiService';
import type { NationalKPIDetailed, PoleKPI, PoleSummaryKPI, FinancementParAssocKPI } from '../../../types/kpi';
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
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────
interface Pole { id: number; name: string; code: string; }

type SortKey = keyof PoleSummaryKPI;
type SortDir = 'asc' | 'desc';

const PERIOD_LABELS: Record<KpiPeriod, string> = {
  semester: 'Semestre 1',
  year:     'Semestre 2',
  annee:    'Année',
  all:      'Tout',
};

const PERIOD_DESC: Record<KpiPeriod, string> = {
  semester: '1er jan – 30 jun',
  year:     '1er jul – 31 déc',
  annee:    '1er jan – 31 déc',
  all:      'Accumulation totale',
};

const DIPLOME_NIVEAU: Record<string, number> = {
  CAP: 3, BEP: 3, BAC_PRO: 4, BAC_AUTRE: 4, BP: 4,
  BTS: 5, DUT: 5, BUT: 6, LIC_PRO: 6,
  MASTER: 7, ING: 7, DEA: 8, DES: 8,
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

function TauxBar({ label, value, color = '#3b82f6' }: { label: string; value: number; color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{value}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-slate-600">{label}</span>
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
  { key: 'nat-global',      label: 'Vue globale' },
  { key: 'nat-mentors',     label: 'Mentors & Capacité' },
  { key: 'nat-performance', label: 'Performance qualitative' },
  { key: 'nat-jeunes',      label: 'Résultats jeunes' },
  { key: 'nat-poles',       label: 'Comparaison inter-pôles' },
];

const POLE_PRINT_SECTIONS = [
  { key: 'pole-global',       label: 'Vue globale' },
  { key: 'pole-mentors',      label: 'Mentors & Capacité' },
  { key: 'pole-performance',  label: 'Performance qualitative' },
  { key: 'pole-jeunes',       label: 'Résultats jeunes' },
  { key: 'pole-national',     label: 'Comparaison nationale' },
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
// VUE NATIONALE — structure calquée sur PoleKPIs
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

  const genderData = [
    { name: 'Filles',  value: data.filles_pct,  color: '#ec4899' },
    { name: 'Garçons', value: data.garcons_pct,  color: '#3b82f6' },
    { name: 'Autres',  value: Math.max(0, 100 - data.filles_pct - data.garcons_pct), color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const assocData = (data.mentors_par_association ?? []).slice(0, 8).map(a => ({
    name: a.association__name ?? '—', mentors: a.count,
  }));
  const capaciteAssocData = (data.capacite_par_association ?? []).slice(0, 8).map(a => ({
    name: a.association__name ?? '—', places: a.capacite,
  }));

  const total_demandes = data.total_demandes ?? data.total_jeunes;

  return (
    <div className="space-y-8">

      {/* ── Section 1 : Vue globale ──────────────────────────────── */}
      <section id="nat-section-global">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
          <SectionTitle>Vue globale — {PERIOD_LABELS[period]}</SectionTitle>
          <span className="text-xs text-slate-400 mb-3">de l'activité demandes / mentorats ({PERIOD_DESC[period]})</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Demandes reçues" value={total_demandes}
            sub={`${data.filles_pct}% filles · ${data.garcons_pct}% garçons`}
            icon={<Users size={20} />} color="blue" />
          <StatCard label="Demandes en attente" value={data.demandes_en_attente}
            icon={<Hourglass size={20} />} color="amber" />
          <StatCard label="Mentorats créés" value={data.mentorats_crees ?? 0}
            sub="sur la période"
            icon={<TrendingUp size={20} />} color="purple" />
          <StatCard label="Mentorats en cours" value={data.mentorats_actifs}
            icon={<UserCheck size={20} />} color="green" />
          <StatCard label="Mentorats clos" value={data.mentorats_closes}
            icon={<CheckCircle size={20} />} color="slate" />
          <StatCard label="Délai moyen d'affectation" value={`${data.delai_moyen ?? 0} j`}
            sub="demande → mentor"
            icon={<Clock size={20} />} color={(data.delai_moyen ?? 0) > 14 ? 'red' : 'green'}
            up={(data.delai_moyen ?? 0) <= 14} />
        </div>
      </section>

      {/* ── Section 2 : Mentors & Capacité ──────────────────────── */}
      <section id="nat-section-mentors">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
          <SectionTitle>Mentors &amp; Capacité</SectionTitle>
          <span className="text-xs text-slate-400 mb-3">national — mentorats sur la période</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Mentors actifs (national)" value={data.mentors_total}
            sub={`${data.mentors_inactifs ?? 0} inactifs`}
            icon={<Users size={20} />} color="blue" />
          <StatCard label="Mentors disponibles" value={data.mentors_dispo ?? 0}
            sub={`sur ${data.mentors_total} actifs`}
            icon={<UserCheck size={20} />} color="green" />
          <StatCard label="Places disponibles" value={data.capacite_totale_nationale ?? 0}
            sub="capacité totale"
            icon={<Activity size={20} />} color="green" />
          <StatCard label="Mentors sans mentorat" value={data.mentors_sans_mentorat ?? 0}
            sub="n'ont eu aucun mentorat"
            icon={<Hourglass size={20} />} color="amber" />
          <StatCard label="Nbre moyen / mentor" value={data.moyen_par_mentor ?? 0}
            sub="parmi les mentors actifs"
            icon={<TrendingUp size={20} />} color="purple" />
          <StatCard label="Nbre max / mentor" value={data.max_par_mentor ?? 0}
            icon={<Zap size={20} />} color={(data.max_par_mentor ?? 0) >= 3 ? 'red' : 'slate'} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <ChartCard title="Mentors par association (national)">
            {assocData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(120, assocData.length * 32)}>
                <BarChart data={assocData} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="mentors" name="Mentors" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
          <ChartCard title="Places disponibles par association">
            {capaciteAssocData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(120, capaciteAssocData.length * 32)}>
                <BarChart data={capaciteAssocData} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="places" name="Places dispo" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </section>

      {/* ── Section 3 : Performance qualitative ─────────────────── */}
      <section id="nat-section-performance">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
          <SectionTitle>Performance qualitative — DES MENTORATS CLOS</SectionTitle>
          <span className="text-xs text-slate-400 mb-3">sur la période sélectionnée</span>
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">— Résultats mentorats</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Durée moyenne / mentorat" value={`${data.duree_moyenne ?? 0} mois`}
            icon={<Clock size={20} />} color="purple" />
          <StatCard label="Heures moy. / mentorat" value={`${data.heures_moy_par_mentorat ?? 0} h`}
            icon={<TrendingUp size={20} />} color="purple" />
          <StatCard label="Rencontres moy. / mentorat" value={data.rencontres_moy_par_mentorat ?? 0}
            icon={<Activity size={20} />} color="blue" />

          {/* Type de mentorat */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 w-fit"><Zap size={20} /></div>
            <p className="text-xs font-semibold text-slate-500 leading-tight">Type de mentorat constaté</p>
            {(data.pct_presentiel ?? 0) + (data.pct_distanciel ?? 0) === 0 ? (
              <p className="text-xs text-slate-400 italic">Non renseigné</p>
            ) : (
              <div className="space-y-1">
                {([['Présentiel', data.pct_presentiel ?? 0, 'bg-blue-400'], ['Distanciel', data.pct_distanciel ?? 0, 'bg-purple-400']] as [string, number, string][]).map(([lbl, pct, cls]) => (
                  <div key={lbl}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-600">{lbl}</span>
                      <span className="font-bold text-slate-900">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financement */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 w-fit"><TrendingUp size={20} /></div>
            <p className="text-xs font-semibold text-slate-500 leading-tight">Financement des mentorats</p>
            {data.financement_pct ? (
              <div className="space-y-1">
                {([['National', data.financement_pct.national, '#8b5cf6'], ['Local', data.financement_pct.local, '#3b82f6'], ['Sans fin.', data.financement_pct.sans, '#94a3b8']] as [string, number, string][]).map(([lbl, pct, color]) => (
                  <div key={lbl}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-600">{lbl}</span>
                      <span className="font-bold text-slate-900">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-400 italic">Aucune donnée</p>}
          </div>

          {/* Statut clos */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2">
            <div className="p-2 rounded-lg bg-green-50 text-green-600 w-fit"><CheckCircle size={20} /></div>
            <p className="text-xs font-semibold text-slate-500 leading-tight">Statut des mentorats clos</p>
            {data.cloture_par_sentiment ? (
              <div className="space-y-1">
                {([['Positif', data.cloture_par_sentiment.positif, '#10b981'], ['Nul', data.cloture_par_sentiment.nul, '#94a3b8'], ['Négatif', data.cloture_par_sentiment.negatif, '#ef4444']] as [string, number, string][]).map(([lbl, pct, color]) => (
                  <div key={lbl}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-600">{lbl}</span>
                      <span className="font-bold text-slate-900">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-400 italic">Aucune donnée</p>}
          </div>
        </div>
      </section>

      {/* ── Section 4 : Résultats jeunes ────────────────────────── */}
      <section id="nat-section-jeunes">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">— Résultats jeunes</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* Genre */}
          <ChartCard title="Répartition par genre">
            {total_demandes === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée sur la période</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={4} dataKey="value">
                      {genderData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                  {genderData.map(e => (
                    <span key={e.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                      {e.name} <span className="font-semibold">{e.value}%</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </ChartCard>

          {/* Tranches d'âge */}
          <ChartCard title="Tranches d'âge">
            {!data.tranches_age || total_demandes === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
            ) : (
              <div className="space-y-2">
                {([
                  ['< 18 ans',    data.tranches_age.moins_18,      '#a78bfa'],
                  ['18 – 25 ans', data.tranches_age.annees_18_25,  '#3b82f6'],
                  ['26 – 29 ans', data.tranches_age.annees_26_29,  '#10b981'],
                  ['> 29 ans',    data.tranches_age.plus_29,        '#ef4444'],
                  ...(data.tranches_age.inconnu > 0 ? [['Non renseigné', data.tranches_age.inconnu, '#cbd5e1']] : []),
                ] as [string, number, string][]).map(([lbl, val, color]) => (
                  <div key={lbl} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">{lbl}</span>
                      <span className="font-medium text-slate-900">{val}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${total_demandes > 0 ? Math.round(val / total_demandes * 100) : 0}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          {/* Diplôme par niveau RNCP */}
          <ChartCard title="Diplôme préparé (par niveau)">
            {!data.par_diplome || data.par_diplome.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
            ) : (() => {
              const byNiveau = new Map<number, number>();
              data.par_diplome!.forEach(d => {
                const niv = DIPLOME_NIVEAU[d.code] ?? 99;
                byNiveau.set(niv, (byNiveau.get(niv) ?? 0) + d.count);
              });
              const rows = [...byNiveau.entries()].sort(([a], [b]) => a - b)
                .map(([niv, count]) => ({ label: niv === 99 ? 'Autre' : `Niveau ${niv}`, count }));
              const total = rows.reduce((s, r) => s + r.count, 0);
              const colors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#94a3b8'];
              return (
                <div className="space-y-2">
                  {rows.map((r, i) => {
                    const pct = total > 0 ? Math.round(r.count / total * 100) : 0;
                    return (
                      <div key={r.label} className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-700 font-medium">{r.label}</span>
                          <span className="font-bold text-slate-900">{r.count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </ChartCard>

          {/* Situation */}
          <ChartCard title="Situation">
            {(data.en_apprentissage ?? 0) + (data.en_recherche ?? 0) === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
            ) : (
              <>
                <div className="space-y-3 mt-2">
                  {[
                    { label: 'Déjà en apprentissage', value: data.en_apprentissage ?? 0, color: '#10b981' },
                    { label: 'En recherche',           value: data.en_recherche     ?? 0, color: '#3b82f6' },
                  ].map(({ label, value, color }) => {
                    const tot = (data.en_apprentissage ?? 0) + (data.en_recherche ?? 0);
                    const pct = tot > 0 ? Math.round(value / tot * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">{label}</span>
                          <span className="font-semibold" style={{ color }}>{value} <span className="text-xs text-slate-400">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-4 text-center">
                  Total renseigné : {(data.en_apprentissage ?? 0) + (data.en_recherche ?? 0)} / {total_demandes}
                </p>
              </>
            )}
          </ChartCard>

          {/* Problématiques top 5 */}
          <ChartCard title="Les principales problématiques (5)" className="lg:col-span-2">
            {!data.problematiques_top5 || data.problematiques_top5.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune problématique renseignée</p>
            ) : (
              <div className="space-y-2">
                {data.problematiques_top5.map((p, i) => {
                  const maxCount = data.problematiques_top5![0].count;
                  const pct = maxCount > 0 ? Math.round(p.count / maxCount * 100) : 0;
                  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
                  return (
                    <div key={p.code} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 font-medium">{i + 1}. {PROBLEMATIQUES_LABELS[p.code] ?? p.code}</span>
                        <span className="font-bold text-slate-900">{p.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ChartCard>

        </div>
      </section>

      {/* ── Section 5 : Comparaison inter-pôles ─────────────────── */}
      <section id="nat-section-poles">
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
// VUE PÔLE DÉTAILLÉE — identique à PoleKPIs.tsx
// ─────────────────────────────────────────────────────────────
function PoleDetailView({ data, nationalData, poleName, period }: {
  data: PoleKPI;
  nationalData: NationalKPIDetailed | null;
  poleName: string;
  period: KpiPeriod;
}) {
  const genderData = [
    { name: 'Filles',  value: data.filles,  color: '#ec4899' },
    { name: 'Garçons', value: data.garcons, color: '#3b82f6' },
    ...(data.autres > 0 ? [{ name: 'Autres', value: data.autres, color: '#a78bfa' }] : []),
  ];
  const statutData = [
    { name: 'Actifs',     value: data.mentorats_actifs,     color: '#10b981' },
    { name: 'En attente', value: data.mentorats_pending,    color: '#f59e0b' },
    { name: 'Clôturés',   value: data.mentorats_closes,    color: '#6b7280' },
    { name: 'Abandonnés', value: data.mentorats_abandonnes, color: '#ef4444' },
  ].filter(d => d.value > 0);
  const assocData = (data.mentors_par_association ?? []).slice(0, 8).map(a => ({
    name: a.association__name ?? '—', mentors: a.count,
  }));
  const capaciteAssocData = (data.capacite_par_association ?? []).slice(0, 8).map(a => ({
    name: a.association__name ?? '—', places: a.capacite,
  }));

  return (
    <div className="space-y-7">
      {/* Bannière pôle sélectionné */}
      <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-200 rounded-xl w-fit text-sm font-medium text-violet-700">
        <Activity size={16} />
        Indicateurs du pôle : {poleName}
      </div>

      {/* Alertes */}
      {data.alertes_rouges_actives > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-600 mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold text-red-900">
              {data.alertes_rouges_actives} mentorat{data.alertes_rouges_actives > 1 ? 's' : ''} en alerte rouge
            </p>
            <p className="text-sm text-red-700">Ces binômes nécessitent une intervention immédiate.</p>
          </div>
        </div>
      )}
      {data.urgences_non_traitees > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Zap className="text-amber-600 mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold text-amber-900">
              {data.urgences_non_traitees} demande{data.urgences_non_traitees > 1 ? 's' : ''} urgente{data.urgences_non_traitees > 1 ? 's' : ''} non traitée{data.urgences_non_traitees > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-amber-700">Niveau d'urgence ≥ 4 — sans mentor assigné.</p>
          </div>
        </div>
      )}

      {/* Section 1 : Vue globale */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
          <SectionTitle>Vue globale — {PERIOD_LABELS[period]}</SectionTitle>
          <span className="text-xs text-slate-400 mb-3">de l'activité demandes / mentorats ({PERIOD_DESC[period]})</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Demandes reçues" value={data.total_demandes}
            sub={`${data.filles_pct}% filles · ${data.garcons_pct}% garçons`}
            icon={<Users size={20} />} color="blue" />
          <StatCard label="Demandes en attente" value={data.demandes_en_attente}
            icon={<Hourglass size={20} />} color="amber" />
          <StatCard label="Mentorats créés" value={data.mentorats_crees ?? 0}
            sub="sur la période"
            icon={<TrendingUp size={20} />} color="purple" />
          <StatCard label="Mentorats en cours" value={data.mentorats_actifs}
            icon={<UserCheck size={20} />} color="green" />
          <StatCard label="Mentorats clos" value={data.mentorats_closes}
            icon={<CheckCircle size={20} />} color="slate" />
          <StatCard label="Délai moyen d'affectation" value={`${data.delai_moyen} j`}
            sub="demande → mentor"
            icon={<Clock size={20} />} color={data.delai_moyen > 14 ? 'red' : 'green'}
            up={data.delai_moyen <= 14} />
        </div>
      </div>

      {/* Section 2 : Mentors & Capacité */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
          <SectionTitle>Mentors &amp; Capacité</SectionTitle>
          <span className="text-xs text-slate-400 mb-3">Mentorats sur la période et à date</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Mentors disponibles sur Pôle" value={data.mentors_total}
            sub={`${data.mentors_satures} saturés`}
            icon={<Users size={20} />} color="blue" />
          <StatCard label="Mentors disponibles pour affectation" value={data.mentors_disponibles}
            sub={`sur ${data.mentors_total} actifs`}
            icon={<UserCheck size={20} />} color="green" />
          <StatCard label="Mentorats possibles" value={data.capacite_restante}
            sub="places disponibles"
            icon={<Activity size={20} />} color="green" />
          <StatCard label="Mentors dispo sans mentorat" value={data.mentors_sans_mentorat ?? 0}
            sub="n'ont eu aucun mentorat"
            icon={<Hourglass size={20} />} color="amber" />
          <StatCard label="Nbre moyen de mentorats / mentor" value={data.moyen_par_mentor ?? 0}
            sub="parmi les mentors actifs"
            icon={<TrendingUp size={20} />} color="purple" />
          <StatCard label="Nbre max de mentorats / mentor" value={data.max_par_mentor ?? 0}
            icon={<Zap size={20} />} color={(data.max_par_mentor ?? 0) >= 3 ? 'red' : 'slate'} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Mentors par association">
            {assocData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune association</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(120, assocData.length * 32)}>
                <BarChart data={assocData} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="mentors" name="Mentors" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
          <ChartCard title="Mentorats possibles par association">
            {capaciteAssocData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(120, capaciteAssocData.length * 32)}>
                <BarChart data={capaciteAssocData} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="places" name="Places dispo" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Section 3 : Performance qualitative */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
          <SectionTitle>Performance qualitative — DES MENTORATS CLOS</SectionTitle>
          <span className="text-xs text-slate-400 mb-3">sur la période sélectionnée</span>
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">— Résultats mentorats</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Durée moyenne par mentorat" value={`${data.duree_moyenne} mois`}
            icon={<Clock size={20} />} color="purple" />
          <StatCard label="Heures moy. par mentorat" value={`${data.heures_moy_par_mentorat ?? 0} h`}
            icon={<TrendingUp size={20} />} color="purple" />
          <StatCard label="Rencontres moy. par mentorat" value={data.rencontres_moy_par_mentorat ?? 0}
            icon={<Activity size={20} />} color="blue" />
          {/* Type de mentorat */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 w-fit"><Zap size={20} /></div>
            <p className="text-xs font-semibold text-slate-500 leading-tight">Type de mentorat constaté</p>
            {(data.pct_presentiel ?? 0) + (data.pct_distanciel ?? 0) === 0 ? (
              <p className="text-xs text-slate-400 italic">Non renseigné</p>
            ) : (
              <div className="space-y-1">
                {([['Présentiel', data.pct_presentiel ?? 0, '#3b82f6'], ['Distanciel', data.pct_distanciel ?? 0, '#a78bfa']] as [string, number, string][]).map(([lbl, pct, color]) => (
                  <div key={lbl}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-600">{lbl}</span>
                      <span className="font-bold text-slate-900">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Financement */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 w-fit"><TrendingUp size={20} /></div>
            <p className="text-xs font-semibold text-slate-500 leading-tight">Financement des mentorats</p>
            {data.financement_pct ? (
              <div className="space-y-1">
                {([['National', data.financement_pct.national, '#8b5cf6'], ['Local', data.financement_pct.local, '#3b82f6'], ['Sans fin.', data.financement_pct.sans, '#94a3b8']] as [string, number, string][]).map(([lbl, pct, color]) => (
                  <div key={lbl}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-600">{lbl}</span>
                      <span className="font-bold text-slate-900">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-400 italic">Aucune donnée</p>}
          </div>
          {/* Statut clos */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2">
            <div className="p-2 rounded-lg bg-green-50 text-green-600 w-fit"><CheckCircle size={20} /></div>
            <p className="text-xs font-semibold text-slate-500 leading-tight">Statut des mentorats clos</p>
            {data.cloture_par_sentiment ? (
              <div className="space-y-1">
                {([['Positif', data.cloture_par_sentiment.positif, '#10b981'], ['Nul', data.cloture_par_sentiment.nul, '#94a3b8'], ['Négatif', data.cloture_par_sentiment.negatif, '#ef4444']] as [string, number, string][]).map(([lbl, pct, color]) => (
                  <div key={lbl}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-600">{lbl}</span>
                      <span className="font-bold text-slate-900">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-400 italic">Aucune donnée</p>}
          </div>
        </div>
      </div>

      {/* Section 4 : Résultats jeunes */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">— Résultats jeunes</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Genre */}
          <ChartCard title="Répartition par genre">
            {data.total_demandes === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée sur la période</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={4} dataKey="value">
                      {genderData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [v ?? 0, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-5 mt-2">
                  {genderData.map((e, i) => <LegendDot key={i} color={e.color} label={`${e.name} (${e.value})`} />)}
                </div>
              </>
            )}
          </ChartCard>
          {/* Tranches d'âge */}
          <ChartCard title="Tranches d'âge">
            {!data.tranches_age || data.total_demandes === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
            ) : (
              <div className="space-y-2">
                {([
                  ['< 18 ans',    data.tranches_age.moins_18,      '#a78bfa'],
                  ['18 – 25 ans', data.tranches_age.annees_18_25, '#3b82f6'],
                  ['26 – 29 ans', data.tranches_age.annees_26_29, '#10b981'],
                  ['> 29 ans',    data.tranches_age.plus_29,       '#ef4444'],
                  ...(data.tranches_age.inconnu > 0 ? [['Non renseigné', data.tranches_age.inconnu, '#cbd5e1']] : []),
                ] as [string, number, string][]).map(([lbl, val, color]) => (
                  <div key={lbl} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">{lbl}</span>
                      <span className="font-medium text-slate-900">{val}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${data.total_demandes > 0 ? Math.round(val / data.total_demandes * 100) : 0}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
          {/* Diplôme par niveau RNCP */}
          <ChartCard title="Diplôme préparé (par niveau)">
            {!data.par_diplome || data.par_diplome.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
            ) : (() => {
              const byNiveau = new Map<number, number>();
              data.par_diplome!.forEach(d => {
                const niv = DIPLOME_NIVEAU[d.code] ?? 99;
                byNiveau.set(niv, (byNiveau.get(niv) ?? 0) + d.count);
              });
              const rows = [...byNiveau.entries()].sort(([a], [b]) => a - b)
                .map(([niv, count]) => ({ label: niv === 99 ? 'Autre' : `Niveau ${niv}`, count }));
              const total = rows.reduce((s, r) => s + r.count, 0);
              const colors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#94a3b8'];
              return (
                <div className="space-y-2">
                  {rows.map((r, i) => {
                    const pct = total > 0 ? Math.round(r.count / total * 100) : 0;
                    return (
                      <div key={r.label} className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-700 font-medium">{r.label}</span>
                          <span className="font-bold text-slate-900">{r.count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </ChartCard>
          {/* Situation */}
          <ChartCard title="Situation">
            {(data.en_apprentissage ?? 0) + (data.en_recherche ?? 0) === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
            ) : (
              <>
                <div className="space-y-3 mt-2">
                  {[
                    { label: 'Déjà en apprentissage', value: data.en_apprentissage ?? 0, color: '#10b981' },
                    { label: 'En recherche',           value: data.en_recherche     ?? 0, color: '#3b82f6' },
                  ].map(({ label, value, color }) => {
                    const tot = (data.en_apprentissage ?? 0) + (data.en_recherche ?? 0);
                    const pct = tot > 0 ? Math.round(value / tot * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">{label}</span>
                          <span className="font-semibold" style={{ color }}>{value} <span className="text-xs text-slate-400">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-4 text-center">
                  Total renseigné : {(data.en_apprentissage ?? 0) + (data.en_recherche ?? 0)} / {data.total_demandes}
                </p>
              </>
            )}
          </ChartCard>
          {/* Problématiques top 5 */}
          <ChartCard title="Les principales problématiques (5)" className="lg:col-span-2">
            {!data.problematiques_top5 || data.problematiques_top5.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune problématique renseignée</p>
            ) : (
              <div className="space-y-2">
                {data.problematiques_top5.map((p, i) => {
                  const maxCount = data.problematiques_top5![0].count;
                  const pct = maxCount > 0 ? Math.round(p.count / maxCount * 100) : 0;
                  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
                  return (
                    <div key={p.code} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 font-medium">{i + 1}. {p.label ?? PROBLEMATIQUES_LABELS[p.code] ?? p.code}</span>
                        <span className="font-bold text-slate-900">{p.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Section 5 : Comparaison nationale */}
      {nationalData && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <SectionTitle>Comparaison nationale</SectionTitle>
            <span className="text-xs text-slate-400 mb-3">Même période — {PERIOD_LABELS[period]} ({PERIOD_DESC[period]})</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Indicateur', 'Ce pôle', 'National', 'Écart'].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {([
                  { label: '% filles',                              pole: data.filles_pct,                          nat: nationalData.filles_pct,                          unit: '%',  higherIsBetter: true },
                  { label: 'Heures moy. / mentorat',                pole: data.heures_moy_par_mentorat ?? 0,        nat: nationalData.heures_moy_par_mentorat ?? 0,        unit: ' h', higherIsBetter: true },
                  { label: 'Rencontres moy. / mentorat',            pole: data.rencontres_moy_par_mentorat ?? 0,    nat: nationalData.rencontres_moy_par_mentorat ?? 0,    unit: '',   higherIsBetter: true },
                  { label: 'Clôtures positives (objectif atteint)', pole: data.cloture_par_sentiment?.positif ?? 0, nat: nationalData.cloture_par_sentiment?.positif ?? 0, unit: '%',  higherIsBetter: true },
                  { label: 'Nbre max de mentorats / mentor',        pole: data.max_par_mentor ?? 0,                nat: nationalData.max_par_mentor ?? 0,                unit: '',   higherIsBetter: false },
                  { label: 'Type présentiel (mentorats clos)',      pole: data.pct_presentiel ?? 0,                nat: nationalData.pct_presentiel ?? 0,                unit: '%',  higherIsBetter: true },
                  { label: 'Diplôme préparé niv. < 5 (CAP→BP)',    pole: data.pct_diplome_moins5 ?? 0,            nat: nationalData.pct_diplome_moins5 ?? 0,            unit: '%',  higherIsBetter: false },
                ] as { label: string; pole: number; nat: number; unit: string; higherIsBetter: boolean }[]).map(row => {
                  const diff = row.pole - row.nat;
                  const positive = row.higherIsBetter ? diff >= 0 : diff <= 0;
                  return (
                    <tr key={row.label}>
                      <td className="px-6 py-3 text-slate-800">{row.label}</td>
                      <td className="px-6 py-3 text-right font-semibold text-slate-900">{row.pole.toFixed(1)}{row.unit}</td>
                      <td className="px-6 py-3 text-right text-slate-500">{row.nat.toFixed(1)}{row.unit}</td>
                      <td className={`px-6 py-3 text-right font-semibold ${positive ? 'text-green-600' : 'text-red-500'}`}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(1)}{row.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
    const pd = poleData;
    const genderData = [
      { name: 'Filles',  value: pd.filles,  color: '#ec4899' },
      { name: 'Garçons', value: pd.garcons, color: '#3b82f6' },
      ...(pd.autres > 0 ? [{ name: 'Autres', value: pd.autres, color: '#a78bfa' }] : []),
    ];
    const assocData = (pd.mentors_par_association ?? []).slice(0, 8).map(a => ({
      name: a.association__name ?? '—', mentors: a.count,
    }));
    const capaciteAssocData = (pd.capacite_par_association ?? []).slice(0, 8).map(a => ({
      name: a.association__name ?? '—', places: a.capacite,
    }));

    /* ── Helper inline ── */
    const PTauxBar2 = ({ label, value, color }: { label: string; value: number; color: string }) => (
      <div style={{ marginBottom: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
          <span>{label}</span><span style={{ fontWeight: 600 }}>{value}%</span>
        </div>
        <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: color, borderRadius: 2 }} />
        </div>
      </div>
    );

    return (
      <div style={{ fontFamily: 'Arial, sans-serif', color: '#1e293b', fontSize: 12, padding: 0 }}>
        <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #0f172a' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
            Indicateurs de performance — Pôle : {selectedPoleName}
          </h1>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
            Période : {PERIOD_LABELS[period]} &nbsp;•&nbsp; Généré le {date}
          </p>
        </div>

        {/* Section 1 : Vue globale */}
        {has('pole-global') && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
              color: '#94a3b8', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
              Vue globale — {PERIOD_LABELS[period]} ({PERIOD_DESC[period]})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
              {([
                ['Demandes reçues',        pd.total_demandes,        `${pd.filles_pct}% F · ${pd.garcons_pct}% G`],
                ['En attente',             pd.demandes_en_attente,  ''],
                ['Mentorats créés',        pd.mentorats_crees ?? 0, 'sur la période'],
                ['Mentorats en cours',     pd.mentorats_actifs,     ''],
                ['Mentorats clos',         pd.mentorats_closes,     ''],
                ['Délai moyen affectation', `${pd.delai_moyen} j`,  'demande → mentor'],
              ] as [string, string|number, string][]).map(([lbl, val, sub]) => (
                <div key={lbl} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', background: '#f8fafc' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{val}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{lbl}</div>
                  {sub && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2 : Mentors & Capacité */}
        {has('pole-mentors') && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
              color: '#94a3b8', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
              Mentors &amp; Capacité
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 10 }}>
              {([
                ['Mentors sur pôle',         pd.mentors_total,            `${pd.mentors_satures} saturés`],
                ['Mentors disponibles',       pd.mentors_disponibles,      `sur ${pd.mentors_total} actifs`],
                ['Mentorats possibles',       pd.capacite_restante,        'places dispo'],
                ['Sans mentorat',             pd.mentors_sans_mentorat ?? 0, 'n\'ont eu aucun'],
                ['Moy. mentorats/mentor',     pd.moyen_par_mentor ?? 0,   'parmi actifs'],
                ['Max mentorats/mentor',      pd.max_par_mentor ?? 0,     ''],
              ] as [string, string|number, string][]).map(([lbl, val, sub]) => (
                <div key={lbl} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', background: '#f8fafc' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{val}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{lbl}</div>
                  {sub && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {assocData.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Mentors par association</div>
                  <BarChart width={280} height={Math.max(80, assocData.length * 26)} layout="vertical"
                    data={assocData} margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 9 }} />
                    <Bar dataKey="mentors" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </div>
              )}
              {capaciteAssocData.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Places disponibles par association</div>
                  <BarChart width={280} height={Math.max(80, capaciteAssocData.length * 26)} layout="vertical"
                    data={capaciteAssocData} margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 9 }} />
                    <Bar dataKey="places" fill="#10b981" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3 : Performance qualitative */}
        {has('pole-performance') && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
              color: '#94a3b8', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
              Performance qualitative — mentorats clos · {PERIOD_LABELS[period]} ({PERIOD_DESC[period]})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 8 }}>
              {([
                ['Durée moy. / mentorat',      `${pd.duree_moyenne} mois`],
                ['Heures moy. / mentorat',     `${pd.heures_moy_par_mentorat ?? 0} h`],
                ['Rencontres moy. / mentorat', pd.rencontres_moy_par_mentorat ?? 0],
              ] as [string, string|number][]).map(([lbl, val]) => (
                <div key={lbl} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', background: '#f8fafc' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{val}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Type de mentorat</div>
                {(pd.pct_presentiel ?? 0) + (pd.pct_distanciel ?? 0) === 0
                  ? <div style={{ fontSize: 9, color: '#94a3b8' }}>Non renseigné</div>
                  : <><PTauxBar2 label="Présentiel" value={pd.pct_presentiel ?? 0} color="#3b82f6" />
                     <PTauxBar2 label="Distanciel"  value={pd.pct_distanciel ?? 0} color="#a78bfa" /></>}
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Financement</div>
                {pd.financement_pct
                  ? <><PTauxBar2 label="National" value={pd.financement_pct.national} color="#8b5cf6" />
                     <PTauxBar2 label="Local"     value={pd.financement_pct.local}    color="#3b82f6" />
                     <PTauxBar2 label="Sans fin."  value={pd.financement_pct.sans}    color="#94a3b8" /></>
                  : <div style={{ fontSize: 9, color: '#94a3b8' }}>Aucune donnée</div>}
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Statut clos</div>
                {pd.cloture_par_sentiment
                  ? <><PTauxBar2 label="Positif"  value={pd.cloture_par_sentiment.positif}  color="#10b981" />
                     <PTauxBar2 label="Nul"       value={pd.cloture_par_sentiment.nul}       color="#94a3b8" />
                     <PTauxBar2 label="Négatif"   value={pd.cloture_par_sentiment.negatif}   color="#ef4444" /></>
                  : <div style={{ fontSize: 9, color: '#94a3b8' }}>Aucune donnée</div>}
              </div>
            </div>
          </div>
        )}

        {/* Section 4 : Résultats jeunes */}
        {has('pole-jeunes') && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
              color: '#94a3b8', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
              Résultats jeunes — {PERIOD_LABELS[period]} ({PERIOD_DESC[period]})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              {/* Genre */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Genre des bénéficiaires</div>
                {genderData.filter(d => d.value > 0).length === 0 ? (
                  <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>Aucune donnée</div>
                ) : (
                  <>
                    <PieChart width={150} height={90}>
                      <Pie data={genderData.filter(d => d.value > 0)} cx={75} cy={45}
                        innerRadius={26} outerRadius={40} paddingAngle={3} dataKey="value">
                        {genderData.filter(d => d.value > 0).map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                    <div style={{ marginTop: 4 }}>
                      {genderData.filter(d => d.value > 0).map(e => (
                        <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: e.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 9, color: '#475569' }}>{e.name}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginLeft: 'auto' }}>{e.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* Tranches d'âge */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Tranches d'âge</div>
                {pd.tranches_age && pd.total_demandes > 0 ? (
                  (([
                    ['< 18 ans',    pd.tranches_age.moins_18,      '#a78bfa'],
                    ['18 – 25 ans', pd.tranches_age.annees_18_25, '#3b82f6'],
                    ['26 – 29 ans', pd.tranches_age.annees_26_29, '#10b981'],
                    ['> 29 ans',    pd.tranches_age.plus_29,       '#ef4444'],
                    ...(pd.tranches_age.inconnu > 0 ? [['Non renseigné', pd.tranches_age.inconnu, '#cbd5e1']] : []),
                  ] as [string, number, string][]).map(([lbl, val, color]) => {
                    const pct = pd.total_demandes > 0 ? Math.round(val / pd.total_demandes * 100) : 0;
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
                  }))
                ) : <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>Aucune donnée</div>}
              </div>
              {/* Diplôme par niveau RNCP */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Diplôme préparé (par niveau)</div>
                {pd.par_diplome && pd.par_diplome.length > 0 ? (() => {
                  const byNiveau = new Map<number, number>();
                  pd.par_diplome!.forEach(d => {
                    const niv = DIPLOME_NIVEAU[d.code] ?? 99;
                    byNiveau.set(niv, (byNiveau.get(niv) ?? 0) + d.count);
                  });
                  const rows = [...byNiveau.entries()].sort(([a], [b]) => a - b)
                    .map(([niv, count]) => ({ label: niv === 99 ? 'Autre' : `Niveau ${niv}`, count }));
                  const tot = rows.reduce((s, r) => s + r.count, 0);
                  const dipColors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#94a3b8'];
                  return rows.map((r, i) => {
                    const pct = tot > 0 ? Math.round(r.count / tot * 100) : 0;
                    return (
                      <div key={r.label} style={{ marginBottom: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                          <span style={{ fontWeight: 600 }}>{r.label}</span>
                          <span style={{ fontWeight: 600 }}>{r.count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: dipColors[i % dipColors.length], borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  });
                })() : <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>Aucune donnée</div>}
              </div>
            </div>
            {/* Ligne 2 : Situation + Problématiques */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Situation</div>
                {(() => {
                  const app  = pd.en_apprentissage ?? 0;
                  const rech = pd.en_recherche ?? 0;
                  const tot  = app + rech;
                  if (tot === 0) return <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>Aucune donnée</div>;
                  return (
                    <>
                      {([['Apprentissage', app, '#10b981'], ['En recherche', rech, '#3b82f6']] as [string, number, string][]).map(([lbl, val, color]) => {
                        const pct = tot > 0 ? Math.round(val / tot * 100) : 0;
                        return (
                          <div key={lbl} style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                              <span>{lbl}</span><span style={{ fontWeight: 600, color }}>{val} ({pct}%)</span>
                            </div>
                            <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>Total : {tot} / {pd.total_demandes}</div>
                    </>
                  );
                })()}
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Top 5 problématiques</div>
                {(pd.problematiques_top5 ?? []).length === 0
                  ? <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>Aucune problématique renseignée</div>
                  : (() => {
                      const maxC   = pd.problematiques_top5![0].count;
                      const pCols  = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'];
                      return pd.problematiques_top5!.map((p, i) => {
                        const pct = maxC > 0 ? Math.round(p.count / maxC * 100) : 0;
                        return (
                          <div key={p.code} style={{ marginBottom: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                              <span>{i + 1}. {p.label ?? PROBLEMATIQUES_LABELS[p.code] ?? p.code}</span>
                              <span style={{ fontWeight: 600 }}>{p.count}</span>
                            </div>
                            <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pCols[i] ?? '#94a3b8', borderRadius: 2 }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
              </div>
            </div>
          </div>
        )}

        {/* Section 5 : Comparaison nationale */}
        {has('pole-national') && nationalData && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
              color: '#94a3b8', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
              Comparaison nationale — {PERIOD_LABELS[period]} ({PERIOD_DESC[period]})
            </div>
            <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Indicateur', 'Ce pôle', 'National', 'Écart'].map((h, i) => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: i === 0 ? 'left' : 'right',
                      fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  { label: '% filles',                              pole: pd.filles_pct,                          nat: nationalData.filles_pct,                          unit: '%',  higherIsBetter: true },
                  { label: 'Heures moy. / mentorat',                pole: pd.heures_moy_par_mentorat ?? 0,        nat: nationalData.heures_moy_par_mentorat ?? 0,        unit: ' h', higherIsBetter: true },
                  { label: 'Rencontres moy. / mentorat',            pole: pd.rencontres_moy_par_mentorat ?? 0,    nat: nationalData.rencontres_moy_par_mentorat ?? 0,    unit: '',   higherIsBetter: true },
                  { label: 'Clôtures positives (objectif atteint)', pole: pd.cloture_par_sentiment?.positif ?? 0, nat: nationalData.cloture_par_sentiment?.positif ?? 0, unit: '%',  higherIsBetter: true },
                  { label: 'Nbre max mentorats / mentor',           pole: pd.max_par_mentor ?? 0,                nat: nationalData.max_par_mentor ?? 0,                unit: '',   higherIsBetter: false },
                  { label: 'Présentiel (mentorats clos)',           pole: pd.pct_presentiel ?? 0,                nat: nationalData.pct_presentiel ?? 0,                unit: '%',  higherIsBetter: true },
                  { label: 'Diplôme niv. < 5 (CAP→BP)',            pole: pd.pct_diplome_moins5 ?? 0,            nat: nationalData.pct_diplome_moins5 ?? 0,            unit: '%',  higherIsBetter: false },
                ] as { label: string; pole: number; nat: number; unit: string; higherIsBetter: boolean }[]).map(row => {
                  const diff    = row.pole - row.nat;
                  const positive = row.higherIsBetter ? diff >= 0 : diff <= 0;
                  return (
                    <tr key={row.label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '5px 8px', color: '#1e293b' }}>{row.label}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>{row.pole.toFixed(1)}{row.unit}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: '#64748b' }}>{row.nat.toFixed(1)}{row.unit}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600,
                        color: positive ? '#16a34a' : '#dc2626' }}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(1)}{row.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  /* ── VUE NATIONALE ────────────────────────────────────────── */
  if (!nationalData) return null;

  const nd = nationalData;
  const nd_total = nd.total_demandes ?? nd.total_jeunes;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#1e293b', fontSize: 12, padding: 0 }}>
      <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #0f172a' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
          Indicateurs de performance — National
        </h1>
        <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
          Période : {PERIOD_LABELS[period]} &nbsp;•&nbsp; Généré le {date}
        </p>
      </div>

      {/* Section 1 : Vue globale */}
      {has('nat-global') && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
            color: '#94a3b8', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
            Vue globale — {PERIOD_LABELS[period]} ({PERIOD_DESC[period]})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 12 }}>
            {([
              ['Demandes reçues', nd_total, `${nd.filles_pct}% F · ${nd.garcons_pct}% G`],
              ['En attente', nd.demandes_en_attente, ''],
              ['Mentorats créés', nd.mentorats_crees ?? 0, 'sur la période'],
              ['En cours', nd.mentorats_actifs, ''],
              ['Clos', nd.mentorats_closes, ''],
              ['Délai moyen', `${nd.delai_moyen ?? 0} j`, 'demande → mentor'],
            ] as [string, string|number, string][]).map(([lbl, val, sub]) => (
              <div key={lbl} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', background: '#f8fafc' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{val}</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{lbl}</div>
                {sub && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2 : Mentors & Capacité */}
      {has('nat-mentors') && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
            color: '#94a3b8', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
            Mentors &amp; Capacité — national
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 8 }}>
            {([
              ['Mentors actifs', nd.mentors_total, `${nd.mentors_inactifs ?? 0} inactifs`],
              ['Mentors disponibles', nd.mentors_dispo ?? 0, `sur ${nd.mentors_total} actifs`],
              ['Places disponibles', nd.capacite_totale_nationale ?? 0, 'capacité totale'],
              ['Mentors sans mentorat', nd.mentors_sans_mentorat ?? 0, 'n\'ont eu aucun'],
              ['Nbre moyen / mentor', nd.moyen_par_mentor ?? 0, 'par mentor actif'],
              ['Nbre max / mentor', nd.max_par_mentor ?? 0, ''],
            ] as [string, string|number, string][]).map(([lbl, val, sub]) => (
              <div key={lbl} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', background: '#f8fafc' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{val}</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{lbl}</div>
                {sub && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
              </div>
            ))}
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
            {([['Taux de couverture', nd.taux_couverture ?? 0, '#10b981'], ['Taux de saturation mentors', nd.taux_saturation ?? 0, '#ef4444']] as [string, number, string][]).map(([lbl, val, color]) => (
              <div key={lbl} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginBottom: 3 }}>
                  <span>{lbl}</span><span style={{ fontWeight: 600 }}>{val}%</span>
                </div>
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, val)}%`, background: color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3 : Performance qualitative */}
      {has('nat-performance') && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
            color: '#94a3b8', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
            Performance qualitative — mentorats clos · {PERIOD_LABELS[period]} ({PERIOD_DESC[period]})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 8 }}>
            {([
              ['Durée moy. / mentorat', `${nd.duree_moyenne ?? 0} mois`],
              ['Heures moy. / mentorat', `${nd.heures_moy_par_mentorat ?? 0} h`],
              ['Rencontres moy. / mentorat', nd.rencontres_moy_par_mentorat ?? 0],
            ] as [string, string|number][]).map(([lbl, val]) => (
              <div key={lbl} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', background: '#f8fafc' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{val}</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Type de mentorat</div>
              {(nd.pct_presentiel ?? 0) + (nd.pct_distanciel ?? 0) === 0
                ? <div style={{ fontSize: 9, color: '#94a3b8' }}>Non renseigné</div>
                : ([['Présentiel', nd.pct_presentiel ?? 0, '#3b82f6'], ['Distanciel', nd.pct_distanciel ?? 0, '#a78bfa']] as [string, number, string][]).map(([lbl, val, color]) => (
                  <div key={lbl} style={{ marginBottom: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                      <span>{lbl}</span><span style={{ fontWeight: 600 }}>{val}%</span>
                    </div>
                    <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Financement</div>
              {nd.financement_pct
                ? ([['National', nd.financement_pct.national, '#8b5cf6'], ['Local', nd.financement_pct.local, '#3b82f6'], ['Sans fin.', nd.financement_pct.sans, '#94a3b8']] as [string, number, string][]).map(([lbl, val, color]) => (
                  <div key={lbl} style={{ marginBottom: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                      <span>{lbl}</span><span style={{ fontWeight: 600 }}>{val}%</span>
                    </div>
                    <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 2 }} />
                    </div>
                  </div>
                ))
                : <div style={{ fontSize: 9, color: '#94a3b8' }}>Aucune donnée</div>}
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Statut clos</div>
              {nd.cloture_par_sentiment
                ? ([['Positif', nd.cloture_par_sentiment.positif, '#10b981'], ['Nul', nd.cloture_par_sentiment.nul, '#94a3b8'], ['Négatif', nd.cloture_par_sentiment.negatif, '#ef4444']] as [string, number, string][]).map(([lbl, val, color]) => (
                  <div key={lbl} style={{ marginBottom: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                      <span>{lbl}</span><span style={{ fontWeight: 600 }}>{val}%</span>
                    </div>
                    <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 2 }} />
                    </div>
                  </div>
                ))
                : <div style={{ fontSize: 9, color: '#94a3b8' }}>Aucune donnée</div>}
            </div>
          </div>
        </div>
      )}

      {/* Section 4 : Résultats jeunes */}
      {has('nat-jeunes') && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
            color: '#94a3b8', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
            Résultats jeunes — {PERIOD_LABELS[period]} ({PERIOD_DESC[period]})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {/* Genre */}
            {(() => {
              const natGender = [
                { name: 'Filles',  value: Math.round(nd_total * nd.filles_pct / 100),  color: '#ec4899' },
                { name: 'Garçons', value: Math.round(nd_total * nd.garcons_pct / 100), color: '#3b82f6' },
              ].filter(d => d.value > 0);
              if (natGender.length === 0) return null;
              return (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Genre des bénéficiaires</div>
                  <PieChart width={150} height={90}>
                    <Pie data={natGender} cx={75} cy={45} innerRadius={26} outerRadius={40} paddingAngle={3} dataKey="value">
                      {natGender.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                  <div style={{ marginTop: 4 }}>
                    {natGender.map(e => (
                      <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: e.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: '#475569' }}>{e.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#1e293b', marginLeft: 'auto' }}>{e.value}</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 3 }}>
                      {nd.filles_pct}% F · {nd.garcons_pct}% G
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* Tranches d'âge */}
            {nd.tranches_age && (() => {
              const t = nd.tranches_age!;
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
            {/* Diplôme par niveau RNCP */}
            {(nd.par_diplome ?? []).length > 0 && (() => {
              const byNiveau = new Map<number, number>();
              nd.par_diplome!.forEach(d => {
                const niv = DIPLOME_NIVEAU[d.code] ?? 99;
                byNiveau.set(niv, (byNiveau.get(niv) ?? 0) + d.count);
              });
              const rows = [...byNiveau.entries()].sort(([a], [b]) => a - b)
                .map(([niv, count]) => ({ label: niv === 99 ? 'Autre' : `Niveau ${niv}`, count }));
              const tot = rows.reduce((s, r) => s + r.count, 0);
              const colors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#94a3b8'];
              return (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Diplôme préparé (par niveau)</div>
                  {rows.map((r, i) => {
                    const pct = tot > 0 ? Math.round(r.count / tot * 100) : 0;
                    return (
                      <div key={r.label} style={{ marginBottom: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                          <span style={{ fontWeight: 600 }}>{r.label}</span><span style={{ fontWeight: 600 }}>{r.count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: colors[i % colors.length], borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {/* Situation */}
            {(() => {
              const app = nd.en_apprentissage ?? 0;
              const rech = nd.en_recherche ?? 0;
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
          </div>
          {/* Top 5 problématiques */}
          {(nd.problematiques_top5 ?? []).length > 0 && (() => {
            const maxC = nd.problematiques_top5![0].count;
            const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'];
            return (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10, marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Top 5 problématiques</div>
                {nd.problematiques_top5!.map((p, i) => {
                  const pct = maxC > 0 ? Math.round(p.count / maxC * 100) : 0;
                  return (
                    <div key={p.code} style={{ marginBottom: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                        <span>{i + 1}. {PROBLEMATIQUES_LABELS[p.code] ?? p.code}</span>
                        <span style={{ fontWeight: 600 }}>{p.count}</span>
                      </div>
                      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: colors[i] ?? '#94a3b8', borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Section 5 : Comparaison inter-pôles */}
      {has('nat-poles') && (nd.par_pole ?? []).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
            color: '#94a3b8', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
            Comparaison inter-pôles
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Pôle', 'Demandes', 'Actifs', 'Mentors', 'Réussite', 'Alertes', 'Attente'].map(h => (
                  <th key={h} style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 'bold', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nd.par_pole.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '4px 8px', fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '4px 8px' }}>{p.total_demandes}</td>
                  <td style={{ padding: '4px 8px' }}>{p.mentorats_actifs}</td>
                  <td style={{ padding: '4px 8px' }}>{p.mentors_total}</td>
                  <td style={{ padding: '4px 8px', color: p.taux_reussite >= 70 ? '#16a34a' : p.taux_reussite >= 50 ? '#d97706' : '#dc2626', fontWeight: 600 }}>{p.taux_reussite}%</td>
                  <td style={{ padding: '4px 8px', color: p.alertes_rouges > 0 ? '#dc2626' : '#94a3b8' }}>{p.alertes_rouges > 0 ? `${p.alertes_rouges} ⚠` : '—'}</td>
                  <td style={{ padding: '4px 8px' }}>{p.demandes_en_attente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
        <PoleDetailView data={poleData} nationalData={nationalData} poleName={selectedPoleName} period={period} />
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
