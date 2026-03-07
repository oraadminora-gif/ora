// src/components/ap/APStatsBar.tsx
import { Users, AlertTriangle, Activity, UserCheck, TrendingUp, BookOpen } from 'lucide-react';
import type { APStats } from '../../pages/member/ap/APDashboard.types';

interface Props { stats: APStats }

export function APStatsBar({ stats }: Props) {
  const items = [
    {
      icon: Users,
      label: 'Mentors (asso.)',
      value: stats.total_mentors,
      sub: `${stats.mentors_disponibles} disponible${stats.mentors_disponibles > 1 ? 's' : ''}`,
      color: 'text-ora-blue',
      bg: 'bg-ora-blue/8',
      border: 'border-ora-blue/15',
    },
    {
      icon: BookOpen,
      label: 'Mes mentorats',
      value: stats.mes_mentorats_actifs,
      sub: `${stats.mes_mentorats_total} au total`,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
    {
      icon: Activity,
      label: 'Actifs (asso.)',
      value: stats.mentorats_actifs,
      sub: 'dans mon association',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      icon: AlertTriangle,
      label: 'Alertes rouges',
      value: stats.alertes_rouges,
      sub: 'à traiter',
      color: stats.alertes_rouges > 0 ? 'text-red-600' : 'text-slate-400',
      bg: stats.alertes_rouges > 0 ? 'bg-red-50' : 'bg-slate-50',
      border: stats.alertes_rouges > 0 ? 'border-red-100' : 'border-slate-100',
    },
    {
      icon: TrendingUp,
      label: 'Inactivité +30j',
      value: stats.mentors_inactifs,
      sub: 'mentor(s) sans contact',
      color: stats.mentors_inactifs > 0 ? 'text-orange-600' : 'text-slate-400',
      bg: stats.mentors_inactifs > 0 ? 'bg-orange-50' : 'bg-slate-50',
      border: stats.mentors_inactifs > 0 ? 'border-orange-100' : 'border-slate-100',
    },
    {
      icon: UserCheck,
      label: 'Dispo.',
      value: stats.mentors_disponibles,
      sub: `sur ${stats.total_mentors} mentor${stats.total_mentors > 1 ? 's' : ''}`,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map(({ icon: Icon, label, value, sub, color, bg, border }) => (
        <div
          key={label}
          className={`rounded-2xl border ${border} ${bg} px-4 py-4 flex flex-col gap-1 transition-all hover:shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${bg} border ${border}`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
          </div>
          <p className={`text-3xl font-black ${color} leading-none mt-1`}>{value}</p>
          <p className="text-[10px] text-slate-400">{sub}</p>
        </div>
      ))}
    </div>
  );
}
