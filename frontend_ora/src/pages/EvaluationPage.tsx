// src/pages/EvaluationPage.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';
import api from '../services/api';

interface EvalInfo {
  already_submitted: boolean;
  mentor_name: string;
  jeune_name: string;
  pole_code: string;
  date_fin: string | null;
  date_demande: string | null;
  rating_objectifs: number | null;
  rating_accompagnement: number | null;
  rating_recommandation: number | null;
  comment: string;
  submitted_at: string | null;
}

const QUESTIONS = [
  { key: 'rating_objectifs',      label: 'Tes objectifs personnels ont-ils été atteints ?' },
  { key: 'rating_accompagnement', label: "As-tu apprécié la qualité de l'accompagnement par le Mentor ?" },
  { key: 'rating_recommandation', label: 'Recommanderais-tu ORA à un copain ?' },
] as const;

const STAR_LABELS: Record<number, string> = {
  1: 'Insuffisant',
  2: 'Passable',
  3: 'Satisfaisant',
  4: 'Bien',
  5: 'Excellent',
};

function StarPicker({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          onClick={() => !disabled && onChange(n)}
          onMouseEnter={() => !disabled && setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          disabled={disabled}
          className="focus:outline-none transition-transform hover:scale-110 disabled:cursor-default"
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
        >
          <Star className={`w-8 h-8 transition-colors ${n <= display ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }: { value: number | null }) {
  if (!value) return <span className="text-slate-400 text-sm">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`w-5 h-5 ${i < value ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
        ))}
      </div>
      <span className="text-sm font-semibold text-slate-600">{STAR_LABELS[value]}</span>
    </div>
  );
}

export function EvaluationPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<EvalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ratings, setRatings] = useState<Record<string, number>>({
    rating_objectifs: 0,
    rating_accompagnement: 0,
    rating_recommandation: 0,
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.get<EvalInfo>(`/public/evaluation/${token}/`)
      .then(res => {
        setInfo(res.data);
        if (res.data.already_submitted) {
          setRatings({
            rating_objectifs:      res.data.rating_objectifs      ?? 0,
            rating_accompagnement: res.data.rating_accompagnement ?? 0,
            rating_recommandation: res.data.rating_recommandation ?? 0,
          });
          setComment(res.data.comment);
          setSubmitted(true);
        }
      })
      .catch(() => setError('Lien invalide ou expiré.'))
      .finally(() => setLoading(false));
  }, [token]);

  const allRated = QUESTIONS.every(q => (ratings[q.key] ?? 0) > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRated) { setSubmitError('Veuillez répondre aux 3 questions.'); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      await api.post(`/public/evaluation/${token}/`, { ...ratings, comment });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSubmitError(msg ?? 'Une erreur est survenue. Veuillez réessayer.');
    } finally { setSubmitting(false); }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-ora-blue" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">Lien invalide</h1>
        <p className="text-slate-500">{error}</p>
      </div>
    </div>
  );

  if (!info) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ora-blue/5 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-ora-blue px-8 py-7 text-white">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">
            ORA {info.pole_code} — Programme de mentorat
          </p>
          <h1 className="text-2xl font-black">Ton avis nous intéresse !</h1>
          <p className="text-sm text-white/70 mt-1">
            Mentorat avec <span className="font-semibold text-white">{info.mentor_name}</span>
            {info.date_fin && <> · clôturé le {formatDate(info.date_fin)}</>}
          </p>
        </div>

        <div className="px-8 py-8">
          {submitted ? (
            /* ── Merci ─────────────────────────────────────────── */
            <div className="space-y-5">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Merci pour ton évaluation !</h2>
                <p className="text-sm text-slate-400">Ton avis nous aide à améliorer notre programme pour les prochains jeunes.</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                {QUESTIONS.map(q => (
                  <div key={q.key}>
                    <p className="text-xs font-bold text-slate-400 mb-1">{q.label}</p>
                    <StarDisplay value={ratings[q.key] ?? null} />
                  </div>
                ))}
                {comment && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-1">Commentaire</p>
                    <p className="text-sm text-slate-600 italic">"{comment}"</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Formulaire ──────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Bonjour <span className="font-semibold text-slate-800">{info.jeune_name}</span>,
                {info.date_demande && (
                  <> tu nous avais adressé ta demande le <span className="font-semibold">{formatDate(info.date_demande)}</span>.</>
                )}
                <br /><br />
                Nous espérons que ton projet a pu se réaliser. Prends un instant pour nous donner ton avis en répondant à ces 3 questions.
              </p>

              {QUESTIONS.map((q, i) => (
                <div key={q.key} className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    {i + 1}. {q.label}
                  </label>
                  <StarPicker
                    value={ratings[q.key] ?? 0}
                    onChange={n => setRatings(prev => ({ ...prev, [q.key]: n }))}
                  />
                  {(ratings[q.key] ?? 0) > 0 && (
                    <p className="text-xs font-semibold text-amber-600">{STAR_LABELS[ratings[q.key]]}</p>
                  )}
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Commentaire libre <span className="font-normal normal-case text-slate-300">(optionnel)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  placeholder="Ce qui t'a le plus aidé, ce que tu retiens de l'expérience…"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue resize-none transition-all"
                />
              </div>

              {submitError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !allRated}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-ora-blue hover:bg-ora-dark text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-ora-blue/20"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
                  : <><Send className="w-4 h-4" /> Envoyer mon évaluation</>
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
