import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface AcceptanceInfo {
  already_responded: boolean;
  statut: 'PENDING' | 'ACCEPTE' | 'REFUSE';
  mentor_name: string;
  jeune_name: string;
  pole_code: string;
  repondu_at: string | null;
}

export function AccepterMentorat() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const actionParam = searchParams.get('action'); // 'accept' | 'refuse' | null

  const [info, setInfo] = useState<AcceptanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [finalStatut, setFinalStatut] = useState<'ACCEPTE' | 'REFUSE' | null>(null);

  useEffect(() => {
    if (!token) return;
    api.get<AcceptanceInfo>(`/public/accepter-mentorat/${token}/`)
      .then(res => {
        setInfo(res.data);
        if (res.data.already_responded) {
          setDone(true);
          setFinalStatut(res.data.statut as 'ACCEPTE' | 'REFUSE');
        }
      })
      .catch(() => setError('Lien invalide ou expiré.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAction = async (action: 'accept' | 'refuse') => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; statut: string; already_responded?: boolean }>(
        `/public/accepter-mentorat/${token}/`,
        { action },
      );
      if (res.data.already_responded) {
        setFinalStatut(res.data.statut as 'ACCEPTE' | 'REFUSE');
      } else {
        setFinalStatut(action === 'accept' ? 'ACCEPTE' : 'REFUSE');
      }
      setDone(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
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
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">
            ORA {info.pole_code} — Programme de mentorat
          </p>
          <h1 className="text-2xl font-black">Affectation d'un nouveau mentorat</h1>
          <p className="text-sm text-white/70 mt-1">
            Mentorat avec <span className="font-semibold text-white">{info.jeune_name}</span>
          </p>
        </div>

        <div className="px-8 py-8">
          {done ? (
            /* ── Confirmation ─────────────────────────────────── */
            finalStatut === 'ACCEPTE' ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Merci d'avoir accepté !</h2>
                <p className="text-slate-600">
                  Votre acceptation a bien été enregistrée. Votre Animateur de Pôle a été notifié.
                </p>
                <p className="text-sm text-slate-400">
                  Pensez à contacter rapidement{' '}
                  <span className="font-semibold text-slate-600">{info.jeune_name}</span>{' '}
                  par téléphone pour initier le mentorat.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Refus enregistré</h2>
                <p className="text-slate-600">
                  Votre refus a bien été enregistré. Votre Animateur de Pôle a été notifié et prendra les dispositions nécessaires.
                </p>
              </div>
            )
          ) : (
            /* ── Choix ────────────────────────────────────────── */
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-5 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jeune à accompagner</p>
                <p className="text-lg font-bold text-slate-800">{info.jeune_name}</p>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Bonjour <span className="font-semibold text-slate-800">{info.mentor_name}</span>,
                <br /><br />
                Vous venez de recevoir une affectation de mentorat. Ce message et votre réponse
                constituent votre contrat de mission dans le respect de la charte ORA.
                <br /><br />
                Merci de confirmer votre prise en charge en cliquant sur l'une des options ci-dessous :
              </p>

              {/* Pré-sélection depuis le lien email */}
              {actionParam && (
                <div className={`text-sm font-semibold rounded-xl px-4 py-3 border ${
                  actionParam === 'accept'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {actionParam === 'accept'
                    ? '→ Vous avez cliqué sur "J\'accepte". Confirmez votre choix ci-dessous.'
                    : '→ Vous avez cliqué sur "Je refuse". Confirmez votre choix ci-dessous.'}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAction('accept')}
                  disabled={submitting}
                  className="flex flex-col items-center gap-2 py-5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
                >
                  {submitting
                    ? <Loader2 className="w-6 h-6 animate-spin" />
                    : <CheckCircle className="w-6 h-6" />}
                  J'accepte ce mentorat
                </button>

                <button
                  onClick={() => handleAction('refuse')}
                  disabled={submitting}
                  className="flex flex-col items-center gap-2 py-5 px-4 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 border-2 border-red-200 hover:border-red-400 rounded-2xl font-bold text-sm transition-all"
                >
                  {submitting
                    ? <Loader2 className="w-6 h-6 animate-spin" />
                    : <XCircle className="w-6 h-6" />}
                  Je refuse ce mentorat
                </button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Votre Animateur de Pôle sera notifié de votre réponse par email.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
