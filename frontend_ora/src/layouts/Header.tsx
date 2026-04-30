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
    { to: '/apprentis', label: 'Tu es apprenti(e)' },
    { to: '/mentors', label: 'Devenir mentor' },
  ];

  const dashboardPath = user ? redirectByRole(user.role) : '/login';

  return (
    <header className="bg-[#1a1a1a] sticky top-0 z-50 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center hover:opacity-85 transition-opacity"
          >
            <img
              src="/image.png"
              alt="ORA – Objectif Réussir Apprentissage"
              className="h-12 w-auto bg-white rounded-xl px-3 py-1 shadow-lg"
            />
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-white/80 hover:bg-white/10"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-white/80 hover:text-white font-medium transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="px-4 py-2 bg-ora-blue text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Mon espace
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 border border-white/40 text-white/80 rounded-full text-sm hover:bg-white/10 transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 border-2 border-white/70 text-white rounded-full text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                🔒 Espace Membre
              </Link>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-1 border-t border-white/10">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="block px-4 py-2 bg-ora-blue text-white rounded-lg text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mon espace
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white/70 hover:bg-white/10 rounded-lg text-sm"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-4 py-2 border border-white/40 text-white rounded-lg text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                🔒 Espace Membre
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
