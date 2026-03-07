// src/pages/member/association/APDashboard.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Association {
  id: number;
  name: string;
  city: string;
  youngs_count: number;
  active_mentorships: number;
  pending_youngs: number;
  next_meeting?: string;
}

interface Young {
  id: number;
  first_name: string;
  last_name: string;
  status: 'pending' | 'matched' | 'in_progress' | 'completed';
  mentor_name?: string;
  start_date?: string;
  progress: number;
}

export function APDashboard() {
  const { user } = useAuth();
  const [association, setAssociation] = useState<Association | null>(null);
  const [youngs, setYoungs] = useState<Young[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assocRes, youngsRes] = await Promise.all([
        api.get('/associations/me/'),
        api.get('/associations/youngs/')
      ]);
      setAssociation(assocRes.data);
      setYoungs(youngsRes.data);
    } catch (error) {
      console.error('Error fetching AP data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !association) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ora-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{association.name}</h1>
        <p className="text-slate-600">{association.city} • Espace Apprenti d'Auteuil</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          icon={<Users className="w-6 h-6 text-blue-600" />}
          label="Jeunes inscrits"
          value={association.youngs_count}
        />
        <StatCard 
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          label="Mentorats actifs"
          value={association.active_mentorships}
        />
        <StatCard 
          icon={<Clock className="w-6 h-6 text-orange-600" />}
          label="En attente de mentor"
          value={association.pending_youngs}
          alert={association.pending_youngs > 0}
        />
      </div>

      {/* Youngs List */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Mes jeunes</h2>
          <button className="text-sm text-ora-blue hover:text-ora-dark font-medium">
            Voir tout →
          </button>
        </div>
        
        <div className="divide-y divide-slate-200">
          {youngs.map((young) => (
            <YoungRow key={young.id} young={young} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionCard 
          icon={<FileText className="w-6 h-6" />}
          title="Inscrire un nouveau jeune"
          description="Ajouter un candidat au programme"
          onClick={() => {/* TODO */}}
        />
        <ActionCard 
          icon={<MessageCircle className="w-6 h-6" />}
          title="Contacter le Chargé de Pôle"
          description="Demander de l'aide ou signaler un problème"
          onClick={() => {/* TODO */}}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, alert }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl p-5 border ${alert ? 'border-orange-300 bg-orange-50' : 'border-slate-200'} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="p-2 bg-slate-100 rounded-lg">{icon}</div>
        {alert && <AlertCircle className="w-5 h-5 text-orange-500" />}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-600">{label}</p>
      </div>
    </div>
  );
}

function YoungRow({ young }: { young: Young }) {
  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    matched: { label: 'Matché', color: 'bg-blue-100 text-blue-700' },
    in_progress: { label: 'En cours', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Terminé', color: 'bg-slate-100 text-slate-700' },
  };

  const status = statusConfig[young.status];

  return (
    <div className="px-6 py-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ora-blue rounded-full flex items-center justify-center text-white font-semibold">
            {young.first_name.charAt(0)}{young.last_name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900">{young.first_name} {young.last_name}</p>
            {young.mentor_name && (
              <p className="text-sm text-slate-500">Mentor: {young.mentor_name}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {young.status === 'in_progress' && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${young.progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-600">{young.progress}%</span>
            </div>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, description, onClick }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:border-ora-blue hover:shadow-md transition-all text-left"
    >
      <div className="p-3 bg-ora-blue/10 text-ora-blue rounded-lg">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      </div>
    </button>
  );
}