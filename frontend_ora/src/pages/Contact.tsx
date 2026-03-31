import { useState, type FormEvent } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import api  from '../services/api';

export function Contact() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/public/contact/', {
        name:    formData.name,
        email:   formData.email,
        phone:   formData.phone,
        subject: formData.subject,
        message: formData.message,
      });
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Message envoyé !
          </h2>
          <p className="text-slate-600 mb-6">
            Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-3 bg-ora-blue text-white rounded-lg font-semibold hover:bg-ora-dark transition-colors"
          >
            Envoyer un autre message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <Mail className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Nous contacter
            </h1>
          </div>
          <p className="text-xl text-white/90">
            Une question ? Un besoin d'information ? N'hésitez pas à nous écrire
          </p>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Contactez-nous
              </h2>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sujet *
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="apprentice">Je suis apprenti(e)</option>
                    <option value="mentor">Je veux devenir mentor</option>
                    <option value="partner">Partenariat</option>
                    <option value="press">Presse / Média</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-ora-blue text-white rounded-lg font-semibold hover:bg-ora-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Informations de contact
              </h2>

              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-ora-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-ora-blue" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">Email</h3>
                      <a href="mailto:contact@ora-france.fr" className="text-ora-blue hover:text-ora-dark">
                        contact@ora-france.fr
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-ora-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-ora-blue" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">Téléphone</h3>
                      <p className="text-slate-700">Du lundi au vendredi</p>
                      <p className="text-slate-700">9h - 18h</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-ora-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-ora-blue" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">Implantations</h3>
                      <p className="text-slate-700 mb-3">
                        ORA est présent dans plus de 50 départements en France
                      </p>
                      <a href="/implantations" className="text-ora-blue hover:text-ora-dark font-semibold">
                        Voir toutes nos implantations →
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-gradient-to-br from-ora-blue/10 to-ora-dark/10 rounded-xl p-6 border-2 border-ora-blue/20">
                <h3 className="font-bold text-slate-900 mb-3">Besoin d'un accompagnement ?</h3>
                <p className="text-slate-700 mb-4">
                  Si tu es apprenti(e) et que tu souhaites être accompagné(e), inscris-toi directement via notre formulaire dédié.
                </p>
                <a
                  href="/apprentis/inscription"
                  className="inline-block px-6 py-3 bg-ora-blue text-white rounded-lg font-semibold hover:bg-ora-dark transition-colors"
                >
                  S'inscrire comme apprenti(e)
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
