// src/pages/member/acp/ACPDashboard.types.ts

export interface ACPCoordinateur {
  id: number | null;
  first_name: string;
  last_name: string;
  role: 'ACP';
  pole: {
    id: number;
    name: string;
    code: string;
    villes: string[];
  };
}

export interface ACPStats {
  total_associations: number;
  total_ap: number;
  total_mentors: number;
  mentors_disponibles: number;
  mentorats_actifs: number;
  alertes_rouges: number;
  mentors_inactifs: number;
  demandes_en_attente: number;
}

export interface ACPAssociationAP {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface ACPAssociationStats {
  total_mentors: number;
  mentors_disponibles: number;
  capacite_dispo: number;
  mentorats_actifs: number;
  alertes_rouges: number;
  mentors_inactifs: number;
}

export interface ACPAssociation {
  id: number;
  name: string;
  code: string;
  ap: ACPAssociationAP | null;
  stats: ACPAssociationStats;
}

export interface ACPDemande {
  id: number;
  nom: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  gender_label: string;
  commune: string;
  code_postal: string;
  city: string;
  needs_description: string;
  status: 'NEW' | 'PENDING';
  request_date: string;
  nom_etablissement: string;
  diplome_prepare: string;
  diplome_label: string;
  situation: string;
  situation_label: string;
  raison_transfert?: string;
}

export interface ACPDashboardData {
  coordinateur: ACPCoordinateur;
  stats: ACPStats;
  associations: ACPAssociation[];
  demandes_en_attente: ACPDemande[];
}
