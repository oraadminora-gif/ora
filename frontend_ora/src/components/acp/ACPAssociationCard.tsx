// src/components/acp/ACPAssociationCard.tsx
import { AlertTriangle, Users, Activity, UserCheck, UserX } from 'lucide-react';
import type { ACPAssociation } from '../../pages/member/acp/ACPDashboard.types';

interface Props {
  association: ACPAssociation;
}

function StatPill({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-lg font-black leading-none ${color}`}>{value}</span>
      <span className="text-[9px] text-slate-400 uppercase tracking-wide leading-tight text-center">{label}</span>
    </div>
  );
}

export function ACPAssociationCard({ association }: Props) {
  const { stats, ap } = association;

  const hasAlert = stats.alertes_rouges > 0;
  const hasWarn  = stats.mentors_inactifs > 0;

  const cardBorder =
    hasAlert ? 'border-red-200' :
    hasWarn  ? 'border-orange-200' :
    'border-slate-100';

  const headerBg =
    hasAlert ? 'bg-red-50/70' :
    hasWarn  ? 'bg-orange-50/50' :
    'bg-slate-50/60';

  const codeBg =
    hasAlert ? 'bg-red-100 text-red-700' :
    hasWarn  ? 'bg-orange-100 text-orange-700' :
    'bg-ora-blue/10 text-ora-blue';

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden bg-white transition-all hover:shadow-md ${cardBorder}`}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className={`px-4 py-3 flex items-center gap-3 ${headerBg}`}>
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shrink-0 ${codeBg}`}>
          {association.code}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{association.name}</p>
          {/* AP attitré */}
          {ap ? (
            <div className="flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="text-[11px] text-slate-500 truncate">
                AP : {ap.first_name} {ap.last_name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-0.5">
              <UserX className="w-3 h-3 text-orange-400 shrink-0" />
              <span className="text-[11px] text-orange-500 font-semibold">Sans AP assigné</span>
            </div>
          )}
        </div>
        {/* Badge alerte */}
        {hasAlert && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 border border-red-200 text-[10px] font-bold text-red-700 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            {stats.alertes_rouges}
          </span>
        )}
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div className="px-4 py-3 grid grid-cols-4 gap-2 divide-x divide-slate-100">
        <StatPill
          value={stats.total_mentors}
          label="Mentors"
          color="text-ora-blue"
        />
        <div className="pl-2">
          <StatPill
            value={stats.mentors_disponibles}
            label="Dispo."
            color="text-emerald-600"
          />
        </div>
        <div className="pl-2">
          <StatPill
            value={stats.mentorats_actifs}
            label="Mentorats"
            color="text-violet-600"
          />
        </div>
        <div className="pl-2">
          <StatPill
            value={stats.mentors_inactifs}
            label="Inactifs"
            color={stats.mentors_inactifs > 0 ? 'text-orange-500' : 'text-slate-300'}
          />
        </div>
      </div>

      {/* ── Barre de remplissage capacité ───────────────────────── */}
      {stats.total_mentors > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">Capacité utilisée</span>
            <span className="text-[9px] font-bold text-slate-500">
              {stats.mentorats_actifs}/{stats.total_mentors} mentors en activité
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-ora-blue rounded-full transition-all"
              style={{
                width: `${Math.min(100, (stats.mentorats_actifs / Math.max(stats.total_mentors, 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
