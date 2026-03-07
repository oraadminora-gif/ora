// src/pages/member/pole/PoleKPIs.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { fetchPoleKPIs, fetchNationalKPIs } from '../../../services/kpiService';
import type { KpiPeriod } from '../../../services/kpiService';
import type { PoleKPI, NationalKPI } from '../../../types/kpi';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import {
  Users, UserCheck, AlertTriangle, Clock, TrendingUp, TrendingDown,
  RefreshCw, CheckCircle, XCircle, Hourglass, Zap, Activity, FileDown,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPORT_SECTIONS = [
  { id: 'kpi-section-global',      label: 'Vue globale' },
  { id: 'kpi-section-mentors',     label: 'Mentors & Capacité' },
  { id: 'kpi-section-performance', label: 'Performance qualitative' },
  { id: 'kpi-section-charts',      label: 'Graphiques' },
  { id: 'kpi-section-jeunes',      label: 'Profil des jeunes' },
  { id: 'kpi-section-aps',         label: 'APs & Urgences' },
  { id: 'kpi-section-national',    label: 'Comparaison nationale' },
] as const;

const PERIOD_LABELS: Record<KpiPeriod, string> = {
  semester: '6 mois',
  year:     '12 mois',
  all:      'Tout',
};

// ─── Screen sub-components ────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-3">
      {children}
    </h2>
  );
}

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

