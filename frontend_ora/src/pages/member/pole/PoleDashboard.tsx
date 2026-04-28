// src/pages/member/pole/PoleDashboard.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  AlertTriangle, 
  TrendingUp,
  Building2,
  ArrowRight
} from 'lucide-react';

interface PoleData {
  id: number;
  name: string;
  associations_count: number;
  total_youngs: number;
  active_mentorships: number;
  pending_matches: number;
  alert_count: number;
  recent_activities: Activity[];
}

interface Activity {
  id: number;
  type: 'match' | 'meeting' | 'alert' | 'registration';
  description: string;
  date: string;
  user_name: string;
}

export function PoleDashboard() {
  const { user, activeRole } = useAuth();
  const [poleData, setPoleData] = useState<PoleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoleData();
  }, []);

  const fetchPoleData = async () => {
    try {
      const res = await api.get(`/poles/${user?.pole_id}/dashboard/`);
      setPoleData(res.data);
    } catch (error) {
      console.error('Error fetching pole data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ora-blue"></div>
      </div>
    );
  }

  if (!poleData) return null;

  const isACP = activeRole === 'ACP';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{poleData.name}</h1>
          <p className="text-slate-600">
            {isACP ? 'Gestion du pôle' : 'Vue d\'ensemble de votre pôle'}
          </p>
        </div>
        {isACP && (
          <Link 
            to="/member/pole/kpi"
            className="flex items-center gap-2 px-4 py-2 bg-ora-blue text-white rounded-lg hover:bg-ora-dark transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Voir les KPIs
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Building2 className="w-6 h-6 text-blue-600" />}
          label="Associations"
          value={poleData.associations_count}
          color="blue"
        />
        <StatCard 
          icon={<Users className="w-6 h-6 text-green-600" />}
          label="Jeunes accompagnés"
          value={poleData.total_youngs}
          color="green"
        />
        <StatCard 
          icon={<UserCheck className="w-6 h-6 text-purple-600" />}
          label="Mentorats actifs"
          value={poleData.active_mentorships}
          color="purple"
        />
        <StatCard 
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          label="Alertes"
          value={poleData.alert_count}
          color="red"
          highlight={poleData.alert_count > 0}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Actions rapides</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard 
              icon={<Users className="w-8 h-8 text-ora-blue" />}
              title="Affectation"
              description={`${poleData.pending_matches} demandes en attente`}
              buttonText="Accéder aux affectations"
              to="/member/matching"
              color="blue"
            />
            
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Activité récente</h3>
            {poleData.recent_activities.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Aucune activité récente</p>
            ) : (
              <div className="space-y-3">
                {poleData.recent_activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-ora-blue to-ora-dark rounded-xl p-6 text-white">
            <h3 className="font-semibold text-lg mb-2">Besoin d'aide ?</h3>
            <p className="text-blue-100 text-sm mb-4">
              Consultez la documentation ou contactez la coordination nationale.
            </p>
            <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
              Contacter le CN
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Raccourcis</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/member/matching" className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg text-slate-700">
                  <span>Tableau de matching</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </li>
              {isACP && (
                <li>
                  <Link to="/member/pole/kpi" className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg text-slate-700">
                    <span>Indicateurs KPI</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared sub-components (can be extracted)
function StatCard({ icon, label, value, color, highlight }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl p-4 border ${highlight ? 'border-red-300 bg-red-50' : 'border-slate-200'} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 bg-${color}-100 rounded-lg`}>{icon}</div>
        {highlight && <span className="flex h-2 w-2 rounded-full bg-red-500"></span>}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-600">{label}</p>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, description, buttonText, to, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  to: string;
  color: string;
}) {
  return (
    <div className={`bg-${color}-50 rounded-xl p-6 border border-${color}-200`}>
      <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4`}>
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 mb-4">{description}</p>
      <Link 
        to={to}
        className={`inline-flex items-center gap-2 text-${color}-600 hover:text-${color}-700 font-medium text-sm`}
      >
        {buttonText}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const icons = {
    match: <UserCheck className="w-4 h-4 text-green-600" />,
    meeting: <Calendar className="w-4 h-4 text-blue-600" />,
    alert: <AlertTriangle className="w-4 h-4 text-red-600" />,
    registration: <Users className="w-4 h-4 text-purple-600" />
  };

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
      <div className="mt-0.5">{icons[activity.type]}</div>
      <div className="flex-1">
        <p className="text-sm text-slate-900">{activity.description}</p>
        <p className="text-xs text-slate-500 mt-1">
          Par {activity.user_name} • {new Date(activity.date).toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  );
}