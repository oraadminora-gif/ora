// src/layouts/HeaderCN.tsx
import { useState, useRef, useEffect } from 'react';
import {
  LogOut, Bell, Users, BarChart3, Settings, Shield,
  BookOpen, MapPin, TrendingUp, DollarSign, ChevronDown, GraduationCap,
  Mail,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';

export function HeaderCN() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [adminOpen, setAdminOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fullAccess = user?.cn_acces_complet ?? false;

  useEffect(() => {
    if (!fullAccess) return;
    api.get('/cn/messages/').then(res => {
      setUnreadCount(res.data.unread_count ?? 0);
    }).catch(() => {});
  }, [location.pathname, fullAccess]);

  // Ferme le dropdown si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const adminRoutes = [
    { to: '/member/cn/retribution',  icon: <DollarSign className="w-4 h-4" />,     label: 'Rétribution' },
    { to: '/member/cn/mentors',      icon: <Users className="w-4 h-4" />,           label: 'Mentors' },
    { to: '/member/cn/messages',     icon: <Mail className="w-4 h-4" />,            label: 'Messages', badge: unreadCount },
    { to: '/member/cn/poles',        icon: <BarChart3 className="w-4 h-4" />,       label: 'Pôles' },
    { to: '/member/cn/animateurs',   icon: <GraduationCap className="w-4 h-4" />,   label: 'Animateurs' },
    { to: '/member/cn/configuration',icon: <Settings className="w-4 h-4" />,        label: 'Configuration' },
  ];

  const adminActive = adminRoutes.some(r => location.pathname.startsWith(r.to));

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
              Comité National
            </h1>
            <p className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">
              {user.email}
            </p>
          </div>
        </div>

        {/* Centre — Navigation CN */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink
            to="/member/cn/annuaire"
            icon={<BookOpen className="w-4 h-4" />}
            label="Annuaire"
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
            label="KPIs"
            active={location.pathname === '/member/cn/kpis'}
          />

          {/* Dropdown Administration (accès complet uniquement) */}
          {fullAccess && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAdminOpen(o => !o)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  adminActive || adminOpen
                    ? 'bg-amber-500/25 text-amber-200 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Settings className="w-4 h-4" />
                Administration
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${adminOpen ? 'rotate-180' : ''}`} />
              </button>

              {adminOpen && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  {adminRoutes.map(route => (
                    <Link
                      key={route.to}
                      to={route.to}
                      onClick={() => setAdminOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        location.pathname.startsWith(route.to)
                          ? 'bg-amber-500/20 text-amber-200 font-semibold'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {route.icon}
                      <span className="flex-1">{route.label}</span>
                      {('badge' in route) && (route as { badge: number }).badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {(route as { badge: number }).badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
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
