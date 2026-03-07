import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { redirectByRole } from '../utils/redirectByRole';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const navLinks = [
    { to: '/ora', label: "ORA c'est quoi ?" },
    { to: '/apprentis', label: 'Je suis apprenti(e)' },
    { to: '/mentors', label: 'Devenir mentor' },
  ];

  const dashboardPath = user ? redirectByRole(user.role) : '/login';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* ✅ Logo */}
          <Link
            to="/"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src="/image.png"
              alt="ORA"
              className="h-12"
            />
          </Link>

          {/* ✅ Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* ✅ Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-slate-700 hover:text-ora-blue font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="px-4 py-2 bg-ora-blue text-white rounded-lg hover:bg-ora-dark transition-colors"
                >
                  Dashboard
                </Link>

                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-ora-orange text-white rounded-lg hover:bg-ora-dark transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>

        {/* ✅ Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="block px-4 py-2 bg-ora-blue text-white rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>

                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-4 py-2 bg-ora-orange text-white rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Connexion
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
