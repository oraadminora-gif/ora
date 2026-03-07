// src/layouts/HeaderMember.tsx
import { LogOut, Bell, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RoleSwitcher } from '../components/auth/RoleSwitcher';

interface HeaderMemberProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export function HeaderMember({ onMenuClick, isMobile }: HeaderMemberProps) {
  const { user, signOut, activeRole } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        
        {/* Gauche */}
        <div className="flex items-center gap-4">
          {isMobile && onMenuClick && (
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
          )}
          
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Bienvenue {user.first_name || ''} 👋
            </h1>
            <p className="text-sm text-slate-600">
              {user.email} • {activeRole}
            </p>
          </div>
        </div>

        {/* Droite */}
        <div className="flex items-center gap-4">
          
          <RoleSwitcher />

          <button className="p-2 hover:bg-slate-100 rounded-full relative">
            <Bell size={20} />
            {/* Badge notification si besoin */}
          </button>

          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}