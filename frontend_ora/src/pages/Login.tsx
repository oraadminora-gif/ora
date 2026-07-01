// src/pages/Login.tsx
import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';
import { redirectByRole } from '../utils/redirectByRole';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, activeRole, loading, isAuthenticated } = useAuth();

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirection si déjà connecté
  useEffect(() => {
    if (isAuthenticated && user && activeRole && !loading) {
      const from = location.state?.from?.pathname;
      const redirectPath = from || redirectByRole(activeRole);
      
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, activeRole, loading, navigate, location]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await signIn(formData.email, formData.password);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Redirection avec le rôle retourné
      const role = result.role || activeRole;
      const redirectPath = redirectByRole(role);
      navigate(redirectPath, { replace: true });
      
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ora-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-ora-blue rounded-lg flex items-center justify-center">
              <LogIn className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Connexion
          </h1>
          <p className="text-slate-600 text-center mb-8">
            Accédez à votre espace personnel
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-800 text-sm">
                <p>{error}</p>
                <p className="mt-1">
                  Si vous avez oublié votre mot de passe, contactez l'administrateur à cette adresse :{' '}
                  <span className="font-medium">ora-france@outlook.com</span>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue"
                placeholder="eric@yahoo.fr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-ora-blue text-white rounded-lg font-semibold hover:bg-ora-dark disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Connexion…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            <p>Sous réserve, l'accès au mentor.</p>
          </div>
        </div>
      </div>
    </div>
  );
}