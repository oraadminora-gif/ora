// src/pages/MentorRegistration.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  CheckCircle, AlertCircle, MapPin, Building2, ChevronRight, Info,
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

// Associations fixes nationales ORA
const ASSOCIATIONS = [
  { id: 3, name: 'AGIR' },
  { id: 4, name: 'ECTI' },
  { id: 5, name: 'EGEE' },
  { id: 6, name: 'OTECI' },
];

const EXPERTISE_DOMAINS = [
  'Commerce / Vente',
  'Industrie',
  'Artisanat',
  'Services',
  'Santé / Social',
  'Informatique / Numérique',
  'Hôtellerie / Restauration',
  'BTP',
  'Transport / Logistique',
  'Agriculture',
  'Autre',
];

const DISPONIBILITE_OPTIONS = [
  { value: '1_per_week',  label: '1 fois par semaine' },
  { value: '2_per_month', label: '2 fois par mois' },
  { value: '1_per_month', label: '1 fois par mois' },
  { value: 'flexible',    label: 'Flexible' },
];

// ─── Composant principal ─────────────────────────────────────────────────────
export function MentorRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');

  // Détection pôle
  const [poles, setPoles]             = useState<PoleOption[]>([]);
  const [detectedPole, setDetectedPole] = useState<PoleOption | null>(null);
  const [noPoleFound, setNoPoleFound]   = useState(false);

  // Formulaire
  const [form, setForm] = useState({
    first_name:     '',
    last_name:      '',
    email:          '',
    phone:          '',
    code_postal:    '',
    commune:        '',
    association_id: '' as string | number,
    experience_pro: '',
    domaines:       [] as string[],
    disponibilite:  '',
    motivation:     '',
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

  const toggleDomain = (domain: string) => {
    setForm(prev => ({
      ...prev,
      domaines: prev.domaines.includes(domain)
        ? prev.domaines.filter(d => d !== domain)
        : [...prev.domaines, domain],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!detectedPole && !noPoleFound && form.code_postal.length === 5) {
      setError('Veuillez attendre la détection du pôle ou saisir un code postal valide.');
      return;
    }
    if (noPoleFound) {
      setError('Aucun pôle ORA ne couvre votre département. Contactez-nous à ora@ora.fr');
      return;
    }
    if (!form.association_id) {
      setError('Veuillez choisir votre association.');
      return;
    }
    if (form.domaines.length === 0) {
      setError('Veuillez sélectionner au moins un domaine d\'expertise.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/public/mentor-candidatures/', {
        first_name:     form.first_name,
        last_name:      form.last_name,
        email:          form.email,
        phone:          form.phone,
        code_postal:    form.code_postal,
        commune:        form.commune,
        association_id: form.association_id,
        experience_pro: form.experience_pro,
        domaines:       form.domaines,
        disponibilite:  form.disponibilite,
        motivation:     form.motivation,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail || 'Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Écran de succès ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Candidature envoyée !
          </h2>
          <p className="text-slate-600 mb-2">
            Merci pour votre intérêt. Votre candidature a été transmise au pôle
            {detectedPole ? ` "${detectedPole.name}"` : ''}.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            L'animateur de votre association vous contactera prochainement.
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

        {/* Info : pas de compte créé */}
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

          {/* ── Étape 1 : Localisation & pôle ── */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-ora-blue text-white text-xs flex items-center justify-center font-bold">1</span>
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
                    onChange={e => setForm({ ...form, code_postal: e.target.value })}
                    placeholder="75001"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commune</label>
                <input
                  type="text"
                  value={form.commune}
                  onChange={e => setForm({ ...form, commune: e.target.value })}
                  placeholder="Ex : Paris"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                />
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
                </div>
              </div>
            )}
            {noPoleFound && (
              <div className="mt-3 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Aucun pôle ORA ne couvre votre département.{' '}
                  <a href="mailto:ora@ora.fr" className="underline font-semibold">
                    Contactez-nous à ora@ora.fr
                  </a>
                </p>
              </div>
            )}
          </section>

          {/* ── Étape 2 : Association ── */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-ora-blue text-white text-xs flex items-center justify-center font-bold">2</span>
              Votre association
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Association <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  required
                  value={form.association_id}
                  onChange={e => setForm({ ...form, association_id: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Choisissez votre association...</option>
                  {ASSOCIATIONS.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ── Étape 3 : Informations personnelles ── */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-ora-blue text-white text-xs flex items-center justify-center font-bold">3</span>
              Vos informations
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required
                  value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required
                  value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="06 XX XX XX XX"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* ── Étape 4 : Profil mentor ── */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-ora-blue text-white text-xs flex items-center justify-center font-bold">4</span>
              Votre profil mentor
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Expérience professionnelle <span className="text-red-500">*</span>
                </label>
                <textarea
                  required rows={3}
                  value={form.experience_pro}
                  onChange={e => setForm({ ...form, experience_pro: e.target.value })}
                  placeholder="Ex : 30 ans dans le commerce, dont 15 ans comme directeur de magasin..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Domaines d'expertise <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERTISE_DOMAINS.map(domain => (
                    <label
                      key={domain}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm transition-colors ${
                        form.domaines.includes(domain)
                          ? 'border-ora-blue bg-ora-blue/5 text-ora-blue'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={form.domaines.includes(domain)}
                        onChange={() => toggleDomain(domain)}
                      />
                      <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                        form.domaines.includes(domain)
                          ? 'border-ora-blue bg-ora-blue'
                          : 'border-slate-300'
                      }`}>
                        {form.domaines.includes(domain) && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {domain}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Disponibilité</label>
                <select
                  value={form.disponibilite}
                  onChange={e => setForm({ ...form, disponibilite: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent bg-white"
                >
                  <option value="">Sélectionnez votre disponibilité</option>
                  {DISPONIBILITE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Motivation <span className="text-slate-400 text-xs font-normal">(optionnel)</span>
                </label>
                <textarea
                  rows={3}
                  value={form.motivation}
                  onChange={e => setForm({ ...form, motivation: e.target.value })}
                  placeholder="Partagez ce qui vous motive à accompagner un jeune..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent resize-none"
                />
              </div>
            </div>
          </section>

          {/* ── Soumettre ── */}
          <button
            type="submit"
            disabled={loading || noPoleFound}
            className="w-full py-3 bg-ora-blue text-white rounded-full font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? 'Envoi en cours…' : (
              <>
                Envoyer ma candidature
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
