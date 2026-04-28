import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Calendar, Clock } from 'lucide-react';

interface Application {
  id: string;
  status: string;
  needs: string[];
  created_at: string;
}

interface Pairing {
  id: string;
  start_date: string;
  status: string;
  objectives: string;
  meeting_frequency: string;
  mentor: {
    first_name: string;
    last_name: string;
  };
}

export function MenteeDashboard() {
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;

    // TODO: Replace with actual API calls when backend is ready
    // For now, using mock data as placeholders
    setApplication(null);
    setPairing(null);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

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

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Aucune demande en cours
            </h2>
            <p className="text-slate-600 mb-6">
              Vous n'avez pas encore fait de demande d'accompagnement
            </p>
            <Link
              to="/apprentis/inscription"
              className="inline-block px-6 py-3 bg-ora-blue text-white rounded-lg font-semibold hover:bg-ora-dark"
            >
              Faire une demande
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Mon espace</h1>
          <p className="text-slate-600 mt-2">Suivi de mon accompagnement</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Ma demande</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              application.status === 'new' ? 'bg-orange-100 text-orange-700' :
              application.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
              application.status === 'matched' ? 'bg-green-100 text-green-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {application.status === 'new' ? 'En attente' :
               application.status === 'in_progress' ? 'En cours de traitement' :
               application.status === 'matched' ? 'Binôme créé' : 'Clôturée'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-900 mb-1">Date de demande</p>
              <p className="text-slate-600">
                {new Date(application.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-900 mb-2">Mes besoins</p>
              <div className="flex flex-wrap gap-2">
                {application.needs.map((need, idx) => (
                  <span key={idx} className="px-3 py-1 bg-ora-blue/20 text-ora-blue rounded-full text-sm">
                    {need}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {pairing ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Mon mentor</h2>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-ora-blue/20 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-ora-blue" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {pairing.mentor.first_name} {pairing.mentor.last_name}
                </h3>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                  pairing.status === 'active' ? 'bg-green-100 text-green-700' :
                  pairing.status === 'paused' ? 'bg-orange-100 text-orange-700' :
                  pairing.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {pairing.status === 'active' ? 'Actif' :
                   pairing.status === 'paused' ? 'En pause' :
                   pairing.status === 'completed' ? 'Terminé' : 'Annulé'}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Début du mentorat</p>
                  <p className="text-sm text-slate-600">
                    {new Date(pairing.start_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Fréquence des rencontres</p>
                  <p className="text-sm text-slate-600">
                    {pairing.meeting_frequency || 'À définir ensemble'}
                  </p>
                </div>
              </div>
            </div>

            {pairing.objectives && (
              <div className="bg-ora-blue/20 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-900 mb-1">Objectifs</p>
                <p className="text-sm text-slate-600">{pairing.objectives}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Recherche de mentor en cours
            </h3>
            <p className="text-slate-600">
              Nous étudions ton profil pour te trouver le mentor le plus adapté. Tu seras contacté(e) très prochainement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
