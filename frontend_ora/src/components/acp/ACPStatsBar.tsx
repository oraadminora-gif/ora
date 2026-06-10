// src/components/acp/ACPStatsBar.tsx
import { Users, Activity, UserCheck } from 'lucide-react';
import type { ACPStats } from '../../pages/member/acp/ACPDashboard.types';

interface Props { stats: ACPStats }

export function ACPStatsBar({ stats }: Props) {
  const items = [
    {
      icon: Users,
      label: 'Mentors',
      value: stats.total_mentors,
      sub: 'dans le pôle',
      color: 'text-ora-blue',
      bg: 'bg-ora-blue/8',
      border: 'border-ora-blue/15',
    },
    {
      icon: Activity,
      label: 'Mentorats actifs',
      value: stats.mentorats_actifs,
      sub: 'en cours',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      icon: UserCheck,
      label: 'Capacité dispo',
      value: stats.mentors_disponibles,
      sub: 'places disponibles au total',
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map(({ icon: Icon, label, value, sub, color, bg, border }) => (
        <div
          key={label}
          className={`rounded-2xl border ${border} ${bg} px-4 py-4 flex flex-col gap-1 transition-all hover:shadow-sm`}
        >
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${bg} border ${border}`}>
              <Icon className={`w-3 h-3 ${color}`} />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{label}</span>
          </div>
          <p className={`text-2xl font-black ${color} leading-none mt-1`}>{value}</p>
          <p className="text-[9px] text-slate-400 leading-tight">{sub}</p>
        </div>
      ))}
    </div>
  );
}
