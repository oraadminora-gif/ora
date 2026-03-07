// ─────────────────────────────────────────────────────────────────────────────
// GUIDE D'INTÉGRATION — Navigation multi-rôle AP / ACP / Mentor
// ─────────────────────────────────────────────────────────────────────────────
//
// 1. AJOUTER LA ROUTE dans ton router (React Router ou équivalent)
//
//    Dans src/router/routes.tsx (ou App.tsx selon ta structure) :
//
//    import { APDashboard } from '../pages/member/ap/APDashboard';
//
//    {
//      path: '/dashboard/ap',
//      element: <APDashboard />,
//    }
//
// ─────────────────────────────────────────────────────────────────────────────
// 2. SWITCHER DE RÔLE dans la sidebar / header
//
//    Ton RoleSwitcher.tsx existant gère déjà le switch.
//    Il faut ajouter la redirection selon le rôle sélectionné :
//
//    // src/components/auth/RoleSwitcher.tsx — VERSION MISE À JOUR
//    import { useNavigate } from 'react-router-dom';
//    import { useAuth } from '../../contexts/AuthContext';
//    import type { UserRole } from '../../contexts/AuthContext';
//
//    const ROLE_ROUTES: Record<UserRole, string> = {
//      CN:     '/dashboard/cn',
//      ACP:    '/dashboard/acp',     // à créer en étape 3-4
//      AP:     '/dashboard/ap',      // ← NOUVEAU
//      MENTOR: '/dashboard/mentor',
//    };
//
//    const roleLabels: Record<UserRole, string> = {
//      CN:     'Coordination Nationale',
//      ACP:    'Coordinateur de Pôle',
//      AP:     'Animateur de Pôle',
//      MENTOR: 'Mentor',
//    };
//
//    export function RoleSwitcher() {
//      const { user, activeRole, switchRole } = useAuth();
//      const navigate = useNavigate();
//
//      if (!user || user.roles.length <= 1) return null;
//
//      const handleSwitch = (role: UserRole) => {
//        switchRole(role);
//        navigate(ROLE_ROUTES[role]);
//      };
//
//      return (
//        <div className="relative group">
//          <select
//            value={activeRole}
//            onChange={(e) => handleSwitch(e.target.value as UserRole)}
//            className="appearance-none bg-slate-100 border border-slate-300 text-slate-700
//                       py-1.5 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none
//                       focus:ring-2 focus:ring-ora-blue cursor-pointer"
//          >
//            {user.roles.map((role) => (
//              <option key={role} value={role}>{roleLabels[role]}</option>
//            ))}
//          </select>
//          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
//            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//            </svg>
//          </div>
//        </div>
//      );
//    }
//
// ─────────────────────────────────────────────────────────────────────────────
// 3. STRUCTURE DES FICHIERS À CRÉER
//
//    src/
//    ├── pages/member/ap/
//    │   ├── APDashboard.tsx          ← page principale (fichier fourni)
//    │   └── APDashboard.types.ts     ← types partagés (fichier fourni)
//    │
//    └── components/ap/
//        ├── APStatsBar.tsx           ← barre KPIs (fichier fourni)
//        ├── APMentorCard.tsx         ← carte mentor liste (fichier fourni)
//        └── APMentorDetailModal.tsx  ← modal détail (fichier fourni)
//
// ─────────────────────────────────────────────────────────────────────────────
// 4. GUARD DE ROUTE (protection accès)
//
//    Si tu as un ProtectedRoute ou RoleGuard :
//
//    <ProtectedRoute allowedRoles={['AP', 'ACP', 'CN']}>
//      <APDashboard />
//    </ProtectedRoute>
//
//    L'APDashboard est accessible par AP, ACP et CN.
//    Le backend filtre lui-même selon le rôle de l'utilisateur connecté.
//
// ─────────────────────────────────────────────────────────────────────────────
// 5. PROCHAINE ÉTAPE → ACP Dashboard
//
//    Endpoints supplémentaires à coder (étapes 3-4) :
//    GET  /acp/dashboard/          → vue pôle : toutes les associations + KPIs
//    GET  /acp/mentors/disponibles/→ liste pour matching
//    POST /acp/matching/           → créer un mentorat
//    GET  /acp/demandes/           → jeunes en attente
//
// ─────────────────────────────────────────────────────────────────────────────
