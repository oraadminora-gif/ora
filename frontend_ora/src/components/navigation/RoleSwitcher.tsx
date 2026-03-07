import { useAuth, type SwitchableRole } from '../../contexts/AuthContext';

export function RoleSwitcher() {
  const { user, activeRole, setActiveRole } = useAuth();

  if (!user) return null;

  const roles: SwitchableRole[] =
    user.role === 'admin' ? ['CN', 'ANIMATEUR', 'MENTOR'] : ['MENTOR', 'ANIMATEUR'];

  return (
    <div className="flex gap-2 bg-slate-100 p-1 rounded">
      {roles.map((role) => (
        <button
          key={role}
          onClick={() => setActiveRole(role)}
          className={`flex-1 px-3 py-1 rounded text-sm ${
            activeRole === role
              ? 'bg-white shadow font-semibold'
              : 'text-slate-500'
          }`}
        >
          {role === 'MENTOR'
            ? 'Mentor'
            : role === 'ANIMATEUR'
              ? 'Animateur'
              : 'CN'}
        </button>
      ))}
    </div>
  );
}
