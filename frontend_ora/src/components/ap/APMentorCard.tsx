// src/components/ap/APMentorCard.tsx
import { AlertTriangle, Clock, Users, ChevronRight, CheckCircle } from 'lucide-react';
import type { APMentor } from '../../pages/member/ap/APDashboard.types';

interface Props {
  mentor: APMentor;
  onClick: () => void;
}

function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

// ── Barre de capacité ──────────────────────────────────────────────────────────
function CapaciteBar({ capacite }: { capacite: APMentor['capacite'] }) {
  const pct = capacite.max > 0 ? (capacite.utilisee / capacite.max) * 100 : 0;
  const barColor = pct >= 100 ? 'bg-red-400' : pct >= 60 ? 'bg-orange-400' : 'bg-ora-blue';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">Capacité</span>
        <span className="text-[10px] font-bold text-slate-600">
          {capacite.utilisee}/{capacite.max}
        </span>
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold ${capacite.disponible > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {capacite.disponible > 0 ? `${capacite.disponible} place${capacite.disponible > 1 ? 's' : ''} libre${capacite.disponible > 1 ? 's' : ''}` : 'Complet'}
        </span>
        <span className="text-[10px] text-slate-400">{Math.round(pct)}% utilisé</span>
      </div>
    </div>
  );
}

// ── Badge inactivité ───────────────────────────────────────────────────────────
function AlertBadge({ level, jours }: { level: string; jours: number | null }) {
  if (level === 'ok') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
      <CheckCircle className="w-2.5 h-2.5" /> Actif
    </span>
  );

  if (level === 'alert') return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-1 rounded-full animate-pulse">
      <AlertTriangle className="w-2.5 h-2.5" />
      {jours}j sans contact
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100 border border-orange-200 px-2 py-1 rounded-full">
      <Clock className="w-2.5 h-2.5" />
      {jours}j sans contact
    </span>
  );
}

// ── Carte principale ───────────────────────────────────────────────────────────
export function APMentorCard({ mentor, onClick }: Props) {
  const { derniere_activite: da } = mentor;

  // Bordure selon niveau d'alerte
  const cardStyle =
    da.level === 'alert' ? 'border-red-200 shadow-red-50 hover:shadow-red-100' :
    da.level === 'warn'  ? 'border-orange-200 shadow-orange-50 hover:shadow-orange-100' :
    'border-slate-100 hover:border-slate-200';

  const headerBg =
    da.level === 'alert' ? 'bg-red-50/60' :
    da.level === 'warn'  ? 'bg-orange-50/40' :
    'bg-slate-50/60';

  const avatarBg =
    da.level === 'alert' ? 'bg-red-500 shadow-red-200' :
    da.level === 'warn'  ? 'bg-orange-500 shadow-orange-200' :
    'bg-ora-blue shadow-ora-blue/20';

  const initials = `${mentor.first_name.charAt(0)}${mentor.last_name.charAt(0)}`.toUpperCase();

  // Total minutes tous mentorats actifs
  const totalMinutes = mentor.mentorats_actifs.reduce(
    (acc, m) => acc + m.suivi_stats.total_minutes, 0
  );

  // Nombre d'alertes actives sur les mentorats
  const nbAlertes = mentor.mentorats_actifs.filter(m => m.alerte_rouge).length;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer ${cardStyle}`}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className={`px-4 py-3.5 flex items-center gap-3 ${headerBg}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0 ${avatarBg}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900 truncate">
              {mentor.first_name} {mentor.last_name}
            </p>
            {mentor.is_trained && (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">
                Formé
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <AlertBadge level={da.level} jours={da.jours} />
            {nbAlertes > 0 && (
              <span className="text-[9px] font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-full">
                {nbAlertes} alerte{nbAlertes > 1 ? 's' : ''} rouge{nbAlertes > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-white space-y-3">
        {/* Mentorats actifs mini-liste */}
        {mentor.mentorats_actifs.length > 0 ? (
          <div className="space-y-1.5">
            {mentor.mentorats_actifs.slice(0, 2).map(m => (
              <div key={m.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] ${
                m.alerte_rouge
                  ? 'bg-red-50 border-red-100'
                  : m.inactivite.level !== 'ok'
                  ? 'bg-orange-50 border-orange-100'
                  : 'bg-slate-50 border-slate-100'
              }`}>
                <Users className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-700 truncate flex-1">
                  {m.jeune?.name ?? '—'}
                </span>
                <span className="text-slate-400 shrink-0">
                  {m.suivi_stats.nb_rencontres} rencontre{m.suivi_stats.nb_rencontres !== 1 ? 's' : ''}
                </span>
                {m.alerte_rouge && (
                  <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                )}
              </div>
            ))}
            {mentor.mentorats_actifs.length > 2 && (
              <p className="text-[10px] text-slate-400 text-right px-1">
                +{mentor.mentorats_actifs.length - 2} autre{mentor.mentorats_actifs.length - 2 > 1 ? 's' : ''}...
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
            <Users className="w-3 h-3 text-slate-300" />
            <span className="text-[11px] text-slate-400">Aucun mentorat actif</span>
          </div>
        )}

        {/* Capacité */}
        <CapaciteBar capacite={mentor.capacite} />

        {/* Stats globales */}
        {totalMinutes > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 border-t border-slate-50 pt-2">
            <Clock className="w-2.5 h-2.5" />
            <span>{formatDuree(totalMinutes)} d'accompagnement total</span>
            <span className="mx-1">·</span>
            <span>{mentor.nb_mentorats_termines} terminé{mentor.nb_mentorats_termines > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </button>
  );
}
