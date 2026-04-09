import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import axios from 'axios';
import {
  CheckCircle, AlertCircle, MapPin, Loader2,
  User, GraduationCap, MessageSquare, ShieldCheck,
} from 'lucide-react';

interface PoleOption {
  id: number; name: string; code: string;
  dept_codes: string; dept_names: string; hint: string;
}

const DIPLOME_OPTIONS = [
  { group: 'Niveau 3', options: [
    { value: 'CAP', label: 'CAP' },
    { value: 'BEP', label: 'BEP' },
  ]},
  { group: 'Niveau 4', options: [
    { value: 'BAC_PRO',   label: 'Bac Professionnel' },
    { value: 'BAC_AUTRE', label: 'Bac (autre)' },
    { value: 'BP',        label: 'Brevet Professionnel (BP)' },
  ]},
  { group: 'Niveau 5', options: [
    { value: 'BTS', label: 'BTS' },
    { value: 'DUT', label: 'DUT' },
  ]},
  { group: 'Niveau 6', options: [
    { value: 'LIC_PRO', label: 'Licence Professionnelle' },
    { value: 'BUT',     label: 'BUT' },
  ]},
  { group: 'Niveau 7', options: [
    { value: 'MASTER', label: 'Master' },
    { value: 'DEA',    label: 'DEA' },
    { value: 'DES',    label: "Diplôme d'études spécialisées" },
    { value: 'ING',    label: 'Ingénieur' },
  ]},
];

const INPUT = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
          {icon}
        </div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="space-y-4 pl-9">{children}</div>
    </div>
  );
}

