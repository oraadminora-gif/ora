// src/layouts/MemberLayout.tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { X, LogOut } from 'lucide-react';

// Import des 4 headers spécifiques
import { HeaderMentor } from './HeaderMentor';
import { HeaderAP } from './HeaderAP';
import { HeaderACP } from './HeaderACP';
import { HeaderCN } from './HeaderCN';
import { HeaderMember } from './HeaderMember';

export const MemberLayout = () => {
  const { activeRole, user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Attendre le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ora-blue"></div>
      </div>
    );
  }

  if (!user) return null;

  const renderHeader = () => {
    switch (activeRole ?? user?.role) {
      case 'MENTOR': return <HeaderMentor />;
      case 'AP':     return <HeaderAP />;
      case 'ACP':    return <HeaderACP />;
      case 'CN':     return <HeaderCN />;
      default:       return <HeaderMember />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-30">
        <Sidebar />
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-900">Menu</span>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header Mobile */}
        <div className="lg:hidden">
          <MobileHeader />
        </div>

        {/* Header Desktop - Spécifique au rôle */}
        <div className="hidden lg:block">
          {renderHeader()}
        </div>

        {/* Main */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Header mobile simplifié
function MobileHeader() {
  const { activeRole, user, signOut } = useAuth();
  
  const roleConfig: Record<string, { label: string; color: string }> = {
    'MENTOR': { label: 'Espace Mentor', color: 'bg-green-100 text-green-700' },
    'AP': { label: 'Espace Association', color: 'bg-blue-100 text-blue-700' },
    'ACP': { label: 'Gestion de Pôle', color: 'bg-purple-100 text-purple-700' },
    'CN': { label: 'Coordination Nationale', color: 'bg-slate-800 text-white' },
  };

  const config = roleConfig[activeRole] || { label: 'Espace Membre', color: 'bg-slate-100 text-slate-700' };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${config.color}`}>
            {activeRole}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{config.label}</p>
            <p className="text-xs text-slate-500 truncate max-w-[150px]">{user?.email}</p>
          </div>
        </div>
        <button onClick={signOut} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}