import { useAuth, type UserRole } from '../../contexts/AuthContext';

export function RoleSwitcher() {
  const { user, activeRole, switchRole } = useAuth();

  if (!user) return null;

  const roles: UserRole[] = user.roles ?? [user.role];

  return (
    <div className="flex gap-2 bg-slate-100 p-1 rounded">
      {roles.map((role) => (
        <button
          key={role}
          onClick={() => switchRole(role)}
          className={`flex-1 px-3 py-1 rounded text-sm ${
            activeRole === role
              ? 'bg-white shadow font-semibold'
              : 'text-slate-500'
          }`}
        >
          {role === 'MENTOR' ? 'Mentor' : role === 'AP' ? 'Animateur' : role === 'ACP' ? 'Coordinateur' : 'CN'}
        </button>
      ))}
    </div>
  );
}
