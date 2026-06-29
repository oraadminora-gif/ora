// src/layouts/HeaderMentor.tsx
import { LogOut, Bell, Home, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export function HeaderMentor() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const initials = `${user.first_name?.charAt(0) ?? ''}${user.last_name?.charAt(0) ?? ''}`.toUpperCase();

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">

        {/* Gauche — Identité */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
            <span className="text-white font-bold text-sm tracking-wide">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-white leading-tight">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider">
              Mentor
            </p>
          </div>
        </div>

        {/* Centre — Navigation Mentor */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink
            to="/member/mentor/dashboard"
            icon={<Home className="w-4 h-4" />}
            label="Accueil"
            active={location.pathname === '/member/mentor/dashboard'}
          />
          <NavLink
            to="/member/mentor/mentorats"
            icon={<BookOpen className="w-4 h-4" />}
            label="Mes mentorats"
            active={location.pathname === '/member/mentor/mentorats'}
          />
        </nav>

        {/* Droite — Actions */}
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-white/10 rounded-full relative transition-colors">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-300 hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, icon, label, active }: {
  to: string; icon: React.ReactNode; label: string; active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
        active
          ? 'bg-emerald-500/25 text-emerald-200 font-semibold'
          : 'text-slate-300 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
