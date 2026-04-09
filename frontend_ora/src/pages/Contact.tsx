import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';

export function Contact() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/public/contact/', formData);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail || 'Une erreur est survenue. Veuillez réessayer.');
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
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Message envoyé !</h2>
          <p className="text-slate-500 mb-8">
            Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-3 bg-ora-blue text-white rounded-xl font-semibold hover:bg-ora-dark transition-colors"
          >
            Envoyer un autre message
          </button>
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
            <Mail className="w-4 h-4" />
            Contact
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            Nous contacter
          </h1>
          <p className="text-lg text-white/70 max-w-xl">
            Une question, un projet, une envie de rejoindre l'aventure ? On vous répond vite.
          </p>
        </div>
      </section>

      {/* ── Corps ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid lg:grid-cols-[1fr_340px] gap-10">

          {/* Formulaire */}
          <div>
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Nom complet *">
                  <input type="text" required value={formData.name} onChange={set('name')}
                    placeholder="Marie Dupont"
                    className={INPUT} />
                </Field>
                <Field label="Email *">
                  <input type="email" required value={formData.email} onChange={set('email')}
                    placeholder="marie@exemple.fr"
                    className={INPUT} />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Téléphone">
                  <input type="tel" value={formData.phone} onChange={set('phone')}
                    placeholder="06 00 00 00 00"
                    className={INPUT} />
                </Field>
                <Field label="Sujet *">
                  <select required value={formData.subject} onChange={set('subject')} className={INPUT}>
                    <option value="">Sélectionner…</option>
                    <option value="apprentice">Je suis apprenti(e)</option>
                    <option value="mentor">Je veux devenir mentor</option>
                    <option value="partner">Partenariat</option>
                    <option value="press">Presse / Média</option>
                    <option value="other">Autre</option>
                  </select>
                </Field>
              </div>

              <Field label="Message *">
                <textarea required rows={6} value={formData.message} onChange={set('message')}
                  placeholder="Décrivez votre demande…"
                  className={INPUT + ' resize-none'} />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-ora-blue text-white rounded-xl font-semibold hover:bg-ora-dark disabled:opacity-50 transition-colors"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours…</>
                  : <><Send className="w-4 h-4" />Envoyer le message</>}
              </button>
            </form>
          </div>

          {/* Infos */}
          <div className="space-y-4">
            <InfoCard icon={<Mail className="w-5 h-5 text-blue-500" />} bg="bg-blue-50" title="Email">
              <a href="mailto:contact@ora-france.fr"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                contact@ora-france.fr
              </a>
            </InfoCard>

            <InfoCard icon={<Phone className="w-5 h-5 text-emerald-500" />} bg="bg-emerald-50" title="Téléphone">
              <p className="text-sm text-slate-500">Lun – Ven · 9h – 18h</p>
            </InfoCard>

            <InfoCard icon={<MapPin className="w-5 h-5 text-violet-500" />} bg="bg-violet-50" title="Implantations">
              <p className="text-sm text-slate-500 mb-2">Plus de 50 départements en France</p>
              <Link to="/implantations"
                className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors">
                Voir la carte <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </InfoCard>

            <div className="bg-gradient-to-br from-ora-blue/5 to-blue-100 rounded-2xl p-5 border border-blue-100">
              <p className="text-sm font-bold text-slate-900 mb-1">Tu es apprenti(e) ?</p>
              <p className="text-xs text-slate-500 mb-3">
                Inscris-toi directement via notre formulaire dédié pour être mis en relation avec un mentor.
              </p>
              <Link
                to="/apprentis/inscription"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-ora-blue text-white rounded-xl text-xs font-bold hover:bg-ora-dark transition-colors"
              >
                S'inscrire comme apprenti(e)
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const INPUT = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function InfoCard({ icon, bg, title, children }: {
  icon: React.ReactNode; bg: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900 mb-1">{title}</p>
        {children}
      </div>
    </div>
  );
}
