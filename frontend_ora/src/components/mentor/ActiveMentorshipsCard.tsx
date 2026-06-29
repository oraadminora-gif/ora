// src/components/mentor/ActiveMentorshipsCard.tsx
import { useState } from 'react';
import {
  Users, Calendar, Clock, AlertTriangle, StickyNote,
  ChevronRight, CheckCircle, UserCheck,
} from 'lucide-react';
import type { MentoratActif } from '../../pages/member/mentor/MentorDashboard';
import { MentorSuiviModal } from './MentorSuiviModal';

interface Props { mentorats: MentoratActif[]; mentorName: string; onClosed: () => void }

function MentoratCard({ mentorat, onSuivi }: { mentorat: MentoratActif; onSuivi: () => void }) {
  const j = mentorat.jeune;
  const stats = mentorat.suivi_stats;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md ${
      mentorat.alerte_rouge ? 'border-red-200 shadow-sm shadow-red-100' : 'border-slate-100 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between ${mentorat.alerte_rouge ? 'bg-red-50/50' : 'bg-slate-50/60'}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-ora-blue flex items-center justify-center text-white font-black text-base shadow-sm shadow-ora-blue/20 shrink-0">
            {j.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{j.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{j.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mentorat.alerte_rouge && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 border border-red-200 px-2 py-1 rounded-full uppercase tracking-wider">
              <AlertTriangle className="w-2.5 h-2.5" /> Alerte
            </span>
          )}
          {mentorat.cloture_en_attente ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full uppercase tracking-wider">
              <Clock className="w-2.5 h-2.5" /> En attente
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full uppercase tracking-wider">Actif</span>
          )}
        </div>
      </div>

      {/* Notes AP */}
      {mentorat.notes_suivi && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3">
          <StickyNote className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Message de votre AP</p>
            <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-wrap">{mentorat.notes_suivi}</p>
          </div>
        </div>
      )}

      {/* Infos résumé */}
      <div className="px-5 py-4 grid grid-cols-2 gap-2">
        {mentorat.date_debut && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Calendar className="w-3 h-3 text-slate-300 shrink-0" />
            <span className="text-xs font-medium text-slate-600">
              {new Date(mentorat.date_debut).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}
        {stats.nb_rencontres > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Clock className="w-3 h-3 text-slate-300 shrink-0" />
            <span className="text-xs font-medium text-slate-600">
              {stats.nb_rencontres} rencontre{stats.nb_rencontres > 1 ? 's' : ''} · {stats.total_heures}h
            </span>
          </div>
        )}
        <div className="col-span-2 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <UserCheck className="w-3 h-3 text-slate-300 shrink-0" />
          <span className="text-xs text-slate-500">AP référent :</span>
          <span className="text-xs font-semibold text-slate-700">{mentorat.ap_referent}</span>
        </div>
        {j.situation_label && (
          <div className="col-span-2 flex items-center gap-2 px-3 py-2 bg-ora-blue/3 rounded-xl border border-ora-blue/10">
            <CheckCircle className="w-3 h-3 text-ora-blue shrink-0" />
            <span className="text-xs font-semibold text-ora-blue">
              {j.situation_label}{j.nom_etablissement ? ` · ${j.nom_etablissement}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Bouton Suivi */}
      <div className="px-5 pb-5">
        <button onClick={onSuivi}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-ora-blue hover:bg-ora-dark text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-ora-blue/20">
          Ouvrir le suivi <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function ActiveMentorshipsCard({ mentorats, mentorName, onClosed }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);
  const openMentorat = openId !== null ? mentorats.find(m => m.id === openId) ?? null : null;

  return (
    <>
      <div id="mentorats-en-cours" className="scroll-mt-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-ora-blue/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-ora-blue" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mentorats en cours</h2>
              <p className="text-xs text-slate-400">{mentorats.length} actif{mentorats.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {mentorats.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Aucun mentorat en cours</p>
            <p className="text-xs text-slate-300 mt-1">Vos mentorats actifs apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {mentorats.map(m => (
              <MentoratCard key={m.id} mentorat={m} onSuivi={() => setOpenId(m.id)} />
            ))}
          </div>
        )}
      </div>

      {openMentorat && (
        <MentorSuiviModal
          mentorat={openMentorat}
          onClose={() => setOpenId(null)}
          onSaved={() => { onClosed(); }}
        />
      )}
    </>
  );
}
