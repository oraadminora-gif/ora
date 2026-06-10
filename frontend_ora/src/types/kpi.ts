export interface TrancheAge {
  moins_18:    number;
  annees_18_25: number;
  annees_26_29: number;
  plus_29:     number;
  inconnu:     number;
}

export interface DiplomaKPI {
  code:  string;
  label: string;
  count: number;
}

export interface FinancementKPI {
  financement__nom:  string;
  financement__code: string;
  financement__type: 'local' | 'national';
  count: number;
}

export interface FinancementParAssocKPI {
  financement__nom:                    string;
  mentorat__mentor__association__name: string | null;
  count: number;
}

export interface PoleKPI {
  // Demandes (filtrées par période)
  total_demandes:          number;
  filles:                  number;
  garcons:                 number;
  autres:                  number;
  filles_pct:              number;
  garcons_pct:             number;
  // File d'attente (absolu)
  demandes_en_attente:     number;
  urgences_non_traitees:   number;
  urgences_details:        { first_name: string; last_name: string; city: string; request_date: string }[];
  // Mentorats état actuel
  mentorats_actifs:        number;
  mentorats_pending:       number;
  alertes_rouges_actives:  number;
  mentorats_alertes_rouges: number; // legacy
  // Mentorats terminés (période)
  mentorats_closes:        number;
  mentorats_abandonnes:    number;
  // Taux
  taux_reussite:           number;
  taux_abandon:            number;
  taux_couverture:         number;
  taux_saturation:         number;
  // Mentors
  mentors_total:           number;
  mentors_inactifs?:       number;
  mentors_disponibles:     number;
  mentors_satures:         number;
  capacite_restante:       number;
  // Performance
  duree_moyenne:           number;
  heures_cumulees:         number;
  delai_moyen:             number;
  // APs
  aps_total:               number;
  aps_actifs:              number;
  // Breakdown
  mentors_par_association: { association__name: string; count: number }[];
  // Profil des jeunes
  tranches_age?:     TrancheAge;
  par_diplome?:      DiplomaKPI[];
  en_apprentissage?: number;
  en_recherche?:     number;
  // Financements
  financements_pole?:            FinancementKPI[];
  financements_par_association?: FinancementParAssocKPI[];
}

export interface NationalKPI {
  poles_total:      number;
  total_jeunes:     number;
  filles_pct:       number;
  garcons_pct:      number;
  mentorats_actifs: number;
  mentorats_closes: number;
  mentors_total:    number;
  mentors_dispo:    number;
  taux_reussite:    number;
}

export interface PoleSummaryKPI {
  id:                  number;
  name:                string;
  code:                string;
  total_demandes:      number;
  mentorats_actifs:    number;
  mentors_total:       number;
  alertes_rouges:      number;
  taux_reussite:       number;
  demandes_en_attente: number;
}

export interface NationalKPIDetailed extends NationalKPI {
  mentorats_pending:       number;
  mentorats_abandonnes:    number;
  mentors_satures:         number;
  mentors_inactifs?:       number;
  taux_abandon:            number;
  demandes_en_attente:     number;
  urgences_non_traitees:   number;
  alertes_rouges_actives:  number;
  par_pole:                PoleSummaryKPI[];
  // Performance globale
  duree_moyenne?:          number;
  delai_moyen?:            number;
  taux_couverture?:        number;
  taux_saturation?:        number;
  taux_attente?:           number;
  // Profil des jeunes (national)
  tranches_age?:           TrancheAge;
  par_diplome?:            DiplomaKPI[];
  en_apprentissage?:       number;
  en_recherche?:           number;
  taux_diplome?:           number;
  problematiques_top5?:    { code: string; count: number }[];
  // Financements (national)
  financements_national?:  FinancementKPI[];
  // Capacité disponible nationale
  capacite_totale_nationale?: number;
}