function GaugeRing({ value, max, color = '#3b82f6', label }: {
  value: number; max: number; color?: string; label: string;
}) {
  const r = 40; const circ = 2 * Math.PI * r;
  const dash = max > 0 ? Math.min(1, value / max) * circ : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
        <text x="50" y="46" textAnchor="middle" fill="#1e293b" fontSize="16" fontWeight="700">{value}</text>
        <text x="50" y="62" textAnchor="middle" fill="#94a3b8" fontSize="10">/ {max}</text>
      </svg>
      <span className="text-xs text-slate-500 text-center">{label}</span>
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

// ─── Export Modal ─────────────────────────────────────────────────────────────

function ExportModal({ period, included, onToggle, onPrint, onClose }: {
  period: KpiPeriod;
  included: Set<string>;
  onToggle: (id: string) => void;
  onPrint: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900 text-lg">Exporter en PDF</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Période : <strong>{PERIOD_LABELS[period]}</strong> — Décochez les rubriques à exclure
          </p>
        </div>
        <div className="px-6 py-4 space-y-3">
          {EXPORT_SECTIONS.map(s => (
            <label key={s.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => onToggle(s.id)}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                included.has(s.id) ? 'bg-ora-blue border-ora-blue' : 'border-slate-300 group-hover:border-slate-400'
              }`}>
                {included.has(s.id) && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${included.has(s.id) ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                {s.label}
              </span>
            </label>
          ))}
        </div>
        <div className="px-6 pb-2">
          <p className="text-xs text-slate-400">
            {included.size} rubrique{included.size > 1 ? 's' : ''} sélectionnée{included.size > 1 ? 's' : ''} sur {EXPORT_SECTIONS.length}
          </p>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">
            Annuler
          </button>
          <button onClick={onPrint} disabled={included.size === 0}
            className="px-4 py-2 text-sm bg-ora-blue text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            <FileDown size={14} />
            Imprimer / Enregistrer PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Print sub-components (inline styles, pas de Tailwind) ───────────────────

function PSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
        color: '#94a3b8', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function PStat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px',
      background: '#f8fafc', minWidth: 0 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function PGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
      {children}
    </div>
  );
}

function PTauxBar({ label, value, color = '#3b82f6' }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function PrintContent({ poleData, nationalData, period, includedSections }: {
  poleData: PoleKPI; nationalData: NationalKPI;
  period: KpiPeriod; includedSections: Set<string>;
}) {
  const genderData = [
    { name: 'Filles',  value: poleData.filles,  color: '#ec4899' },
    { name: 'Garçons', value: poleData.garcons, color: '#3b82f6' },
    ...(poleData.autres > 0 ? [{ name: 'Autres', value: poleData.autres, color: '#a78bfa' }] : []),
  ];
  const statutData = [
    { name: 'Actifs',     value: poleData.mentorats_actifs,     color: '#10b981' },
    { name: 'En attente', value: poleData.mentorats_pending,    color: '#f59e0b' },
    { name: 'Clôturés',   value: poleData.mentorats_closes,    color: '#6b7280' },
    { name: 'Abandonnés', value: poleData.mentorats_abandonnes, color: '#ef4444' },
  ].filter(d => d.value > 0);
  const assocData = (poleData.mentors_par_association ?? []).slice(0, 8).map(a => ({
    name: a.association__name ?? '—', mentors: a.count,
  }));

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#1e293b', fontSize: 12, padding: 0 }}>

      {/* En-tête */}
      <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #0f172a' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
          Indicateurs de performance — Pôle
        </h1>
        <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
          Période : {PERIOD_LABELS[period]} &nbsp;•&nbsp; Généré le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Section 1 : Vue globale */}
      {includedSections.has('kpi-section-global') && (
        <PSection title="Vue globale — période {PERIOD_LABELS[period]}">
          <PGrid>
            <PStat label="Demandes reçues" value={poleData.total_demandes}
              sub={`${poleData.filles_pct}% filles · ${poleData.garcons_pct}% garçons`} />
            <PStat label="Mentorats actifs" value={poleData.mentorats_actifs}
              sub={`${poleData.mentorats_pending} en attente`} />
            <PStat label="Taux de réussite" value={`${poleData.taux_reussite}%`}
              sub={`${poleData.mentorats_closes} clôturés`} />
            <PStat label="Taux d'abandon" value={`${poleData.taux_abandon}%`}
              sub={`${poleData.mentorats_abandonnes} abandonnés`} />
          </PGrid>
        </PSection>
      )}

      {/* Section 2 : Mentors & Capacité */}
      {includedSections.has('kpi-section-mentors') && (
        <PSection title="Mentors & Capacité">
          <PGrid>
            <PStat label="Mentors actifs" value={poleData.mentors_total}
              sub={`${poleData.mentors_disponibles} disponibles`} />
            <PStat label="Capacité restante" value={poleData.capacite_restante} sub="places disponibles" />
            <PStat label="Demandes en attente" value={poleData.demandes_en_attente}
              sub={`${poleData.urgences_non_traitees} urgences`} />
            <PStat label="Taux de saturation" value={`${poleData.taux_saturation}%`}
              sub={`${poleData.mentors_satures} saturés`} />
          </PGrid>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
            <PTauxBar label="Taux de couverture" value={poleData.taux_couverture} color="#10b981" />
            <PTauxBar label="Taux de saturation mentors" value={poleData.taux_saturation}
              color={poleData.taux_saturation > 70 ? '#ef4444' : '#f59e0b'} />
          </div>
        </PSection>
      )}

      {/* Section 3 : Performance qualitative */}
      {includedSections.has('kpi-section-performance') && (
        <PSection title="Performance qualitative">
          <PGrid>
            <PStat label="Durée moyenne" value={`${poleData.duree_moyenne} mois`} sub="par mentorat" />
            <PStat label="Heures cumulées" value={poleData.heures_cumulees} sub="estimation 4 h/mois" />
            <PStat label="Délai d'assignation" value={`${poleData.delai_moyen} j`} sub="demande → mentor" />
            <PStat label="Taux de couverture" value={`${poleData.taux_couverture}%`} sub="actifs / demandes" />
          </PGrid>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
            <PTauxBar label="Réussite"         value={poleData.taux_reussite}   color="#10b981" />
            <PTauxBar label="Abandon"           value={poleData.taux_abandon}    color="#ef4444" />
            <PTauxBar label="Couverture"        value={poleData.taux_couverture} color="#3b82f6" />
            <PTauxBar label="Saturation"        value={poleData.taux_saturation}
              color={poleData.taux_saturation > 70 ? '#ef4444' : '#f59e0b'} />
          </div>
        </PSection>
      )}

      {/* Section 4 : Graphiques */}
      {includedSections.has('kpi-section-charts') && (
        <PSection title="Graphiques">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {/* Genre */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Répartition par genre</div>
              {poleData.total_demandes > 0 ? (
                <>
                  <PieChart width={290} height={130}>
                    <Pie data={genderData} cx="50%" cy="50%" outerRadius={50} dataKey="value">
                      {genderData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [v ?? 0, '']} />
                  </PieChart>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: 9, marginTop: 4 }}>
                    {genderData.map((e, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
                        {e.name} ({e.value})
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 10, padding: '20px 0' }}>Aucune donnée</div>
              )}
            </div>
            {/* Statut */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Statut des mentorats</div>
              {statutData.length > 0 ? (
                <>
                  <PieChart width={290} height={130}>
                    <Pie data={statutData} cx="50%" cy="50%" outerRadius={50} dataKey="value">
                      {statutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [v ?? 0, '']} />
                  </PieChart>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, fontSize: 9, marginTop: 4 }}>
                    {statutData.map((e, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
                        {e.name} ({e.value})
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 10, padding: '20px 0' }}>Aucun mentorat</div>
              )}
            </div>
          </div>
          {/* Mentors par association */}
          {assocData.length > 0 && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, color: '#475569' }}>Mentors par association</div>
              <BarChart width={600} height={Math.max(100, assocData.length * 26)}
                data={assocData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 9 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="mentors" fill="#3b82f6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </div>
          )}
        </PSection>
      )}

      {/* Section 5 : Profil des jeunes */}
      {includedSections.has('kpi-section-jeunes') && (
        <PSection title="Profil des jeunes">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>

            {/* Tranches d'âge */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Tranches d'âge</div>
              {poleData.tranches_age && poleData.total_demandes > 0 ? (
                (([
                  ['< 18 ans',    poleData.tranches_age.moins_18,       '#a78bfa'],
                  ['18 – 25 ans', poleData.tranches_age.annees_18_25,  '#3b82f6'],
                  ['26 – 29 ans', poleData.tranches_age.annees_26_29,  '#10b981'],
                  ['> 29 ans',    poleData.tranches_age.plus_29,        '#ef4444'],
                  ...(poleData.tranches_age.inconnu > 0
                    ? [['Non renseigné', poleData.tranches_age.inconnu, '#cbd5e1']]
                    : []),
                ] as [string, number, string][]).map(([lbl, val, color]) => {
                  const pct = poleData.total_demandes > 0 ? Math.round(val / poleData.total_demandes * 100) : 0;
                  return (
                    <div key={lbl} style={{ marginBottom: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                        <span>{lbl}</span>
                        <span style={{ fontWeight: 600 }}>{val} ({pct}%)</span>
                      </div>
                      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                }))
              ) : (
                <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>Aucune donnée</div>
              )}
            </div>

            {/* Diplôme préparé */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Diplôme préparé</div>
              {poleData.par_diplome && poleData.par_diplome.length > 0 ? (
                poleData.par_diplome.slice(0, 7).map(d => {
                  const pct = poleData.total_demandes > 0 ? Math.round(d.count / poleData.total_demandes * 100) : 0;
                  return (
                    <div key={d.code} style={{ marginBottom: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                        <span>{d.label}</span>
                        <span style={{ fontWeight: 600 }}>{d.count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#3b82f6', borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>Aucune donnée</div>
              )}
            </div>

            {/* Situation */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 7, color: '#475569' }}>Situation</div>
              {(() => {
                const app  = poleData.en_apprentissage ?? 0;
                const rech = poleData.en_recherche     ?? 0;
                const tot  = app + rech;
                if (tot === 0) return (
                  <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>Aucune donnée</div>
                );
                return (
                  <>
                    {([['Apprentissage', app, '#10b981'], ['En recherche', rech, '#3b82f6']] as [string, number, string][]).map(([lbl, val, color]) => {
                      const pct = tot > 0 ? Math.round(val / tot * 100) : 0;
                      return (
                        <div key={lbl} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginBottom: 2 }}>
                            <span>{lbl}</span>
                            <span style={{ fontWeight: 600, color }}>{val} ({pct}%)</span>
                          </div>
                          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 6 }}>
                      Total renseigné : {tot} / {poleData.total_demandes}
                    </div>
                  </>
                );
              })()}
            </div>

          </div>
        </PSection>
      )}

      {/* Section 6 : APs & Urgences */}
      {includedSections.has('kpi-section-aps') && (
        <PSection title="APs & Urgences">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 8, color: '#475569' }}>APs mobilisés</div>
              <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    ['APs au total',        poleData.aps_total],
                    ['APs actifs',          poleData.aps_actifs],
                    ['Taux de mobilisation', poleData.aps_total > 0
                      ? `${Math.round(poleData.aps_actifs / poleData.aps_total * 100)}%` : '—'],
                  ].map(([lbl, val]) => (
                    <tr key={String(lbl)}>
                      <td style={{ padding: '3px 0', color: '#64748b' }}>{lbl}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, color: '#475569' }}>
                Urgences non traitées ({poleData.urgences_non_traitees})
              </div>
              {(poleData.urgences_details ?? []).length === 0 ? (
                <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                  Aucune urgence
                </div>
              ) : (
                poleData.urgences_details.map((u, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0',
                    borderBottom: i < poleData.urgences_details.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 9, fontWeight: 700,
                      background: u.urgency_level >= 5 ? '#fee2e2' : '#fef3c7',
                      color: u.urgency_level >= 5 ? '#b91c1c' : '#92400e' }}>
                      {u.urgency_level}
                    </span>
                    <span style={{ flex: 1, fontSize: 10 }}>{u.first_name} {u.last_name} — {u.city}</span>
                    <span style={{ fontSize: 9, color: '#94a3b8' }}>
                      {new Date(u.request_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </PSection>
      )}

      {/* Section 6 : Comparaison nationale */}
      {includedSections.has('kpi-section-national') && (
        <PSection title="Comparaison nationale">
          <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Indicateur', 'Votre pôle', 'National', 'Écart'].map((h, i) => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: i === 0 ? 'left' : 'right',
                    fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: '% filles',                  pole: poleData.filles_pct,    nat: nationalData.filles_pct,    unit: '%' },
                { label: 'Taux de réussite',           pole: poleData.taux_reussite, nat: nationalData.taux_reussite, unit: '%' },
                { label: 'Mentors disponibles / total',
                  pole: poleData.mentors_total > 0 ? Math.round(poleData.mentors_disponibles / poleData.mentors_total * 100) : 0,
                  nat:  nationalData.mentors_total > 0 ? Math.round(nationalData.mentors_dispo / nationalData.mentors_total * 100) : 0,
                  unit: '%' },
              ].map(row => {
                const diff = row.pole - row.nat;
                return (
                  <tr key={row.label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '5px 8px', color: '#1e293b' }}>{row.label}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>{row.pole.toFixed(1)}{row.unit}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#64748b' }}>{row.nat.toFixed(1)}{row.unit}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600,
                      color: diff >= 0 ? '#16a34a' : '#dc2626' }}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}{row.unit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PSection>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PoleKPIs() {
  const { activeRole } = useAuth();
  const isCN = activeRole === 'CN';

  const [poleData, setPoleData]         = useState<PoleKPI | null>(null);
  const [nationalData, setNationalData] = useState<NationalKPI | null>(null);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [period, setPeriod]             = useState<KpiPeriod>('year');
  const [showExportModal, setShowExportModal] = useState(false);
  const [includedSections, setIncludedSections] = useState<Set<string>>(
    new Set(EXPORT_SECTIONS.map(s => s.id))
  );

  // CN: pole selector
  const [poles, setPoles]               = useState<{ id: number; name: string }[]>([]);
  const [selectedPoleId, setSelectedPoleId] = useState<number | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `kpis-pole-${period}-${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 15mm; }
      @media print {
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        * { box-sizing: border-box; }
      }
    `,
    onAfterPrint: () => setShowExportModal(false),
  });

  // CN: fetch poles list on mount
  useEffect(() => {
    if (!isCN) return;
    api.get<{ id: number; name: string }[]>('/poles/')
      .then(res => {
        const data = res.data as { id: number; name: string }[] | { results: { id: number; name: string }[] };
        const list = Array.isArray(data) ? data : data.results ?? [];
        setPoles(list);
      })
      .catch(() => {/* ignore */});
  }, [isCN]);

  const load = useCallback(async (showRefresh = false) => {
    // CN must select a pole first
    if (isCN && !selectedPoleId) {
      setLoading(false);
      return;
    }
    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [pole, national] = await Promise.all([
        fetchPoleKPIs(period, isCN ? selectedPoleId! : undefined),
        fetchNationalKPIs(),
      ]);
      setPoleData(pole);
      setNationalData(national);
    } catch (e: unknown) {
      console.error('KPI load error:', e);
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      const msg = err?.response?.data?.error ?? err?.message ?? 'Erreur inconnue';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, isCN, selectedPoleId]);

  useEffect(() => { load(); }, [load]);

  const toggleSection = (id: string) => {
    setIncludedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // CN: must select a pole before viewing KPIs
  if (isCN && !selectedPoleId) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-slate-600 font-medium">Sélectionnez un pôle pour afficher ses indicateurs :</p>
      <select
        className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-ora-blue"
        defaultValue=""
        onChange={e => setSelectedPoleId(Number(e.target.value))}
      >
        <option value="" disabled>-- Choisir un pôle --</option>
        {poles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ora-blue" />
    </div>
  );
  if (error) return (
    <div className="text-center py-16 space-y-3">
      <p className="text-red-600 font-medium">Impossible de charger les données</p>
      <p className="text-slate-500 text-sm">{error}</p>
      <button onClick={() => load()} className="mt-2 px-4 py-2 text-sm bg-ora-blue text-white rounded-lg hover:opacity-90">
        Réessayer
      </button>
    </div>
  );
  if (!poleData || !nationalData) return (
    <div className="text-center py-16 text-slate-500">
      Impossible de charger les données. Veuillez réessayer.
    </div>
  );

  const genderData = [
    { name: 'Filles',  value: poleData.filles,  color: '#ec4899' },
    { name: 'Garçons', value: poleData.garcons, color: '#3b82f6' },
    ...(poleData.autres > 0 ? [{ name: 'Autres', value: poleData.autres, color: '#a78bfa' }] : []),
  ];
  const statutData = [
    { name: 'Actifs',     value: poleData.mentorats_actifs,     color: '#10b981' },
    { name: 'En attente', value: poleData.mentorats_pending,    color: '#f59e0b' },
    { name: 'Clôturés',   value: poleData.mentorats_closes,    color: '#6b7280' },
    { name: 'Abandonnés', value: poleData.mentorats_abandonnes, color: '#ef4444' },
  ].filter(d => d.value > 0);
  const assocData = (poleData.mentors_par_association ?? []).slice(0, 8).map(a => ({
    name: a.association__name ?? '—', mentors: a.count,
  }));
  const capaciteData = [
    { name: 'Capacité restante',   value: poleData.capacite_restante },
    { name: 'Demandes en attente', value: poleData.demandes_en_attente },
  ];

  return (
    <>
      {/* ── Contenu print (caché à l'écran, imprimé par react-to-print) ── */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {poleData && nationalData && (
            <PrintContent
              poleData={poleData} nationalData={nationalData}
              period={period} includedSections={includedSections}
            />
          )}
        </div>
      </div>

      {/* ── Modal export ─────────────────────────────────────────────── */}
      {showExportModal && (
        <ExportModal
          period={period} included={includedSections}
          onToggle={toggleSection}
          onPrint={() => handlePrint()}
          onClose={() => setShowExportModal(false)}
        />
      )}

      <div className="space-y-7">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Indicateurs de performance</h1>
            <p className="text-slate-500 text-sm">Tableau de bord de votre pôle</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm">
              {(['semester', 'year', 'all'] as KpiPeriod[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    period === p ? 'bg-ora-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}>
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            <button onClick={() => load(true)} disabled={refreshing}
              className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50" title="Rafraîchir">
              <RefreshCw size={16} className={refreshing ? 'animate-spin text-ora-blue' : 'text-slate-500'} />
            </button>
            <button onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700">
              <FileDown size={16} />
              Exporter PDF
            </button>
          </div>
        </div>

        {/* ── Alertes ────────────────────────────────────────────────── */}
        {poleData.alertes_rouges_actives > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-red-600 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-semibold text-red-900">
                {poleData.alertes_rouges_actives} mentorat{poleData.alertes_rouges_actives > 1 ? 's' : ''} en alerte rouge
              </p>
              <p className="text-sm text-red-700">Ces binômes nécessitent une intervention immédiate.</p>
            </div>
          </div>
        )}
        {poleData.urgences_non_traitees > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Zap className="text-amber-600 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-semibold text-amber-900">
                {poleData.urgences_non_traitees} demande{poleData.urgences_non_traitees > 1 ? 's' : ''} urgente{poleData.urgences_non_traitees > 1 ? 's' : ''} non traitée{poleData.urgences_non_traitees > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-amber-700">Niveau d'urgence ≥ 4 — sans mentor assigné.</p>
            </div>
          </div>
        )}

        {/* ── Section 1 : Vue globale ─────────────────────────────────── */}
        <div id="kpi-section-global" className="space-y-3">
          <SectionTitle>Vue globale — période {PERIOD_LABELS[period]}</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Demandes reçues" value={poleData.total_demandes}
              sub={`${poleData.filles_pct}% filles · ${poleData.garcons_pct}% garçons`}
              icon={<Users size={20} />} color="blue" />
            <StatCard label="Mentorats actifs" value={poleData.mentorats_actifs}
              sub={`${poleData.mentorats_pending} en attente`}
              icon={<UserCheck size={20} />} color="green" />
            <StatCard label="Taux de réussite" value={`${poleData.taux_reussite}%`}
              sub={`${poleData.mentorats_closes} clôturés avec succès`}
              icon={<CheckCircle size={20} />} color="green" up={poleData.taux_reussite >= 50} />
            <StatCard label="Taux d'abandon" value={`${poleData.taux_abandon}%`}
              sub={`${poleData.mentorats_abandonnes} abandonnés`}
              icon={<XCircle size={20} />} color="red" up={poleData.taux_abandon < 20} />
          </div>
        </div>

        {/* ── Section 2 : Mentors & Capacité ─────────────────────────── */}
        <div id="kpi-section-mentors" className="space-y-3">
          <SectionTitle>Mentors & Capacité</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Mentors actifs" value={poleData.mentors_total}
              sub={`${poleData.mentors_disponibles} disponibles`}
              icon={<Users size={20} />} color="blue" />
            <StatCard label="Capacité restante" value={poleData.capacite_restante}
              sub="places mentor disponibles" icon={<Activity size={20} />} color="green" />
            <StatCard label="Demandes en attente" value={poleData.demandes_en_attente}
              sub={`${poleData.urgences_non_traitees} urgences`}
              icon={<Hourglass size={20} />}
              color={poleData.demandes_en_attente > poleData.capacite_restante ? 'red' : 'amber'} />
            <StatCard label="Taux de saturation" value={`${poleData.taux_saturation}%`}
              sub={`${poleData.mentors_satures} mentors saturés`}
              icon={<AlertTriangle size={20} />}
              color={poleData.taux_saturation > 70 ? 'red' : 'amber'}
              up={poleData.taux_saturation < 70} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Prévision offre / demande</h3>
            <TauxBar label="Taux de couverture" value={poleData.taux_couverture} color="#10b981" />
            <TauxBar label="Taux de saturation mentors" value={poleData.taux_saturation}
              color={poleData.taux_saturation > 70 ? '#ef4444' : '#f59e0b'} />
            {poleData.demandes_en_attente > 0 && (
              <p className={`text-xs font-medium ${poleData.capacite_restante >= poleData.demandes_en_attente ? 'text-green-700' : 'text-red-700'}`}>
                {poleData.capacite_restante >= poleData.demandes_en_attente
                  ? `Capacité suffisante : ${poleData.capacite_restante} places pour ${poleData.demandes_en_attente} demandes.`
                  : `Attention : ${poleData.demandes_en_attente - poleData.capacite_restante} demande(s) sans mentor disponible.`}
              </p>
            )}
          </div>
        </div>

        {/* ── Section 3 : Performance qualitative ────────────────────── */}
        <div id="kpi-section-performance" className="space-y-3">
          <SectionTitle>Performance qualitative</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Durée moyenne" value={`${poleData.duree_moyenne} mois`} sub="par mentorat"
              icon={<Clock size={20} />} color="purple" />
            <StatCard label="Heures cumulées" value={poleData.heures_cumulees} sub="estimation (4 h/mois)"
              icon={<TrendingUp size={20} />} color="purple" />
            <StatCard label="Délai d'assignation" value={`${poleData.delai_moyen} j`} sub="entre demande et 1er mentor"
              icon={<Hourglass size={20} />} color={poleData.delai_moyen > 14 ? 'red' : 'green'} up={poleData.delai_moyen <= 14} />
            <StatCard label="Taux de couverture" value={`${poleData.taux_couverture}%`} sub="mentorats actifs / demandes"
              icon={<Activity size={20} />} color="blue" up={poleData.taux_couverture >= 50} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Synthèse des taux</h3>
            <TauxBar label="Réussite"   value={poleData.taux_reussite}   color="#10b981" />
            <TauxBar label="Abandon"    value={poleData.taux_abandon}    color="#ef4444" />
            <TauxBar label="Couverture" value={poleData.taux_couverture} color="#3b82f6" />
            <TauxBar label="Saturation mentors" value={poleData.taux_saturation}
              color={poleData.taux_saturation > 70 ? '#ef4444' : '#f59e0b'} />
          </div>
        </div>

        {/* ── Section 4 : Graphiques ──────────────────────────────────── */}
        <div id="kpi-section-charts" className="space-y-3">
          <SectionTitle>Graphiques</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Répartition par genre">
              {poleData.total_demandes === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucune donnée sur la période</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={genderData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
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
            <ChartCard title="Statut des mentorats">
              {statutData.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucun mentorat sur la période</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                        {statutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [v ?? 0, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {statutData.map((e, i) => <LegendDot key={i} color={e.color} label={`${e.name} (${e.value})`} />)}
                  </div>
                </>
              )}
            </ChartCard>
            <ChartCard title="Mentors par association" className="lg:col-span-2">
              {assocData.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucune association</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={assocData} layout="vertical" margin={{ left: 16, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="mentors" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
            <ChartCard title="Offre vs Demande (actuel)" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={capaciteData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    <Cell fill="#10b981" />
                    <Cell fill={poleData.demandes_en_attente > poleData.capacite_restante ? '#ef4444' : '#f59e0b'} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        {/* ── Section 5 : Profil des jeunes ──────────────────────────── */}
        <div id="kpi-section-jeunes" className="space-y-3">
          <SectionTitle>Profil des jeunes — période {PERIOD_LABELS[period]}</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Tranches d'âge */}
            <ChartCard title="Tranches d'âge" className="lg:col-span-1">
              {!poleData.tranches_age || poleData.total_demandes === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
              ) : (
                <div className="space-y-2">
                  {([
                    ['< 18 ans',    poleData.tranches_age.moins_18,      '#a78bfa'],
                    ['18 – 25 ans', poleData.tranches_age.annees_18_25, '#3b82f6'],
                    ['26 – 29 ans', poleData.tranches_age.annees_26_29, '#10b981'],
                    ['> 29 ans',    poleData.tranches_age.plus_29,       '#ef4444'],
                    ...(poleData.tranches_age.inconnu > 0 ? [['Non renseigné', poleData.tranches_age.inconnu, '#cbd5e1']] : []),
                  ] as [string, number, string][]).map(([lbl, val, color]) => (
                    <div key={lbl} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">{lbl}</span>
                        <span className="font-medium text-slate-900">{val}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${poleData.total_demandes > 0 ? Math.round(val / poleData.total_demandes * 100) : 0}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            {/* Diplôme préparé */}
            <ChartCard title="Diplôme préparé" className="lg:col-span-1">
              {!poleData.par_diplome || poleData.par_diplome.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
              ) : (
                <div className="space-y-2">
                  {poleData.par_diplome.slice(0, 8).map(d => (
                    <div key={d.code} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">{d.label}</span>
                        <span className="font-medium text-slate-900">{d.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${poleData.total_demandes > 0 ? Math.round(d.count / poleData.total_demandes * 100) : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            {/* Situation */}
            <ChartCard title="Situation" className="lg:col-span-1">
              {(poleData.en_apprentissage ?? 0) + (poleData.en_recherche ?? 0) === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
              ) : (
                <>
                  <div className="space-y-3 mt-2">
                    {[
                      { label: 'Déjà en apprentissage', value: poleData.en_apprentissage ?? 0, color: '#10b981' },
                      { label: 'En recherche',           value: poleData.en_recherche     ?? 0, color: '#3b82f6' },
                    ].map(({ label, value, color }) => {
                      const total = (poleData.en_apprentissage ?? 0) + (poleData.en_recherche ?? 0);
                      const pct = total > 0 ? Math.round(value / total * 100) : 0;
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
                    Total renseigné : {(poleData.en_apprentissage ?? 0) + (poleData.en_recherche ?? 0)} / {poleData.total_demandes}
                  </p>
                </>
              )}
            </ChartCard>

          </div>
        </div>

        {/* ── Section 6 : APs & Urgences ─────────────────────────────── */}
        <div id="kpi-section-aps" className="space-y-3">
          <SectionTitle>Animateurs de Pôle & Urgences</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">APs mobilisés</h3>
              <div className="flex items-center gap-8">
                <GaugeRing value={poleData.aps_actifs} max={poleData.aps_total} color="#8b5cf6" label="APs avec mentorat actif" />
                <div className="space-y-2 flex-1">
                  {[
                    ['APs au total', poleData.aps_total, 'text-slate-900'],
                    ['APs actifs', poleData.aps_actifs, 'text-purple-700'],
                    ['Taux de mobilisation', poleData.aps_total > 0 ? `${Math.round(poleData.aps_actifs / poleData.aps_total * 100)}%` : '—', 'text-slate-900'],
                  ].map(([lbl, val, cls]) => (
                    <div key={String(lbl)} className="flex justify-between text-sm">
                      <span className="text-slate-600">{lbl}</span>
                      <span className={`font-semibold ${cls}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Top urgences non traitées
                {poleData.urgences_non_traitees > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    {poleData.urgences_non_traitees}
                  </span>
                )}
              </h3>
              {(poleData.urgences_details ?? []).length === 0 ? (
                <div className="flex flex-col items-center py-6 text-slate-400 gap-2">
                  <CheckCircle size={32} className="text-green-400" />
                  <p className="text-sm">Aucune urgence non traitée</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {poleData.urgences_details.map((u, i) => (
                    <div key={i} className="py-2 flex items-center gap-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        u.urgency_level >= 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>{u.urgency_level}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-slate-500">{u.city}</p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(u.request_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 6 : Comparaison nationale ──────────────────────── */}
        <div id="kpi-section-national" className="space-y-3">
          <SectionTitle>Comparaison nationale</SectionTitle>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Indicateur', 'Votre pôle', 'National', 'Écart'].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: '% filles',                  pole: poleData.filles_pct,    nat: nationalData.filles_pct,    unit: '%' },
                  { label: 'Taux de réussite',           pole: poleData.taux_reussite, nat: nationalData.taux_reussite, unit: '%' },
                  { label: 'Mentors disponibles / total',
                    pole: poleData.mentors_total > 0 ? Math.round(poleData.mentors_disponibles / poleData.mentors_total * 100) : 0,
                    nat:  nationalData.mentors_total > 0 ? Math.round(nationalData.mentors_dispo / nationalData.mentors_total * 100) : 0,
                    unit: '%' },
                ].map(row => {
                  const diff = row.pole - row.nat;
                  return (
                    <tr key={row.label}>
                      <td className="px-6 py-3 text-slate-800">{row.label}</td>
                      <td className="px-6 py-3 text-right font-semibold text-slate-900">{row.pole.toFixed(1)}{row.unit}</td>
                      <td className="px-6 py-3 text-right text-slate-500">{row.nat.toFixed(1)}{row.unit}</td>
                      <td className={`px-6 py-3 text-right font-semibold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(1)}{row.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
