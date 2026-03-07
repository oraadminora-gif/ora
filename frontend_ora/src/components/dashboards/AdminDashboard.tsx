import { useState, useEffect } from 'react';
import { Users, UserCheck, Link as LinkIcon, TrendingUp, FileText, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Stats {
  totalApprentices: number;
  totalMentors: number;
  activePairings: number;
  pendingApplications: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalApprentices: 0,
    totalMentors: 0,
    activePairings: 0,
    pendingApplications: 0,
  });

  const loadStats = async () => {
    // TODO: Replace with actual API calls when backend is ready
    // For now, using mock data as placeholders
    setStats({
      totalApprentices: 0,
      totalMentors: 0,
      activePairings: 0,
      pendingApplications: 0,
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Tableau de bord administrateur</h1>
          <p className="text-slate-600 mt-2">Vue d'ensemble de la plateforme</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-ora-blue/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-ora-blue" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.totalApprentices}</span>
            </div>
            <h3 className="text-slate-600 font-medium">Apprentis inscrits</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.totalMentors}</span>
            </div>
            <h3 className="text-slate-600 font-medium">Mentors actifs</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.activePairings}</span>
            </div>
            <h3 className="text-slate-600 font-medium">Mentorats actifs</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.pendingApplications}</span>
            </div>
            <h3 className="text-slate-600 font-medium">Demandes en attente</h3>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/admin/apprentices"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <Users className="w-8 h-8 text-ora-blue mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Gestion des apprentis
            </h3>
            <p className="text-slate-600 text-sm">
              Voir et gérer toutes les demandes d'accompagnement
            </p>
          </Link>

          <Link
            to="/admin/mentors"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <UserCheck className="w-8 h-8 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Gestion des mentors
            </h3>
            <p className="text-slate-600 text-sm">
              Valider et gérer les candidatures mentors
            </p>
          </Link>

          <Link
            to="/admin/pairings"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <LinkIcon className="w-8 h-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Binômes & Matching
            </h3>
            <p className="text-slate-600 text-sm">
              Créer et suivre les binômes mentor-apprenti
            </p>
          </Link>

          <Link
            to="/admin/articles"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <FileText className="w-8 h-8 text-ora-blue mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Actualités
            </h3>
            <p className="text-slate-600 text-sm">
              Gérer les articles et actualités
            </p>
          </Link>

          <Link
            to="/admin/partners"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <Building className="w-8 h-8 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Partenaires
            </h3>
            <p className="text-slate-600 text-sm">
              Gérer les partenaires et implantations
            </p>
          </Link>

          <Link
            to="/admin/testimonials"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <Users className="w-8 h-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Témoignages
            </h3>
            <p className="text-slate-600 text-sm">
              Gérer les témoignages publiés
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
