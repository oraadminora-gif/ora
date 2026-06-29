// src/pages/member/mentor/MentorMentorats.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { Loader2, AlertCircle, Building2, Users } from 'lucide-react';
import { ActiveMentorshipsCard } from '../../../components/mentor/ActiveMentorshipsCard';
import { MentorshipHistoryCard } from '../../../components/mentor/MentorshipHistoryCard';
import type { DashboardData } from './MentorDashboard';

interface ApiError { response?: { data?: { error?: string } } }

export function MentorMentorats() {
  const { loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!authLoading) fetchData(); }, [authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get<DashboardData>('/mentor/dashboard/');
      setData(res.data);
    } catch (err) {
      setError((err as ApiError).response?.data?.error ?? 'Erreur lors du chargement');
    } finally { setLoading(false); }
  };

  if (authLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-ora-blue" />
    </div>
  );

  if (error || !data) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">Erreur</h3>
      <p className="text-red-700 mb-4">{error}</p>
      <button onClick={fetchData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Réessayer</button>
    </div>
  );

  const { mentor, mentorats } = data;

  return (
    <div className="space-y-6">
      {/* En-tête mentor */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-ora-blue flex items-center justify-center shadow-md shadow-ora-blue/20 shrink-0">
          <span className="text-white font-black text-base">
            {mentor.first_name.charAt(0)}{mentor.last_name.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-slate-900">
            {mentor.first_name} {mentor.last_name}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {mentor.pole && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Building2 className="w-3 h-3 text-slate-300" />
                {mentor.pole}
              </span>
            )}
            {mentor.association && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Users className="w-3 h-3 text-slate-300" />
                {mentor.association}
              </span>
            )}
          </div>
        </div>
      </div>

      <ActiveMentorshipsCard
        mentorats={mentorats.actifs}
        mentorName={`${mentor.first_name} ${mentor.last_name}`}
        onClosed={fetchData}
      />
      <MentorshipHistoryCard mentorats={mentorats.historique} />
    </div>
  );
}
