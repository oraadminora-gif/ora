// src/pages/member/mentor/MentorDashboard.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { MentorProfileCard } from '../../../components/mentor/MentorProfileCard';
import { MentorAvailabilityCard } from '../../../components/mentor/MentorAvailabilityCard';

export interface Department {
  id: number; code: string; name: string;
}

export interface MentorInfo {
  id: number; first_name: string; last_name: string;
  email: string; phone: string; city: string; code_postal: string;
  department: Department | null;
  pole: string | null; association: string | null;
  is_trained: boolean;
  observations: string;
  capacite: { max: number; disponible: number; utilisee: number };
}

export interface SuiviRencontre {
  id: number;
  date_rencontre: string;
  duree_minutes: number;
  type_rencontre: string;
  type_rencontre_label: string;
  objectifs_atteints: boolean;
  notes: string;
  created_at: string;
}

export interface SuiviStats {
  nb_rencontres: number;
  total_minutes: number;
  total_heures: number;
}

export interface MentoratActif {
  id: number;
  jeune: {
    id: number; name: string; first_name: string; last_name: string;
    email: string; phone: string;
    ville: string; commune: string; code_postal: string;
    department: string | null; gender: string; gender_label: string;
    birth_date: string; needs_description: string;
    request_date: string;
    diplome_prepare: string; diplome_label: string;
    situation: string; situation_label: string;
    etablissement_id: number | null; nom_etablissement: string;
  };
  date_debut: string;
  expected_end_date: string | null;
  ap_referent: string;
  alerte_rouge: boolean;
  notes_suivi: string;
  problematiques: string[];
  duree_mois: number;
  cloture_en_attente: boolean;
  cloture_action_demandee: 'CLOSED' | 'ABORTED' | '';
  cloture_reason_demandee: string;
  closure_reason_choices: Array<{ value: string; label: string }>;
  problematiques_choices: Array<{ value: string; label: string }>;
  nb_rencontres: number;
  nb_heures: number;
  type_mentorat: string;
  objectif_mentor: string;
  bilan_suivi: string;
  suivis: SuiviRencontre[];
  suivi_stats: SuiviStats;
}

export interface EvaluationRecu {
  rating_objectifs: number | null;
  rating_accompagnement: number | null;
  rating_recommandation: number | null;
  comment: string;
  submitted_at: string;
}

export interface MentoratHistorique {
  id: number; jeune: string;
  statut_final: 'CLOSED' | 'ABORTED';
  date_fin: string | null; closure_reason: string;
  message_cloture: string;
  objectif_mentor: string;
  bilan_suivi: string;
  suivi_stats: SuiviStats;
  evaluation: EvaluationRecu | null;
}

export interface DashboardData {
  mentor: MentorInfo;
  mentorats: { actifs: MentoratActif[]; historique: MentoratHistorique[] };
}

interface ApiError { response?: { data?: { error?: string } } }

export function MentorDashboard() {
  const { loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!authLoading) fetchDashboard(); }, [authLoading]);

  const fetchDashboard = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get<DashboardData>('/mentor/dashboard/');
      setData(res.data);
    } catch (err) {
      setError((err as ApiError).response?.data?.error ?? 'Erreur lors du chargement');
    } finally { setLoading(false); }
  };

  const handleProfileUpdate  = (u: Partial<MentorInfo>) => { if (data) setData({ ...data, mentor: { ...data.mentor, ...u } }); };
  const handleCapaciteUpdate = (c: MentorInfo['capacite']) => { if (data) setData({ ...data, mentor: { ...data.mentor, capacite: c } }); };

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
      <button onClick={fetchDashboard} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Réessayer</button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MentorProfileCard mentor={data.mentor} onUpdate={handleProfileUpdate} />
      <MentorAvailabilityCard capacite={data.mentor.capacite} onUpdate={handleCapaciteUpdate} />
    </div>
  );
}
