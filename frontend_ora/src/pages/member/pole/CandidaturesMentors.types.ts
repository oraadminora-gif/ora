// src/pages/member/pole/CandidaturesMentors.types.ts
export interface CandidatureMentor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  code_postal: string;
  commune: string;
  pole_id: number | null;
  pole_name: string | null;
  association_id: number | null;
  association_name: string | null;
  experience_pro: string;
  domaines: string[];
  disponibilite: string;
  motivation: string;
  statut: 'PENDING' | 'VALIDATED' | 'REJECTED';
  statut_label: string;
  notes_rejet: string;
  validated_by: string | null;
  validated_at: string | null;
  mentor_id: number | null;
  created_at: string;
}

export interface AssociationOption {
  id: number;
  name: string;
  code: string;
}
