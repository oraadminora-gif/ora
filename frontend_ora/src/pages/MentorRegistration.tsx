// src/pages/MentorRegistration.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  CheckCircle, AlertCircle, MapPin, Info, ChevronRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface PoleOption {
  id: number;
  name: string;
  code: string;
  dept_codes: string;
  dept_names: string;
  hint: string;
}

// ─── Composant principal ─────────────────────────────────────────────────────
export function MentorRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  // Détection pôle
  const [poles, setPoles]               = useState<PoleOption[]>([]);
  const [detectedPole, setDetectedPole] = useState<PoleOption | null>(null);
  const [noPoleFound, setNoPoleFound]   = useState(false);

  // Formulaire
  const [form, setForm] = useState({
    first_name:  '',
    last_name:   '',
    email:       '',
    phone:       '',
    code_postal: '',
    commune:     '',
    motivation:  '',
  });

  // Charger les pôles au montage
  useEffect(() => {
    api.get<PoleOption[]>('/public/poles/').then(r => setPoles(r.data)).catch(() => {});
  }, []);

  // Détection pôle par CP
  useEffect(() => {
    const cp = form.code_postal.trim();
    if (cp.length !== 5) {
      setDetectedPole(null);
      setNoPoleFound(false);
      return;
    }
    const deptCode = cp.startsWith('97') ? cp.slice(0, 3) : cp.slice(0, 2);
    const match = poles.find(p =>
      p.dept_codes.split(', ').some(c => c === deptCode)
    );
    if (match) {
      setDetectedPole(match);
      setNoPoleFound(false);
    } else if (poles.length > 0) {
      setDetectedPole(null);
      setNoPoleFound(true);
    }
  }, [form.code_postal, poles]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (noPoleFound) {
      setError('Aucun pôle ORA ne couvre votre département.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/public/mentor-candidatures/', {
        first_name:  form.first_name,
        last_name:   form.last_name,
        email:       form.email,
        phone:       form.phone,
        code_postal: form.code_postal,
        commune:     form.commune,
        motivation:  form.motivation,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail || 'Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const INPUT = 'w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent';

  // ─── Écran de succès ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Candidature envoyée !</h2>
          <p className="text-slate-600 mb-2">
            Merci pour votre intérêt. Votre candidature a été transmise au pôle
            {detectedPole ? ` "${detectedPole.name}"` : ''}.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            L'animateur de votre pôle vous contactera prochainement.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-ora-blue text-white rounded-full font-semibold hover:opacity-90"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // ─── Formulaire ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4">

        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Devenir mentor</h1>
          <p className="text-slate-500">
            Transmettez votre expérience et accompagnez un jeune apprenti — c'est gratuit et bénévole.
          </p>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Aucun compte ne sera créé à cette étape. L'animateur ORA de votre pôle
            examinera votre candidature et vous contactera pour finaliser votre inscription.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 space-y-8">

          {/* ── 1 : Vos informations ── */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-ora-blue text-white text-xs flex items-center justify-center font-bold">1</span>
              Vos informations
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input type="text" required value={form.first_name} onChange={set('first_name')} className={INPUT} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input type="text" required value={form.last_name} onChange={set('last_name')} className={INPUT} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input type="email" required value={form.email} onChange={set('email')} className={INPUT} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="06 XX XX XX XX" className={INPUT} />
              </div>
            </div>
          </section>

          {/* ── 2 : Votre localisation ── */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-ora-blue text-white text-xs flex items-center justify-center font-bold">2</span>
              Votre localisation
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Code postal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={form.code_postal}
                    onChange={set('code_postal')}
                    placeholder="75001"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commune</label>
                <input type="text" value={form.commune} onChange={set('commune')} placeholder="Ex : Paris" className={INPUT} />
              </div>
            </div>

            {/* Pôle détecté */}
            {detectedPole && (
              <div className="mt-3 flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Pôle détecté : {detectedPole.name}</span>
                  {detectedPole.dept_names && (
                    <span className="text-green-600 ml-1">— {detectedPole.dept_names}</span>
                  )}
                  <p className="text-xs text-green-600 mt-0.5">Votre candidature sera transmise à ce pôle.</p>
                </div>
              </div>
            )}

            {/* Pas de pôle → contact */}
            {noPoleFound && (
              <div className="mt-3 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Désolé, aucun pôle ORA ne couvre votre département.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Écrivez-nous à{' '}
                    <a href="mailto:ora@ora.fr" className="font-bold underline hover:text-amber-900">ora@ora.fr</a>
                    {' '}ou{' '}
                    <Link to="/contact" className="font-bold underline hover:text-amber-900">via notre formulaire de contact</Link>.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ── 3 : Motivation ── (masqué si pas de pôle) */}
          {!noPoleFound && (
            <section>
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-ora-blue text-white text-xs flex items-center justify-center font-bold">3</span>
                Motivation
              </h2>
              <textarea
                rows={4}
                value={form.motivation}
                onChange={set('motivation')}
                placeholder="Partagez ce qui vous motive à accompagner un jeune apprenti..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent resize-none"
              />
            </section>
          )}

          {/* ── Soumettre ── (masqué si pas de pôle) */}
          {!noPoleFound && (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ora-blue text-white rounded-full font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? 'Envoi en cours…' : (
                <>
                  Envoyer ma candidature
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
