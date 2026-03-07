import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios'; // ajouter pour isAxiosError

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

export function MentorRegistration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const needsAccount = !user;

  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    professionalExperience: '',
    expertiseDomains: [] as string[],
    availability: '',
    postalCode: '',
    department: '',
    motivation: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // If user needs an account, register them first
      if (needsAccount && !user) {
        const registerResponse = await api.post('/auth/register', { // adaptez l'endpoint selon votre API
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: 'mentor',
          phoneNumber: formData.phone,
        });

        // Vérifier si le backend a renvoyé une erreur dans la réponse (si succès avec champ error)
        if (registerResponse.data && typeof registerResponse.data === 'object' && 'error' in registerResponse.data) {
          throw new Error(registerResponse.data.error);
        }
      }

      // Submit mentor application
      const applicationResponse = await api.post('/mentor-applications', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        professionalExperience: formData.professionalExperience,
        expertiseDomains: formData.expertiseDomains,
        availability: formData.availability,
        postalCode: formData.postalCode,
        department: formData.department,
        motivation: formData.motivation,
      });

      if (applicationResponse.data && typeof applicationResponse.data === 'object' && 'error' in applicationResponse.data) {
        throw new Error(applicationResponse.data.error);
      }

      setSuccess(true);
      setTimeout(() => navigate(user ? '/dashboard' : '/'), 3000);
    } catch (err: unknown) {
      let message = 'Une erreur est survenue';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.error || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDomain = (domain: string) => {
    setFormData(prev => ({
      ...prev,
      expertiseDomains: prev.expertiseDomains.includes(domain)
        ? prev.expertiseDomains.filter(d => d !== domain)
        : [...prev.expertiseDomains, domain]
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Candidature envoyée !
          </h2>
          <p className="text-slate-600 mb-6">
            Merci pour votre intérêt. Votre candidature va être étudiée par notre équipe. Nous vous recontacterons très prochainement.
          </p>
          <p className="text-sm text-slate-500">
            Redirection...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Devenir mentor
          </h1>
          <p className="text-slate-600 mb-8">
            Remplissez ce formulaire pour candidater en tant que mentor
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {needsAccount && !user && (
              <>
                <div className="bg-ora-blue/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-900">
                    Un compte sera créé automatiquement pour accéder à votre espace mentor
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email * (pour votre compte)
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mot de passe * (minimum 6 caractères)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                  />
                </div>
              </>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                />
              </div>
            </div>

            {user && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Expérience professionnelle * (décrivez brièvement votre parcours)
              </label>
              <textarea
                required
                rows={4}
                value={formData.professionalExperience}
                onChange={(e) => setFormData({ ...formData, professionalExperience: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                placeholder="Ex: 30 ans d'expérience dans le secteur du commerce, dont 15 ans comme responsable..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Domaines d'expertise * (sélectionnez un ou plusieurs domaines)
              </label>
              <div className="space-y-2">
                {EXPERTISE_DOMAINS.map(domain => (
                  <label key={domain} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.expertiseDomains.includes(domain)}
                      onChange={() => toggleDomain(domain)}
                      className="w-4 h-4 text-ora-blue rounded focus:ring-2 focus:ring-ora-blue"
                    />
                    <span className="text-slate-700">{domain}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Disponibilité (fréquence d'accompagnement souhaitée)
              </label>
              <select
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
              >
                <option value="">Sélectionnez votre disponibilité</option>
                <option value="1_per_week">1 fois par semaine</option>
                <option value="2_per_month">2 fois par mois</option>
                <option value="1_per_month">1 fois par mois</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Code postal
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Département
                </label>
                <input
                  type="text"
                  placeholder="Ex: 75, 69, 13..."
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Motivation (pourquoi souhaitez-vous devenir mentor ?)
              </label>
              <textarea
                rows={4}
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
                placeholder="Partagez ce qui vous motive à accompagner un jeune..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ora-blue text-white rounded-lg font-semibold hover:bg-ora-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer ma candidature'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}