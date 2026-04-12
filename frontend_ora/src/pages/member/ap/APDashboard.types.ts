// src/pages/member/ap/APDashboard.types.ts

export type AlertLevel = 'ok' | 'warn' | 'alert';

export interface APAnimateur {
  id: number;
  first_name: string;
  last_name: string;
  role: 'AP' | 'ACP';
  association: { id: number; name: string; code: string };
  pole: { id: number | null; name: string | null; code: string | null };
}

export interface APStats {
  total_mentors: number;
  mentors_disponibles: number;
  mentorats_actifs: number;
  alertes_rouges: number;
  mentors_inactifs: number;
  mes_mentorats_actifs: number;
  mes_mentorats_clotures: number;
  mes_mentorats_abandonnes: number;
  mes_mentorats_total: number;
  clotures_en_attente: number;
}

export interface APInactivite {
  date: string | null;
  jours: number | null;
  level: AlertLevel;
}

export interface APSuiviStats {
  nb_rencontres: number;
  total_minutes: number;
  total_heures: number;
  last_rencontre: string | null;
}

export interface APMentoratActif {
  id: number;
  status: string;
  date_debut: string | null;
  alerte_rouge: boolean;
  inactivite: APInactivite;
  jeune: {
    id: number;
    name: string;
    email: string;
    phone: string;
    city: string;
    needs_description: string;
    urgency_level: number;
  } | null;
  suivi_stats: APSuiviStats;
}

export interface APMentor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  is_trained: boolean;
  is_active: boolean;
  capacite: { max: number; disponible: number; utilisee: number };
  derniere_activite: APInactivite;
  mentorats_actifs: APMentoratActif[];
  nb_mentorats_actifs: number;
  nb_mentorats_termines: number;
}

export interface APMentorHistorique {
  id: number;
  jeune: string;
  statut_final: 'CLOSED' | 'ABORTED';
  date_fin: string | null;
  closure_reason: string;
  suivi_stats: APSuiviStats;
}

export interface APMesMenutorat {
  id: number;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'ABORTED';
  status_label: string;
  assigned_at: string | null;
  alerte_rouge: boolean;
  inactivite: APInactivite;
  mentor: {
    id: number;
    name: string;
    association: string;
    city: string;
    is_trained: boolean;
  };
  jeune: {
    name: string;
    city: string;
    diplome_label: string;
    situation: string;
    situation_label: string;
    etablissement_id: number | null;
    nom_etablissement: string;
  } | null;
  suivi_stats: APSuiviStats;
  // Demande de clôture en attente
  cloture_en_attente: boolean;
  cloture_action_demandee: 'CLOSED' | 'ABORTED' | '';
  cloture_reason_demandee: string;
  cloture_message_demandee: string;
}

export interface APDashboardData {
  animateur: APAnimateur;
  stats: APStats;
  mentors: APMentor[];
  clotures_en_attente: APMesMenutorat[];
}

export interface APMesMentoratPage {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  results: APMesMenutorat[];
}

export interface APMentorDetail {
  mentor: APMentor;
  historique: APMentorHistorique[];
}
