// src/components/acp/ACPStatsBar.tsx
import {
  Building2, Users, Activity, AlertTriangle,
  TrendingUp, UserCheck, ClipboardList, Shield,
} from 'lucide-react';
import type { ACPStats } from '../../pages/member/acp/ACPDashboard.types';

interface Props { stats: ACPStats }

export function ACPStatsBar({ stats }: Props) {
  const items = [
    {
      icon: Building2,
      label: 'Associations',
      value: stats.total_associations,
      sub: `${stats.total_ap} AP actif${stats.total_ap > 1 ? 's' : ''}`,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
    {
      icon: Users,
      label: 'Mentors',
      value: stats.total_mentors,
      sub: `${stats.mentors_disponibles} disponible${stats.mentors_disponibles > 1 ? 's' : ''}`,
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
      sub: 'sans contact',
      color: stats.mentors_inactifs > 0 ? 'text-orange-600' : 'text-slate-400',
      bg: stats.mentors_inactifs > 0 ? 'bg-orange-50' : 'bg-slate-50',
      border: stats.mentors_inactifs > 0 ? 'border-orange-100' : 'border-slate-100',
    },
    {
      icon: UserCheck,
      label: 'Dispo.',
      value: stats.mentors_disponibles,
      sub: `sur ${stats.total_mentors} mentors`,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-100',
    },
    {
      icon: ClipboardList,
      label: 'Demandes',
      value: stats.demandes_en_attente,
      sub: 'en attente matching',
      color: stats.demandes_en_attente > 0 ? 'text-amber-600' : 'text-slate-400',
      bg: stats.demandes_en_attente > 0 ? 'bg-amber-50' : 'bg-slate-50',
      border: stats.demandes_en_attente > 0 ? 'border-amber-100' : 'border-slate-100',
    },
    {
      icon: Shield,
      label: 'Animateurs',
      value: stats.total_ap,
      sub: 'AP dans le pôle',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
      {items.map(({ icon: Icon, label, value, sub, color, bg, border }) => (
        <div
          key={label}
          className={`rounded-2xl border ${border} ${bg} px-3 py-3.5 flex flex-col gap-1 transition-all hover:shadow-sm`}
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
