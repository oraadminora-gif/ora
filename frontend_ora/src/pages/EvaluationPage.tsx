// src/pages/EvaluationPage.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';
import api from '../services/api';

interface EvalInfo {
  already_submitted: boolean;
  mentor_name: string;
  jeune_name: string;
  date_fin: string | null;
  rating: number | null;
  comment: string;
  submitted_at: string | null;
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none transition-transform hover:scale-110"
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
        >
          <Star
            className={`w-10 h-10 transition-colors ${
              n <= display ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: 'Insuffisant',
  2: 'Passable',
  3: 'Satisfaisant',
  4: 'Bien',
  5: 'Excellent',
};

export function EvaluationPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<EvalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.get<EvalInfo>(`/public/evaluation/${token}/`)
      .then(res => {
        setInfo(res.data);
        if (res.data.already_submitted && res.data.rating) {
          setRating(res.data.rating);
          setComment(res.data.comment);
          setSubmitted(true);
        }
      })
      .catch(() => setError('Lien invalide ou expiré.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setSubmitError('Veuillez attribuer une note.'); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      await api.post(`/public/evaluation/${token}/`, { rating, comment });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSubmitError(msg ?? 'Une erreur est survenue. Veuillez réessayer.');
    } finally { setSubmitting(false); }
  };

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
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">ORA — Programme de mentorat</p>
          <h1 className="text-2xl font-black">Évaluation de votre mentor</h1>
          <p className="text-sm text-white/70 mt-1">
            Mentorat avec <span className="font-semibold text-white">{info.mentor_name}</span>
            {info.date_fin && (
              <> · clôturé le {new Date(info.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
            )}
          </p>
        </div>

        <div className="px-8 py-8">
          {submitted ? (
            /* ── Merci ────────────────────────────────────────────────── */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Merci pour votre évaluation !</h2>
              <div className="flex items-center justify-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`w-7 h-7 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm font-semibold text-slate-600">{RATING_LABELS[rating]}</p>
              )}
              {comment && (
                <p className="text-sm text-slate-500 italic bg-slate-50 rounded-xl px-4 py-3">"{comment}"</p>
              )}
              <p className="text-sm text-slate-400">Votre avis nous aide à améliorer la qualité de notre programme.</p>
            </div>
          ) : (
            /* ── Formulaire ───────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <p className="text-sm text-slate-500 mb-6">
                  Bonjour <span className="font-semibold text-slate-700">{info.jeune_name}</span>,
                  votre mentorat avec <span className="font-semibold text-slate-700">{info.mentor_name}</span> est terminé.
                  Prenez un instant pour partager votre expérience.
                </p>

                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Votre note globale *
                </label>
                <StarPicker value={rating} onChange={setRating} />
                {rating > 0 && (
                  <p className="text-sm font-semibold text-amber-600 mt-2">{RATING_LABELS[rating]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Commentaire <span className="font-normal normal-case text-slate-300">(optionnel)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                  placeholder="Ce qui vous a le plus aidé, ce que vous retenez de l'expérience..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue resize-none transition-all"
                />
              </div>

              {submitError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || rating === 0}
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