export function ApprenticeRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState('');
  const [poles, setPoles]               = useState<PoleOption[]>([]);
  const [detectedPole, setDetectedPole] = useState<PoleOption | null>(null);
  const [noPoleFound, setNoPoleFound]   = useState(false);

  useEffect(() => {
    api.get<PoleOption[]>('/public/poles/').then(r => setPoles(r.data)).catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    birthDate: '', gender: '',
    poleId: '', commune: '', codePostal: '',
    nomEtablissement: '', diplomePrepare: '',
    situation: '' as '' | 'apprentissage' | 'recherche',
    demande: '', consentGiven: false,
  });

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleCodePostalChange = (val: string) => {
    setFormData(prev => ({ ...prev, codePostal: val, poleId: '' }));
    setDetectedPole(null);
    setNoPoleFound(false);
    if (val.length === 5) {
      const deptCode = val.startsWith('97') ? val.slice(0, 3) : val.slice(0, 2);
      const match = poles.find(p => p.dept_codes.split(', ').some(c => c === deptCode));
      if (match) {
        setDetectedPole(match);
        setFormData(prev => ({ ...prev, codePostal: val, poleId: String(match.id) }));
      } else {
        setNoPoleFound(true);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.consentGiven) {
      setError('Vous devez accepter la politique de confidentialité'); return;
    }
    if (noPoleFound || !formData.poleId) {
      setError("Aucun pôle ne couvre votre département. Veuillez nous contacter."); return;
    }
    setLoading(true);
    try {
      const res = await api.post('/public/demande/', {
        first_name:        formData.firstName,
        last_name:         formData.lastName,
        email:             formData.email,
        phone:             formData.phone,
        birth_date:        formData.birthDate || undefined,
        gender:            formData.gender || undefined,
        pole_id:           Number(formData.poleId),
        commune:           formData.commune,
        code_postal:       formData.codePostal,
        nom_etablissement: formData.nomEtablissement,
        diplome_prepare:   formData.diplomePrepare || undefined,
        situation:         formData.situation || undefined,
        needs_description: formData.demande || 'Non précisé',
        urgency_level:     1,
      });
      if (res.data && typeof res.data === 'object' && 'error' in res.data) {
        setError(res.data.error);
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/'), 3000);
      }
    } catch (err) {
      let msg = "Une erreur est survenue lors de l'envoi. Veuillez réessayer.";
      if (axios.isAxiosError(err)) msg = err.response?.data?.error || err.message || msg;
      else if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Inscription envoyée !</h2>
          <p className="text-slate-500 mb-2">
            Merci ! Nous allons étudier ta demande et te recontacter très prochainement pour te
            mettre en relation avec un mentor adapté.
          </p>
          <p className="text-xs text-slate-400">Redirection vers l'accueil…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-slate-900 text-white pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2 text-blue-300 text-sm font-medium tracking-widest uppercase mb-5">
            <MapPin className="w-4 h-4" />
            Inscription
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            Trouve ton mentor
          </h1>
          <p className="text-lg text-white/70 max-w-xl">
            Remplis ce formulaire pour être mis(e) en relation avec un mentor bénévole
            qui t'accompagnera dans ton apprentissage.
          </p>
        </div>
      </section>

      {/* ── Formulaire ────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-14">

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ── Identité ──────────────────────────────────────────── */}
          <Section icon={<User className="w-4 h-4" />} title="Identité">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Prénom *">
                <input type="text" required placeholder="Marie" value={formData.firstName}
                  onChange={set('firstName')} className={INPUT} />
              </Field>
              <Field label="Nom *">
                <input type="text" required placeholder="Dupont" value={formData.lastName}
                  onChange={set('lastName')} className={INPUT} />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email *">
                <input type="email" required placeholder="marie@exemple.fr" value={formData.email}
                  onChange={set('email')} className={INPUT} />
              </Field>
              <Field label="Téléphone">
                <input type="tel" placeholder="06 00 00 00 00" value={formData.phone}
                  onChange={set('phone')} className={INPUT} />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Date de naissance">
                <input type="date" value={formData.birthDate}
                  onChange={set('birthDate')} className={INPUT} />
              </Field>
              <Field label="Genre">
                <select value={formData.gender} onChange={set('gender')} className={INPUT}>
                  <option value="">Non précisé</option>
                  <option value="M">Garçon</option>
                  <option value="F">Fille</option>
                  <option value="O">Autre</option>
                </select>
              </Field>
            </div>
          </Section>

          <hr className="border-slate-100" />

          {/* ── Localisation ──────────────────────────────────────── */}
          <Section icon={<MapPin className="w-4 h-4" />} title="Localisation">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Code postal *" hint="Permet de trouver le pôle ORA le plus proche">
                <input type="text" required maxLength={5} placeholder="Ex : 75013"
                  value={formData.codePostal}
                  onChange={e => handleCodePostalChange(e.target.value)}
                  className={INPUT} />
              </Field>
              <Field label="Commune *">
                <input type="text" required placeholder="Ex : Paris, Lyon…"
                  value={formData.commune} onChange={set('commune')} className={INPUT} />
              </Field>
            </div>

            {detectedPole && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Pôle détecté : {detectedPole.name}</p>
                  {detectedPole.dept_names && (
                    <p className="text-xs text-emerald-700 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{detectedPole.dept_names}
                    </p>
                  )}
                  <p className="text-xs text-emerald-600 mt-1">Ta demande sera automatiquement transmise à ce pôle.</p>
                </div>
              </div>
            )}

            {noPoleFound && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Désolé, aucun pôle ne couvre ton département.</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Écris-nous à{' '}
                    <a href="mailto:ora@ora.fr" className="font-bold underline hover:text-amber-900">ora@ora.fr</a>
                    {' '}ou{' '}
                    <Link to="/contact" className="font-bold underline hover:text-amber-900">via notre formulaire</Link>.
                  </p>
                </div>
              </div>
            )}

            {!detectedPole && !noPoleFound && formData.codePostal.length === 5 && poles.length === 0 && (
              <Field label="Pôle ORA de rattachement *">
                <select required value={formData.poleId} onChange={set('poleId')} className={INPUT}>
                  <option value="">— Sélectionne ton pôle —</option>
                  {poles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.dept_codes ? ` — Dép. ${p.dept_codes}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </Section>

          <hr className="border-slate-100" />

          {/* ── Scolarité ─────────────────────────────────────────── */}
          <Section icon={<GraduationCap className="w-4 h-4" />} title="Scolarité">
            <Field label="Diplôme préparé">
              <select value={formData.diplomePrepare} onChange={set('diplomePrepare')} className={INPUT}>
                <option value="">Sélectionne ton diplôme</option>
                {DIPLOME_OPTIONS.map(grp => (
                  <optgroup key={grp.group} label={grp.group}>
                    {grp.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>

            <Field label="Ta situation actuelle *">
              <div className="grid sm:grid-cols-2 gap-3">
                {([
                  { value: 'apprentissage', label: 'Déjà en apprentissage' },
                  { value: 'recherche',     label: "En recherche d'apprentissage" },
                ] as const).map(sit => (
                  <label key={sit.value}
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.situation === sit.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}>
                    <input type="radio" name="situation" value={sit.value}
                      checked={formData.situation === sit.value}
                      onChange={() => setFormData(prev => ({ ...prev, situation: sit.value }))}
                      className="w-4 h-4 text-blue-600 accent-blue-600" />
                    <span className="text-sm font-medium text-slate-700">{sit.label}</span>
                  </label>
                ))}
              </div>
            </Field>

            {formData.situation !== 'recherche' && (
              <Field label="Nom de ton école / CFA">
                <input type="text" placeholder="Ex : CFA des Métiers, Lycée Professionnel…"
                  value={formData.nomEtablissement} onChange={set('nomEtablissement')}
                  className={INPUT} />
              </Field>
            )}
          </Section>

          <hr className="border-slate-100" />

          {/* ── Demande ───────────────────────────────────────────── */}
          <Section icon={<MessageSquare className="w-4 h-4" />} title="Ta demande">
            <Field label="Exprime ta demande *" hint="Décris ce sur quoi tu souhaites être accompagné(e)">
              <textarea required rows={5}
                placeholder="Ex : j'ai des difficultés avec mon employeur, je cherche de l'aide pour mon dossier professionnel…"
                value={formData.demande} onChange={set('demande')}
                className={INPUT + ' resize-none'} />
            </Field>
          </Section>

          <hr className="border-slate-100" />

          {/* ── Consentement + Envoi ──────────────────────────────── */}
          <Section icon={<ShieldCheck className="w-4 h-4" />} title="Confidentialité">
            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
              <input type="checkbox" required checked={formData.consentGiven}
                onChange={e => setFormData(prev => ({ ...prev, consentGiven: e.target.checked }))}
                className="w-4 h-4 text-blue-600 accent-blue-600 mt-0.5 shrink-0" />
              <span className="text-xs text-slate-600 leading-relaxed">
                J'accepte que mes données personnelles soient utilisées pour me mettre en relation
                avec un mentor. Mes données resteront confidentielles et ne seront pas partagées
                avec des tiers. *
              </span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-ora-blue text-white rounded-xl font-bold text-base hover:bg-ora-dark disabled:opacity-50 transition-colors">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours…</>
                : 'Envoyer ma demande'}
            </button>
          </Section>

        </form>
      </section>
    </div>
  );
}
