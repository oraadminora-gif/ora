// src/components/mentor/MentorshipHistoryCard.tsx
import { History, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, Mail, Award, AlertTriangle, Star } from 'lucide-react';
import { useState } from 'react';
import type { MentoratHistorique } from '../../pages/member/mentor/MentorDashboard';

interface Props { mentorats: MentoratHistorique[] }

function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </span>
  );
}

function HistoriqueRow({ m }: { m: MentoratHistorique }) {
  const [open, setOpen] = useState(false);
  const isSuccess = m.statut_final === 'CLOSED';
  const hasBilan = !!m.message_cloture || !!m.evaluation;

  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${
      isSuccess ? 'border-slate-100' : 'border-red-100/60'
    }`}>
      {/* Ligne principale */}
      <div
        className={`flex items-center gap-4 px-4 py-3 ${hasBilan ? 'cursor-pointer hover:bg-slate-50/80' : ''} ${
          isSuccess ? 'bg-slate-50/80' : 'bg-red-50/30'
        }`}
        onClick={() => hasBilan && setOpen(v => !v)}
      >
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
          isSuccess ? 'bg-emerald-400' : 'bg-slate-300'
        }`}>
          {m.jeune.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{m.jeune}</p>
          <div className="flex items-center gap-3 mt-0.5">
            {m.closure_reason && (
              <p className="text-xs text-slate-400 italic truncate">{m.closure_reason}</p>
            )}
            {m.suivi_stats.nb_rencontres > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                <Clock className="w-2.5 h-2.5" />
                {m.suivi_stats.nb_rencontres} rencontre{m.suivi_stats.nb_rencontres > 1 ? 's' : ''} · {formatDuree(m.suivi_stats.total_minutes)}
              </span>
            )}
          </div>
        </div>

        {/* Meta droite */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end gap-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
            }`}>
              {isSuccess ? 'Succès' : 'Arrêté'}
            </span>
            {m.evaluation ? (
              <StarRating rating={m.evaluation.rating} />
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">
                {m.date_fin ? new Date(m.date_fin).toLocaleDateString('fr-FR') : '—'}
              </span>
            )}
          </div>
          {hasBilan && (
            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
              {open
                ? <ChevronUp className="w-3 h-3 text-slate-500" />
                : <ChevronDown className="w-3 h-3 text-slate-500" />}
            </div>
          )}
        </div>
      </div>

      {/* Bilan dépliable */}
      {hasBilan && open && (
        <div className="border-t border-slate-100 p-4 bg-white space-y-3">
          {/* Message de clôture */}
          {m.message_cloture && (
            <div className={`rounded-2xl overflow-hidden shadow-sm ${
              isSuccess ? 'shadow-emerald-100' : 'shadow-slate-100'
            }`}>
              {/* En-tête */}
              <div className={`px-5 py-3 flex items-center justify-between ${
                isSuccess ? 'bg-emerald-500' : 'bg-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Message de clôture</span>
                </div>
                <span className="text-[10px] text-white/70 font-medium">
                  {m.date_fin ? new Date(m.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </span>
              </div>

              {/* Corps */}
              <div className="bg-white px-5 pt-4 pb-3 border-x border-slate-100">
                <p className="text-[10px] text-slate-400 mb-3">
                  À : <span className="font-semibold text-slate-600">{m.jeune}</span>
                </p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{m.message_cloture}</p>
              </div>

              {/* Pied */}
              <div className={`px-5 py-3 flex items-center gap-2 border border-t-0 rounded-b-2xl ${
                isSuccess ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
              }`}>
                {isSuccess ? (
                  <><Award className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-semibold text-emerald-600">Mentorat clôturé avec succès</span></>
                ) : (
                  <><AlertTriangle className="w-3.5 h-3.5 text-slate-400" /><span className="text-[10px] font-semibold text-slate-500">Mentorat interrompu</span></>
                )}
              </div>
            </div>
          )}

          {/* Évaluation du jeune */}
          {m.evaluation && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 overflow-hidden">
              <div className="px-5 py-3 bg-amber-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-white/80 fill-white/80" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Évaluation du jeune</span>
                </div>
                <StarRating rating={m.evaluation.rating} />
              </div>
              <div className="px-5 py-4 bg-white border-x border-b border-amber-200 rounded-b-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-black text-amber-500">{m.evaluation.rating}/5</span>
                  <StarRating rating={m.evaluation.rating} />
                </div>
                {m.evaluation.comment && (
                  <p className="text-sm text-slate-700 leading-relaxed italic whitespace-pre-wrap">"{m.evaluation.comment}"</p>
                )}
                <p className="text-[10px] text-slate-400 mt-2">
                  Soumis le {new Date(m.evaluation.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MentorshipHistoryCard({ mentorats }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (mentorats.length === 0) return null;

  const displayed = isExpanded ? mentorats : mentorats.slice(0, 3);
  const hasMore = mentorats.length > 3;

  const stats = {
    success: mentorats.filter(m => m.statut_final === 'CLOSED').length,
    aborted: mentorats.filter(m => m.statut_final === 'ABORTED').length,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(v => !v)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors text-left border-b border-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <History className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Historique des mentorats</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <CheckCircle className="w-2.5 h-2.5" /> {stats.success} succès
              </span>
              {stats.aborted > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400">
                  <XCircle className="w-2.5 h-2.5" /> {stats.aborted} arrêté{stats.aborted > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-medium hidden sm:block">
            {isExpanded ? 'Réduire' : `Voir les ${mentorats.length}`}
          </span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
            {isExpanded
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </div>
        </div>
      </button>

      {/* Liste */}
      <div className="px-6 py-4 space-y-2">
        {displayed.map(m => <HistoriqueRow key={m.id} m={m} />)}

        {hasMore && (
          <button
            onClick={() => setIsExpanded(v => !v)}
            className={`w-full py-2.5 text-xs font-semibold rounded-xl border transition-all ${
              isExpanded
                ? 'text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600'
                : 'text-ora-blue border-dashed border-ora-blue/30 hover:border-ora-blue hover:bg-ora-blue/3'
            }`}
          >
            {isExpanded
              ? 'Réduire la liste'
              : `Voir les ${mentorats.length - 3} autres mentorats`}
          </button>
        )}
      </div>
    </div>
  );
}
