import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';
import { CoordinatorDashboard } from '../components/dashboards/CoordinatorDashboard';
import { MentorDashboard } from '../components/dashboards/MentorDashboard';
import { MenteeDashboard } from '../components/dashboards/MenteeDashboard';

export function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-ora-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'coordinator':
      return <CoordinatorDashboard />;
    case 'mentor':
      return <MentorDashboard />;
    case 'mentee':
      return <MenteeDashboard />;
    default:
      return <Navigate to="/" replace />;
  }
}
