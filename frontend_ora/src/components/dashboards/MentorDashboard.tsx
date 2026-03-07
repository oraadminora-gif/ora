import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Calendar, Clock } from 'lucide-react';

interface Pairing {
  id: string;
  start_date: string;
  status: string;
  objectives: string;
  meeting_frequency: string;
  apprentice: {
    first_name: string;
    last_name: string;
    age: number;
    needs: string[];
  };
}

export function MentorDashboard() {
  const { user } = useAuth();
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPairings = async () => {
    if (!user) return;

    // TODO: Replace with actual API call when backend is ready
    // For now, using mock data as placeholder
    setPairings([]);
    setLoading(false);
  };

  useEffect(() => {
    loadPairings();
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

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Mon espace mentor</h1>
          <p className="text-slate-600 mt-2">Suivez vos accompagnements</p>
        </div>

        {pairings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Aucun accompagnement en cours
            </h3>
            <p className="text-slate-600">
              Vous serez notifié dès qu'un apprenti vous sera assigné
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pairings.map((pairing) => (
              <div key={pairing.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">
                      {pairing.apprentice.first_name} {pairing.apprentice.last_name}
                    </h3>
                    <p className="text-slate-600">{pairing.apprentice.age} ans</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                      <p className="text-sm font-medium text-slate-900">Fréquence</p>
                      <p className="text-sm text-slate-600">
                        {pairing.meeting_frequency || 'À définir'}
                      </p>
                    </div>
                  </div>
                </div>

                {pairing.objectives && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-900 mb-1">Objectifs</p>
                    <p className="text-sm text-slate-600">{pairing.objectives}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-slate-900 mb-2">Besoins identifiés</p>
                  <div className="flex flex-wrap gap-2">
                    {pairing.apprentice.needs.map((need, idx) => (
                      <span key={idx} className="px-3 py-1 bg-ora-blue/20 text-ora-blue rounded-full text-sm">
                        {need}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
