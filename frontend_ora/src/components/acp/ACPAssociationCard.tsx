// src/components/acp/ACPAssociationCard.tsx
import { UserCheck, UserX } from 'lucide-react';
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

  return (
    <div className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-white transition-all hover:shadow-md">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center gap-3 bg-slate-50/60">
        <span className="text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shrink-0 bg-ora-blue/10 text-ora-blue">
          {association.code}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{association.name}</p>
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
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 divide-x divide-slate-100">
        <StatPill
          value={stats.total_mentors}
          label="Mentors"
          color="text-ora-blue"
        />
        <div className="pl-2">
          <StatPill
            value={stats.capacite_dispo}
            label="Capacité dispo"
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
      </div>
    </div>
  );
}
