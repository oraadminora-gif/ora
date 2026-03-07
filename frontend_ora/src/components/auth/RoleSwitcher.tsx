// src/components/auth/RoleSwitcher.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../contexts/AuthContext';

const ROLE_ROUTES: Record<UserRole, string> = {
  CN:     '/member/cn/dashboard',
  ACP:    '/member/pole/dashboard',  // ACP voit le dashboard pôle
  AP:     '/member/ap/dashboard',     // AP voit son association
  MENTOR: '/member/mentor/dashboard',
};

const roleLabels: Record<UserRole, string> = {
  CN:     'Coordination Nationale',
  ACP:    'Coordinateur de Pôle',
  AP:     'Animateur de Pôle',
  MENTOR: 'Mentor',
};

const roleColors: Record<UserRole, string> = {
  CN:     'bg-purple-100 text-purple-700 border-purple-200',
  ACP:    'bg-blue-100 text-blue-700 border-blue-200',
  AP:     'bg-green-100 text-green-700 border-green-200',
  MENTOR: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function RoleSwitcher() {
  const { user, activeRole, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || user.roles.length <= 1) return null;

  const currentRole = activeRole || user.roles[0];

  const handleSwitch = (role: UserRole) => {
    switchRole(role);
    // Navigation intelligente : si la route actuelle n'est pas accessible au nouveau rôle,
    // rediriger vers la home du nouveau rôle
    const currentPath = location.pathname;
    const isRouteAllowed = checkRouteAccess(currentPath, role);
    
    if (!isRouteAllowed) {
      navigate(ROLE_ROUTES[role]);
    }
  };

  // Helper pour vérifier si une route est accessible par un rôle
  const checkRouteAccess = (path: string, role: UserRole): boolean => {
    if (path.includes('/cn/')) return role === 'CN';
    if (path.includes('/pole/')) return ['ACP', 'CN'].includes(role);
    if (path.includes('/ap/')) return ['AP', 'ACP', 'CN'].includes(role);
    if (path.includes('/mentor/')) return ['MENTOR', 'AP', 'ACP', 'CN'].includes(role);
    if (path.includes('/member')) return true; // Index redirect
    return false;
  };

  return (
    <div className="relative group">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${roleColors[currentRole]}`}>
        <span>{roleLabels[currentRole]}</span>
        {user.roles.length > 1 && (
          <select
            value={currentRole}
            onChange={(e) => handleSwitch(e.target.value as UserRole)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          >
            {user.roles.map((role) => (
              <option key={role} value={role}>{roleLabels[role]}</option>
            ))}
          </select>
        )}
      </div>
      {user.roles.length > 1 && (
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-lg shadow-lg p-1 min-w-[180px] z-50">
          <div className="text-xs font-medium text-slate-500 px-2 py-1">Basculer vers :</div>
          {user.roles.filter(r => r !== currentRole).map((role) => (
            <button
              key={role}
              onClick={() => handleSwitch(role)}
              className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2"
            >
              <span className={`w-2 h-2 rounded-full ${roleColors[role].split(' ')[0].replace('bg-', 'bg-').replace('100', '500')}`} />
              {roleLabels[role]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}