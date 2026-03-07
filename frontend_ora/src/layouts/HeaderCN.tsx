// src/layouts/HeaderCN.tsx
import { LogOut, Bell, Globe, Users, BarChart3, Settings, Shield, BookOpen, MapPin, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export function HeaderCN() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const fullAccess = user.cn_acces_complet ?? false;

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">

        {/* Gauche — Identité */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-white leading-tight">
              Coordination Nationale
            </h1>
            <p className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">
              {user.email}
            </p>
          </div>
        </div>

        {/* Centre — Navigation CN */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink
            to="/member/cn/dashboard"
            icon={<Globe className="w-4 h-4" />}
            label="Accueil"
            active={location.pathname === '/member/cn/dashboard'}
          />
          <NavLink
            to="/member/cn/annuaire"
            icon={<BookOpen className="w-4 h-4" />}
            label="Annuaire ORA"
            active={location.pathname === '/member/cn/annuaire'}
          />
          <NavLink
            to="/member/cn/implantations"
            icon={<MapPin className="w-4 h-4" />}
            label="Implantation"
            active={location.pathname === '/member/cn/implantations'}
          />
          <NavLink
            to="/member/cn/kpis"
            icon={<TrendingUp className="w-4 h-4" />}
            label="KPIs nationaux"
            active={location.pathname === '/member/cn/kpis'}
          />

          {/* Accès complet uniquement */}
          {fullAccess && (
            <>
              <NavLink
                to="/member/cn/mentors"
                icon={<Users className="w-4 h-4" />}
                label="Mentors"
                active={location.pathname.startsWith('/member/cn/mentors')}
              />
              <NavLink
                to="/member/cn/poles"
                icon={<BarChart3 className="w-4 h-4" />}
                label="Pôles"
                active={location.pathname.startsWith('/member/cn/poles')}
              />
              <NavLink
                to="/member/cn/configuration"
                icon={<Settings className="w-4 h-4" />}
                label="Configuration"
                active={location.pathname.startsWith('/member/cn/configuration')}
              />
            </>
          )}
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
          ? 'bg-amber-500/25 text-amber-200 font-semibold'
          : 'text-slate-300 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
