// src/layouts/Sidebar.tsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, BarChart3, Settings,
  Home, LogOut, Shield, Globe, HandHeart, ChevronRight, FileText,
  KeyRound, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, X,
  BarChart2, BookOpen, MapPin,
} from 'lucide-react';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────
// MODAL CHANGEMENT DE MOT DE PASSE
// ─────────────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPwd, setOldPwd]       = useState('');
  const [newPwd, setNewPwd]       = useState('');
  const [confirmPwd, setConfirm]  = useState('');
  const [showOld, setShowOld]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [submitting, setSub]      = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSub(true);
    setError(null);
    try {
      await api.post('/auth/change-password/', {
        old_password:     oldPwd,
        new_password:     newPwd,
        confirm_password: confirmPwd,
      });
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Erreur lors du changement de mot de passe');
    } finally {
      setSub(false);
    }
  };

  const PW_INPUT = "w-full px-3 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ora-blue/10 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-ora-blue" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Changer le mot de passe</p>
              <p className="text-[10px] text-slate-400">Minimum 8 caractères</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">Mot de passe modifié !</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
            {/* Ancien mdp */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Mot de passe actuel</label>
              <div className="relative">
                <input required type={showOld ? 'text' : 'password'}
                  value={oldPwd} onChange={e => setOldPwd(e.target.value)}
                  className={PW_INPUT} placeholder="••••••••"
                  autoComplete="current-password" />
                <button type="button" onClick={() => setShowOld(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nouveau mdp */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Nouveau mot de passe</label>
              <div className="relative">
                <input required type={showNew ? 'text' : 'password'}
                  value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  className={PW_INPUT} placeholder="••••••••"
                  autoComplete="new-password" />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmation */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Confirmer le nouveau mot de passe</label>
              <input required type="password"
                value={confirmPwd} onChange={e => setConfirm(e.target.value)}
                className={PW_INPUT} placeholder="••••••••"
                autoComplete="new-password" />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                Annuler
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-ora-blue text-white text-sm font-bold rounded-xl hover:bg-ora-blue/90 disabled:opacity-60 transition-all">
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Modifier
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONFIG RÔLES & MENUS
// ─────────────────────────────────────────────────────────────
interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
  disabled?: boolean;
  scrollTo?: string;
  requiresFullAccess?: boolean;
}

const ROLE_CONFIG: Record<string, { label: string; accent: string; color: string }> = {
  MENTOR: { label: 'Mentor',            accent: 'text-emerald-400', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  AP:     { label: 'Animateur de Pôle', accent: 'text-sky-400',     color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'            },
  ACP:    { label: 'Coordonnateur de Pôle',      accent: 'text-violet-400',  color: 'bg-violet-500/20 text-violet-300 border-violet-500/30'   },
  CN:     { label: 'Comité National',    accent: 'text-amber-400',   color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'     },
};

const ROLE_HOME: Record<UserRole, string> = {
  MENTOR: '/member/mentor/dashboard',
  AP:     '/member/ap/dashboard',
  ACP:    '/member/acp/dashboard',
  CN:     '/member/cn/dashboard',
};

const menuItems: MenuItem[] = [
  { label: 'Accueil',        path: '/member',                  roles: ['MENTOR'], icon: <Home size={18} /> },
  // MENTOR
  { label: 'Mes mentorats',  path: '/member/mentor/dashboard', roles: ['MENTOR'],                 icon: <HandHeart size={18} />, scrollTo: 'mentorats-en-cours' },
  // AP
  { label: 'Tableau de bord',  path: '/member/ap/dashboard',  roles: ['AP'], icon: <LayoutDashboard size={18} /> },
  { label: 'Mes mentorats',    path: '/member/ap/mentorats',  roles: ['AP'], icon: <BookOpen size={18} /> },
  { label: 'Annuaire',         path: '/member/acp/annuaire',  roles: ['AP'], icon: <MapPin size={18} /> },
  { label: 'Implantations',    path: '/member/cn/implantations', roles: ['AP'], icon: <Globe size={18} /> },
  { label: 'KPIs Nationaux',   path: '/member/cn/kpis',          roles: ['AP'], icon: <BarChart2 size={18} /> },
  // ACP — vue pôle complète (inclut accès aux vues AP)
  { label: 'Tableau de bord',    path: '/member/acp/dashboard',  roles: ['ACP'],       icon: <LayoutDashboard size={18} /> },
  { label: 'Affectation',        path: '/member/matching',       roles: ['ACP'],       icon: <HandHeart size={18} /> },
  { label: 'KPIs Pôle',          path: '/member/pole/kpi',       roles: ['ACP'],       icon: <BarChart3 size={18} /> },
  { label: 'Annuaire Pôle',      path: '/member/acp/annuaire',   roles: ['ACP'],       icon: <BookOpen size={18} /> },
  { label: 'Gestion mentors',    path: '/member/acp/mentors',    roles: ['ACP'],       icon: <Users size={18} /> },
  { label: 'Gestion APs',        path: '/member/acp/animateurs', roles: ['ACP'],       icon: <Shield size={18} /> },
  { label: 'Suivi mentorats',    path: '/member/acp/mentorats',  roles: ['ACP'],       icon: <FileText size={18} /> },
  { label: 'Implantations',      path: '/member/cn/implantations', roles: ['ACP'],     icon: <Globe size={18} /> },
  { label: 'KPIs Nationaux',     path: '/member/cn/kpis',          roles: ['ACP'],     icon: <BarChart2 size={18} /> },
  // CN
  { label: 'Vue nationale',       path: '/member/cn/dashboard',    roles: ['CN'], icon: <Globe size={18} /> },
  { label: 'Gestion mentors',     path: '/member/cn/mentors',      roles: ['CN'], icon: <Users size={18} />,    requiresFullAccess: true },
  { label: 'Gestion pôles',       path: '/member/cn/poles',        roles: ['CN'], icon: <Shield size={18} />,   requiresFullAccess: true },
  { label: 'Gestion animateurs',  path: '/member/cn/animateurs',   roles: ['CN'], icon: <Users size={18} />,    requiresFullAccess: true },
  { label: 'Annuaire ORA',        path: '/member/cn/annuaire',     roles: ['CN'], icon: <BookOpen size={18} /> },
  { label: 'Implantations',       path: '/member/cn/implantations',roles: ['CN'], icon: <MapPin size={18} /> },
  { label: 'KPIs Nationaux',      path: '/member/cn/kpis',         roles: ['CN'], icon: <BarChart2 size={18} /> },
  { label: 'Configuration',       path: '/member/cn/configuration',roles: ['CN'], icon: <Settings size={18} />, requiresFullAccess: true },
];

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────
interface SidebarProps { onNavigate?: () => void }

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const { user, activeRole, switchRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showChangePwd, setShowChangePwd] = useState(false);

  if (!user) return null;

  const fullAccess = activeRole !== 'CN' || (user.cn_acces_complet ?? false);
  const roleInfo = ROLE_CONFIG[activeRole] ?? { label: 'Membre', accent: 'text-slate-400', color: '' };
  const filteredMenu = menuItems.filter(i =>
    i.roles.includes(activeRole) && (!i.requiresFullAccess || fullAccess)
  );
  const initials = `${user.first_name?.charAt(0) ?? ''}${user.last_name?.charAt(0) ?? ''}`.toUpperCase();

  const availableRoles = user.roles ?? [activeRole];
  const isMultiRole = availableRoles.length > 1;

  const handleSwitchRole = (role: UserRole) => {
    switchRole(role);
    navigate(ROLE_HOME[role]);
    onNavigate?.();
  };

  const isActive = (path: string) => {
    if (path === '#') return false;
    if (path === '/member') return location.pathname === '/member';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleClick = (item: MenuItem) => {
    onNavigate?.();
    if (!item.scrollTo) return;
    if (location.pathname === item.path) {
      scrollToSection(item.scrollTo);
    } else {
      navigate(item.path);
      setTimeout(() => scrollToSection(item.scrollTo!), 350);
    }
  };

  return (
    <>
      <div
        className="flex flex-col h-full"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/5">
          <div className="flex items-center justify-center h-10">
            <img src="/image.png" alt="ORA" className="h-17 w-auto object-contain brightness-auto" />
          </div>
        </div>

        {/* Profil */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 backdrop-blur-sm">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-ora-blue flex items-center justify-center shadow-lg shadow-ora-blue/30">
                <span className="text-white font-bold text-xs tracking-wide">{initials}</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className={`text-[10px] font-medium uppercase tracking-widest mt-0.5 ${roleInfo.accent}`}>
                {roleInfo.label}
              </p>
            </div>
            {/* Bouton changement de mot de passe */}
            <button
              onClick={() => setShowChangePwd(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-all shrink-0"
              title="Changer le mot de passe"
            >
              <KeyRound size={14} />
            </button>
          </div>
        </div>

        {/* ── Switcher de rôle ── */}
        {isMultiRole && (
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2 px-1">
              Basculer vers
            </p>
            <div className="flex flex-col gap-1">
              {availableRoles.map(role => {
                const cfg = ROLE_CONFIG[role];
                const active = role === activeRole;
                if (!cfg) return null;
                return (
                  <button
                    key={role}
                    onClick={() => !active && handleSwitchRole(role)}
                    disabled={active}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold
                      border transition-all duration-150
                      ${active
                        ? `${cfg.color} border opacity-100 cursor-default`
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white cursor-pointer'
                      }
                    `}
                  >
                    <span>{cfg.label}</span>
                    {active
                      ? <span className="text-[9px] font-black uppercase tracking-wider opacity-60">actif</span>
                      : <ChevronRight size={12} className="opacity-50" />
                    }
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {filteredMenu.map(item => {
            const active = isActive(item.path);
            const disabled = item.disabled || item.path === '#';

            if (disabled) {
              return (
                <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-30 cursor-not-allowed select-none">
                  <span className="text-slate-400 shrink-0">{item.icon}</span>
                  <span className="text-sm font-medium text-slate-400">{item.label}</span>
                  <span className="ml-auto text-[9px] uppercase tracking-wider text-slate-500 border border-slate-600 px-1.5 py-0.5 rounded">
                    bientôt
                  </span>
                </div>
              );
            }

            const baseClass = `group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150`;
            const activeClass = `bg-ora-blue text-white shadow-lg shadow-ora-blue/25`;
            const inactiveClass = `text-slate-400 hover:text-white hover:bg-white/8`;

            const content = (
              <>
                <span className={`shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-white/60" />
                  </span>
                )}
              </>
            );

            if (item.scrollTo) {
              return (
                <button key={item.label} onClick={() => handleClick(item)}
                  className={`${baseClass} ${active ? activeClass : inactiveClass}`}>
                  {content}
                </button>
              );
            }

            return (
              <Link key={item.label} to={item.path} onClick={onNavigate}
                className={`${baseClass} ${active ? activeClass : inactiveClass}`}>
                {content}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => { signOut(); onNavigate?.(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
          >
            <LogOut size={15} />
            Déconnexion
          </button>
          <p className="text-[10px] text-slate-600 text-center mt-3 tracking-wider">© 2026 ORA</p>
        </div>
      </div>

      {/* Modal changement de mot de passe */}
      {showChangePwd && (
        <ChangePasswordModal onClose={() => setShowChangePwd(false)} />
      )}
    </>
  );
};
