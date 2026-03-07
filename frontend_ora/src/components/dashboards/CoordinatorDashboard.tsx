import { useState, useEffect } from 'react';
import { Users, UserCheck, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Stats {
  pendingApprentices: number;
  pendingMentors: number;
  activePairings: number;
}

export function CoordinatorDashboard() {
  const [stats, setStats] = useState<Stats>({
    pendingApprentices: 0,
    pendingMentors: 0,
    activePairings: 0,
  });

  const loadStats = async () => {
    // TODO: Replace with actual API calls when backend is ready
    // For now, using mock data as placeholders
    setStats({
      pendingApprentices: 0,
      pendingMentors: 0,
      activePairings: 0,
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Tableau de bord coordinateur</h1>
          <p className="text-slate-600 mt-2">Gérez les demandes et le matching</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.pendingApprentices}</span>
            </div>
            <h3 className="text-slate-600 font-medium">Demandes apprentis</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-ora-blue/20 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-ora-blue" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.pendingMentors}</span>
            </div>
            <h3 className="text-slate-600 font-medium">Candidatures mentors</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.activePairings}</span>
            </div>
            <h3 className="text-slate-600 font-medium">Binômes actifs</h3>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/admin/apprentices"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <Users className="w-8 h-8 text-ora-blue mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Demandes d'apprentis
            </h3>
            <p className="text-slate-600 text-sm">
              Gérer les demandes d'accompagnement
            </p>
          </Link>

          <Link
            to="/admin/mentors"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <UserCheck className="w-8 h-8 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Candidatures mentors
            </h3>
            <p className="text-slate-600 text-sm">
              Valider les profils mentors
            </p>
          </Link>

          <Link
            to="/admin/pairings"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <LinkIcon className="w-8 h-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Créer un binôme
            </h3>
            <p className="text-slate-600 text-sm">
              Matcher un mentor avec un apprenti
            </p>
          </Link>

          <Link
            to="/admin/pairings?filter=active"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <Users className="w-8 h-8 text-ora-blue mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Suivre les binômes
            </h3>
            <p className="text-slate-600 text-sm">
              Voir et suivre tous les binômes actifs
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
