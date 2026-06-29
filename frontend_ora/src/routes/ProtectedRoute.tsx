// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, activeRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ora-blue"></div>
      </div>
    );
  }

  // Pas authentifié -> login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérification des rôles
  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    return <Navigate to="/member" replace />;
  }

  return <Outlet />;
}

/** Protège les routes CN réservées aux membres avec accès complet. */
export function ProtectedCNAdminRoute() {
  const { isAuthenticated, activeRole, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ora-blue"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (activeRole !== 'CN') return <Navigate to="/member" replace />;
  if (!user?.cn_acces_complet) return <Navigate to="/member/cn/kpis" replace />;

  return <Outlet />;
}