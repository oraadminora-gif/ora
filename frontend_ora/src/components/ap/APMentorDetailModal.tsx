// src/components/ap/APMentorDetailModal.tsx
import { useState, useEffect } from 'react';
import {
  X, Loader2, AlertTriangle, CheckCircle, Clock, Calendar,
  Phone, Mail, MapPin, History, StickyNote, Save,
  ChevronDown, ChevronUp, ClipboardList, Lock, Users,
} from 'lucide-react';
import api from '../../services/api';
import type {
  APMentorDetail, APMentoratActif, APMentorHistorique, APSuiviStats
} from '../../pages/member/ap/APDashboard.types';
import {
  APSuiviPanel,
  APMentoratSuiviModal,
  CloturerDirectModal,
} from '../shared/MentoratAPWidgets';

interface ApiError { response?: { data?: { error?: string } } }

interface Props {
  mentorId: number;
  onClose: () => void;
  onAlertChanged: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

// ── Badge inactivité ───────────────────────────────────────────────────────────
function InactiviteBadge({ jours, level }: { jours: number | null; level: string }) {
  if (level === 'ok' || jours === null) return null;

  const cfg =
    level === 'alert'
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-orange-100 text-orange-700 border-orange-200';
  const label = level === 'alert' ? `${jours}j sans contact ⚠️` : `${jours}j sans contact`;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${cfg}`}>
      <Clock className="w-2.5 h-2.5" /> {label}
    </span>
  );
}

// ── Stats suivis ───────────────────────────────────────────────────────────────
function SuiviStatsMini({ stats }: { stats: APSuiviStats }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ora-blue bg-ora-blue/8 border border-ora-blue/15 px-2 py-1 rounded-full">
        <Calendar className="w-2.5 h-2.5" />
        {stats.nb_rencontres} rencontre{stats.nb_rencontres !== 1 ? 's' : ''}
      </span>
      {stats.total_minutes > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
          <Clock className="w-2.5 h-2.5" />
          {formatDuree(stats.total_minutes)} total
        </span>
      )}
    </div>
  );
}

// ── Carte mentorat actif (vue AP, avec gestion suivis) ─────────────────────────
function MentoratActifRow({
  mentorat,
  onAlertToggle,
  onNotesOpen,
  onClotureDone,
}: {
  mentorat: APMentoratActif;
  onAlertToggle: (m: APMentoratActif) => void;
  onNotesOpen: (m: APMentoratActif) => void;
  onClotureDone: () => void;
}) {
  const { jeune, inactivite, alerte_rouge, suivi_stats } = mentorat;
  const [showSuivis, setShowSuivis]           = useState(false);
  const [showSuiviModal, setShowSuiviModal]   = useState(false);
  const [showCloture, setShowCloture]         = useState(false);

  const borderClass = alerte_rouge
    ? 'border-red-200 bg-red-50/30'
    : inactivite.level === 'warn'
    ? 'border-orange-100 bg-orange-50/10'
    : 'border-slate-100 bg-white';

  return (
    <div className={`rounded-xl border px-4 py-3 space-y-2 transition-all ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-800">{jeune?.name ?? '—'}</p>
            {alerte_rouge && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <AlertTriangle className="w-2.5 h-2.5" /> Alerte
              </span>
            )}
            <InactiviteBadge jours={inactivite.jours} level={inactivite.level} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
            {jeune?.city && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{jeune.city}</span>}
            {mentorat.date_debut && <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />Depuis {formatDate(mentorat.date_debut)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onNotesOpen(mentorat)}
            title="Notes de suivi"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <StickyNote className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onAlertToggle(mentorat)}
            title={alerte_rouge ? "Résoudre l'alerte" : 'Signaler une alerte'}
            className={`p-1.5 rounded-lg transition-colors ${alerte_rouge ? 'hover:bg-red-100' : 'hover:bg-orange-50'}`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${alerte_rouge ? 'text-red-500' : 'text-slate-300 hover:text-orange-400'}`} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <SuiviStatsMini stats={suivi_stats} />
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowSuiviModal(true)}
            className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 hover:text-violet-800 transition-colors">
            <ClipboardList className="w-3 h-3" /> Modifier le suivi
          </button>
          <button
            onClick={() => setShowSuivis(v => !v)}
            className="flex items-center gap-1 text-[10px] font-semibold text-ora-blue hover:text-ora-dark transition-colors"
          >
            {showSuivis ? <><ChevronUp className="w-3 h-3" /> Masquer</> : <><ChevronDown className="w-3 h-3" /> Rencontres</>}
          </button>
          <button
            onClick={() => setShowCloture(true)}
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
            title="Clôturer ou arrêter ce mentorat"
          >
            <Lock className="w-3 h-3" /> Clôturer
          </button>
        </div>
      </div>
      {showSuivis && (
        <div className="border-t border-slate-100 pt-2">
          <APSuiviPanel mentoratId={mentorat.id} />
        </div>
      )}
      {showSuiviModal && (
        <APMentoratSuiviModal
          mentoratId={mentorat.id}
          jeuneName={jeune?.name ?? '—'}
          onClose={() => setShowSuiviModal(false)}
        />
      )}
      {showCloture && (
        <CloturerDirectModal
          id={mentorat.id}
          jeuneName={jeune?.name ?? '—'}
          onClose={() => setShowCloture(false)}
          onDone={() => { setShowCloture(false); onClotureDone(); }}
        />
      )}
    </div>
  );
}

// ── Modal notes ────────────────────────────────────────────────────────────────
function NotesModal({
  mentoratId,
  initialNotes,
  jeuneName,
  onSaved,
  onClose,
}: {
  mentoratId: number;
  initialNotes: string;
  jeuneName: string;
  onSaved: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      await api.patch(`/ap/mentorats/${mentoratId}/notes/`, { notes_suivi: notes });
      onSaved(notes);
    } catch (err) {
      setError((err as ApiError).response?.data?.error ?? 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-ora-blue" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Notes de suivi AP</h4>
              <p className="text-[10px] text-slate-400">Mentorat de {jeuneName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={6}
            placeholder="Observations, points à surveiller, décisions prises..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue resize-none transition-all"
          />
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-ora-blue hover:bg-ora-dark text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-ora-blue/20">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal alerte ───────────────────────────────────────────────────────────────
function AlerteModal({
  mentorat,
  onConfirm,
  onClose,
}: {
  mentorat: APMentoratActif;
  onConfirm: (action: 'signaler' | 'resoudre', note: string) => Promise<void>;
  onClose: () => void;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const action: 'signaler' | 'resoudre' = mentorat.alerte_rouge ? 'resoudre' : 'signaler';

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(action, note);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className={`px-5 py-4 border-b rounded-t-2xl ${action === 'signaler' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {action === 'signaler'
                ? <AlertTriangle className="w-5 h-5 text-red-600" />
                : <CheckCircle className="w-5 h-5 text-emerald-600" />}
              <h4 className={`text-sm font-bold ${action === 'signaler' ? 'text-red-800' : 'text-emerald-800'}`}>
                {action === 'signaler' ? 'Signaler une alerte' : 'Résoudre l\'alerte'}
              </h4>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mentorat de <strong>{mentorat.jeune?.name ?? '—'}</strong>
          </p>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Note <span className="font-normal text-slate-300">(optionnelle)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder={action === 'signaler' ? 'Ex: Le mentor n\'a pas répondu depuis 5 semaines...' : 'Ex: Situation résolue, contact rétabli...'}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue resize-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              Annuler
            </button>
            <button onClick={handleConfirm} disabled={saving}
              className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                action === 'signaler' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {action === 'signaler' ? 'Confirmer l\'alerte' : 'Marquer comme résolu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MODAL PRINCIPALE ───────────────────────────────────────────────────────────
export function APMentorDetailModal({ mentorId, onClose, onAlertChanged }: Props) {
  const [detail, setDetail] = useState<APMentorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'mentorats' | 'historique'>('mentorats');
  const [alerteMentorat, setAlerteMentorat] = useState<APMentoratActif | null>(null);
  const [notesMentorat, setNotesMentorat] = useState<APMentoratActif | null>(null);

  useEffect(() => { fetchDetail(); }, [mentorId]);

  const fetchDetail = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get<APMentorDetail>(`/ap/mentors/${mentorId}/`);
      setDetail(res.data);
    } catch { setError('Impossible de charger le détail.'); }
    finally { setLoading(false); }
  };

  const handleAlertConfirm = async (action: 'signaler' | 'resoudre', note: string) => {
    if (!alerteMentorat) return;
    try {
      await api.post(`/ap/mentorats/${alerteMentorat.id}/alerte/`, { action, note });
      setAlerteMentorat(null);
      onAlertChanged();
      fetchDetail();
    } catch { /* affiche erreur si besoin */ }
  };

  const handleNotesSaved = () => { setNotesMentorat(null); };

  if (!detail && loading) return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );

  const mentor = detail?.mentor;
  if (!mentor) return null;

  const initials = `${mentor.first_name.charAt(0)}${mentor.last_name.charAt(0)}`.toUpperCase();
  const inactivite = mentor.derniere_activite;

  const tabs = [
    { key: 'mentorats', label: 'Mentorats actifs', icon: Users, count: mentor.nb_mentorats_actifs },
    { key: 'historique', label: 'Historique', icon: History, count: mentor.nb_mentorats_termines },
  ] as const;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

          {/* ── Header mentor ─────────────────────────────────────── */}
          <div className={`px-6 py-5 border-b ${
            inactivite.level === 'alert' ? 'bg-red-50/50 border-red-100' :
            inactivite.level === 'warn'  ? 'bg-orange-50/30 border-orange-100' :
            'bg-slate-50/60 border-slate-100'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm shrink-0 ${
                  inactivite.level === 'alert' ? 'bg-red-500 shadow-red-200' :
                  inactivite.level === 'warn'  ? 'bg-orange-500 shadow-orange-200' :
                  'bg-ora-blue shadow-ora-blue/20'
                }`}>
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">
                      {mentor.first_name} {mentor.last_name}
                    </h3>
                    {mentor.is_trained && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-2.5 h-2.5" /> Formé
                      </span>
                    )}
                    <InactiviteBadge jours={inactivite.jours} level={inactivite.level} />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {[
                      { icon: Mail,  v: mentor.email },
                      { icon: Phone, v: mentor.phone || '—' },
                      { icon: MapPin,v: mentor.city  || '—' },
                    ].map(({ icon: Icon, v }) => (
                      <span key={v} className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Icon className="w-2.5 h-2.5" /> {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Capacité */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Max',        value: mentor.capacite.max,        color: 'text-slate-700' },
                { label: 'Utilisés',   value: mentor.capacite.utilisee,   color: 'text-ora-blue' },
                { label: 'Disponible', value: mentor.capacite.disponible, color: mentor.capacite.disponible > 0 ? 'text-emerald-600' : 'text-red-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-100 px-3 py-2 text-center">
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Barre capacité */}
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-ora-blue rounded-full transition-all"
                style={{ width: `${mentor.capacite.max > 0 ? (mentor.capacite.utilisee / mentor.capacite.max) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────── */}
          <div className="flex border-b border-slate-100 bg-white">
            {tabs.map(({ key, label, icon: Icon, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2 ${
                  tab === key ? 'text-ora-blue border-ora-blue bg-ora-blue/3' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  tab === key ? 'bg-ora-blue text-white' : 'bg-slate-100 text-slate-400'
                }`}>{count}</span>
              </button>
            ))}
          </div>

          {/* ── Contenu ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl px-4 py-3">{error}</div>
            )}

            {tab === 'mentorats' && (
              <>
                {mentor.mentorats_actifs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Aucun mentorat actif</p>
                  </div>
                ) : (
                  mentor.mentorats_actifs.map(m => (
                    <MentoratActifRow
                      key={m.id}
                      mentorat={m}
                      onAlertToggle={setAlerteMentorat}
                      onNotesOpen={setNotesMentorat}
                      onClotureDone={fetchDetail}
                    />
                  ))
                )}
              </>
            )}

            {tab === 'historique' && (
              <>
                {(!detail?.historique || detail.historique.length === 0) ? (
                  <div className="text-center py-10 text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Aucun mentorat terminé</p>
                  </div>
                ) : (
                  detail.historique.map((h: APMentorHistorique) => (
                    <div key={h.id} className="flex items-start gap-3 border border-slate-100 rounded-xl px-4 py-3 bg-white">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        h.statut_final === 'CLOSED' ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        {h.statut_final === 'CLOSED'
                          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          : <X className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{h.jeune}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className={`text-[10px] font-bold ${h.statut_final === 'CLOSED' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {h.statut_final === 'CLOSED' ? 'Clôturé' : 'Abandonné'}
                          </span>
                          {h.date_fin && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />{new Date(h.date_fin).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                        <SuiviStatsMini stats={h.suivi_stats} />
                        {h.closure_reason && (
                          <p className="text-[10px] text-slate-400 mt-1 italic truncate">"{h.closure_reason}"</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sous-modals */}
      {alerteMentorat && (
        <AlerteModal
          mentorat={alerteMentorat}
          onConfirm={handleAlertConfirm}
          onClose={() => setAlerteMentorat(null)}
        />
      )}

      {notesMentorat && (
        <NotesModal
          mentoratId={notesMentorat.id}
          initialNotes={''}
          jeuneName={notesMentorat.jeune?.name ?? '—'}
          onSaved={handleNotesSaved}
          onClose={() => setNotesMentorat(null)}
        />
      )}
    </>
  );
}
