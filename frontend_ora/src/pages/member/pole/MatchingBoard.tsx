// src/pages/member/pole/MatchingBoard.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../services/api';
import {
  Users, MapPin, Flame, Building2, CheckCircle,
  Loader2, AlertCircle, Clock, ArrowRight, X, Star,
  GraduationCap, Trophy, LayoutList, Shuffle, Search,
  UserPlus, Scale,
} from 'lucide-react';

// Constante module-level pour éviter Date.now() dans le render (impure)
const NOW_MS = new Date().getTime();

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Demande {
  id: number;
  jeune: string;
  age: number | null;
  ville: string;
  urgence: number;
  date_demande: string;
  besoins: string;
  nom_etablissement: string;
  diplome_prepare: string;
  diplome_label: string;
  situation: string;
  situation_label: string;
  raison_transfert?: string;
}

interface MentorSuggestion {
  mentor_id: number;
  mentor_name: string;
  association: string;
  association_id: number;
  city: string;
  department: string | null;
  is_trained: boolean;
  training_date: string | null;   // ISO date ou null
  disponibilite_reelle: number;
  max_capacity: number;
  nb_termines: number;
  score: number;
  city_match: boolean;
  department_match: boolean;
  distance_km: number | null;
  priority: 'high' | 'medium' | 'low';
  // Équité associations
  equite_score:    number;
  assoc_count:     number;   // mentorats actifs de son association
  assoc_min_count: number;   // minimum dans le pôle
  // Formation
  formation_score: number;
}

interface SuggestionsData {
  demande: {
    id: number;
    jeune: string;
    nom_etablissement: string;
    diplome_prepare: string;
    diplome_label: string;
    situation: string;
    situation_label: string;
    pole: string | null;
  };
  suggestions: MentorSuggestion[];
  stats: { total_disponibles: number; autres_associations: number };
}

interface MentorTableau {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  department: string | null;
  association: string;
  association_id: number;
  is_trained: boolean;
  disponibilite: number;
  capacite_max: number;
  est_sature: boolean;
  nb_actifs: number;
  nb_termines: number;
}

interface Animateur {
  id: number;
  name: string;
  association: string;
  association_id: number;
  is_coordinator: boolean;
  role_label: 'AP' | 'ACP';
}

interface ApiError { response?: { data?: { error?: string; message?: string; code?: string } } }

// ─────────────────────────────────────────────────────────────
// CONFIG URGENCE
// ─────────────────────────────────────────────────────────────
const URGENCE: Record<number, { label: string; color: string; bg: string; border: string }> = {
  5: { label: 'Très urgent', color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-200'    },
  4: { label: 'Urgent',      color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200' },
  3: { label: 'Modéré',      color: 'text-amber-700',  bg: 'bg-amber-100',  border: 'border-amber-200'  },
  2: { label: 'Faible',      color: 'text-slate-600',  bg: 'bg-slate-100',  border: 'border-slate-200'  },
  1: { label: 'Très faible', color: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-100'  },
};

// ─────────────────────────────────────────────────────────────
// PETITS COMPOSANTS RÉUTILISABLES
// ─────────────────────────────────────────────────────────────
function UrgenceBadge({ level }: { level: number }) {
  const cfg = URGENCE[level] ?? URGENCE[1];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Flame className="w-2.5 h-2.5" />{cfg.label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  // Nouveau max : 370 pts
  const color = score >= 200
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : score >= 120
      ? 'text-sky-700 bg-sky-50 border-sky-200'
      : 'text-slate-500 bg-slate-50 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      <Trophy className="w-2.5 h-2.5" />{score} pts
    </span>
  );
}

function EquiteBadge({ assocCount, minCount }: { assocCount: number; minCount: number }) {
  const isMin = assocCount === minCount;
  const delta = assocCount - minCount;
  if (isMin) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-violet-700">
      <Scale className="w-2.5 h-2.5" />Équité ✓ ({assocCount} actif{assocCount !== 1 ? 's' : ''})
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-orange-500">
      <Scale className="w-2.5 h-2.5" />+{delta} vs min ({assocCount} actif{assocCount !== 1 ? 's' : ''})
    </span>
  );
}

function FormationBadge({ isTraining, trainingDate, formationScore }: {
  isTraining: boolean; trainingDate: string | null; formationScore: number;
}) {
  if (!isTraining) return null;
  let label = 'Formé';
  let cls   = 'text-amber-600';
  if (trainingDate) {
    const months = Math.floor(
      (NOW_MS - new Date(trainingDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (months < 6)  { label = 'Formé récemment (<6 mois)';  cls = 'text-emerald-600'; }
    else if (months < 12) { label = 'Formé (<12 mois)';      cls = 'text-emerald-500'; }
    else if (months < 24) { label = 'Formé (<2 ans)';         cls = 'text-amber-600'; }
    else { label = `Formé (${Math.floor(months/12)} ans)`; cls = 'text-slate-500'; }
  }
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${cls}`}>
      <GraduationCap className="w-2.5 h-2.5" />{label} · +{formationScore}pts
    </span>
  );
}

function MatchReasons({ m }: { m: MentorSuggestion }) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1.5">

      {/* Équité association — critère principal */}
      <EquiteBadge assocCount={m.assoc_count} minCount={m.assoc_min_count} />

      {/* Distance / géographie */}
      {m.distance_km != null ? (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
          m.distance_km < 20 ? 'text-emerald-600' : m.distance_km < 100 ? 'text-sky-600' : 'text-slate-500'
        }`}>
          <MapPin className="w-2.5 h-2.5" />
          {m.distance_km < 1 ? '< 1 km' : `${m.distance_km.toFixed(0)} km`}
        </span>
      ) : m.city_match ? (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
          <MapPin className="w-2.5 h-2.5" />Même ville
        </span>
      ) : m.department_match ? (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-sky-600">
          <MapPin className="w-2.5 h-2.5" />Même département
        </span>
      ) : null}

      {/* Formation récente */}
      <FormationBadge
        isTraining={m.is_trained}
        trainingDate={m.training_date}
        formationScore={m.formation_score}
      />

      {/* Expérience */}
      {m.nb_termines > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500">
          <Trophy className="w-2.5 h-2.5" />
          {m.nb_termines} terminé{m.nb_termines > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CARTE DEMANDE (colonne gauche)
// ─────────────────────────────────────────────────────────────
function DemandeCard({ demande, selected, onClick }: {
  demande: Demande; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
        selected
          ? 'border-ora-blue bg-ora-blue/5 shadow-sm ring-1 ring-ora-blue/20'
          : `${demande.urgence >= 4 ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'} hover:border-slate-300 hover:shadow-sm`
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{demande.jeune}</p>
          {demande.age && <p className="text-[11px] text-slate-400">{demande.age} ans</p>}
        </div>
        {selected && (
          <span className="shrink-0 w-4 h-4 rounded-full bg-ora-blue flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <UrgenceBadge level={demande.urgence} />
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <MapPin className="w-3 h-3" />{demande.ville}
        </span>
      </div>
      {(demande.diplome_label || demande.situation_label) && (
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {demande.diplome_label && (
            <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full font-medium truncate max-w-[120px]">
              {demande.diplome_label}
            </span>
          )}
          {demande.situation_label && (
            <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-full truncate max-w-[100px]">
              {demande.situation_label}
            </span>
          )}
        </div>
      )}
      {demande.nom_etablissement && (
        <div className="flex items-center gap-1 mb-1.5 text-[11px] text-slate-400">
          <Building2 className="w-3 h-3 shrink-0" />
          <span className="truncate">{demande.nom_etablissement}</span>
        </div>
      )}
      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{demande.besoins}</p>
      <p className="text-[10px] text-slate-300 mt-2">
        {new Date(demande.date_demande).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
      </p>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// CARTE SUGGESTION IA
// ─────────────────────────────────────────────────────────────
function SuggestionCard({ mentor, selected, onClick }: {
  mentor: MentorSuggestion; selected: boolean; onClick: () => void;
}) {
  const pct = mentor.max_capacity > 0
    ? ((mentor.max_capacity - mentor.disponibilite_reelle) / mentor.max_capacity) * 100
    : 0;
  const initials = mentor.mentor_name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
        selected
          ? 'border-ora-blue bg-blue-50/60 shadow-md'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5 ${
          mentor.city_match || (mentor.distance_km !== null && mentor.distance_km !== undefined && mentor.distance_km < 20)
            ? 'bg-emerald-500'
            : mentor.department_match || (mentor.distance_km !== null && mentor.distance_km !== undefined && mentor.distance_km < 100)
              ? 'bg-sky-500'
              : 'bg-slate-400'
        }`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900">{mentor.mentor_name}</p>
            <ScoreBadge score={mentor.score} />
            {selected && <CheckCircle className="w-4 h-4 text-ora-blue" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
            <span>{mentor.association}</span>
            {mentor.city && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />{mentor.city}
              </span>
            )}
          </div>
          <MatchReasons m={mentor} />
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-sm font-black ${mentor.disponibilite_reelle > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {mentor.disponibilite_reelle} dispo.
          </p>
          <p className="text-[10px] text-slate-400">/ {mentor.max_capacity}</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-400' : pct >= 60 ? 'bg-orange-400' : 'bg-emerald-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 text-right">{Math.round(pct)}% utilisé</p>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// CARTE MENTOR (recherche libre)
// ─────────────────────────────────────────────────────────────
function ManualMentorCard({ mentor, selected, onClick }: {
  mentor: MentorTableau; selected: boolean; onClick: () => void;
}) {
  const initials = mentor.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const pct = mentor.capacite_max > 0
    ? (mentor.nb_actifs / mentor.capacite_max) * 100
    : 0;

  return (
    <button
      onClick={onClick}
      disabled={mentor.est_sature}
      className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-150 ${
        mentor.est_sature
          ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
          : selected
            ? 'border-ora-blue bg-blue-50/60 shadow-md'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${
          mentor.est_sature ? 'bg-slate-300' : 'bg-violet-500'
        }`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-slate-900">{mentor.name}</p>
            {mentor.is_trained && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <GraduationCap className="w-2 h-2" />Formé
              </span>
            )}
            {selected && <CheckCircle className="w-4 h-4 text-ora-blue" />}
          </div>
          <p className="text-[11px] text-slate-400">{mentor.association}{mentor.city ? ` · ${mentor.city}` : ''}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-sm font-black ${mentor.disponibilite > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {mentor.disponibilite}<span className="text-[10px] font-normal text-slate-400">/{mentor.capacite_max}</span>
          </p>
          <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className={`h-full rounded-full ${mentor.est_sature ? 'bg-red-400' : 'bg-emerald-400'}`}
              style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// PANEL AP — sélection de l'AP qui accompagnera le mentorat
// ─────────────────────────────────────────────────────────────
function APSelector({ animateurs, selectedApId, onSelect, required }: {
  animateurs: Animateur[];
  selectedApId: number | null;
  onSelect: (id: number | null) => void;
  required?: boolean;
}) {
  if (animateurs.length === 0) {
    return (
      <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
        Aucun AP disponible dans ce pôle.
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-slate-600">
        Animateur accompagnateur{required ? ' *' : ' (optionnel — auto-assigné si absent)'}
      </p>
      <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto">
        {!required && (
          <button
            onClick={() => onSelect(null)}
            className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
              selectedApId === null
                ? 'border-slate-400 bg-slate-100 text-slate-700 font-semibold'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-400'
            }`}
          >
            Auto (par association du mentor)
          </button>
        )}
        {animateurs.map(ap => (
          <button
            key={ap.id}
            onClick={() => onSelect(ap.id)}
            className={`text-left px-3 py-2 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 ${
              selectedApId === ap.id
                ? 'border-violet-400 bg-violet-50 text-violet-800 font-semibold'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
            }`}
          >
            <span>
              {ap.name}
              <span className="text-slate-400 ml-1">· {ap.association}</span>
            </span>
            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              ap.is_coordinator
                ? 'bg-violet-100 text-violet-700'
                : 'bg-sky-100 text-sky-700'
            }`}>
              {ap.role_label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ONGLET TABLEAU DES MENTORS
// ─────────────────────────────────────────────────────────────
function MentorsTableau({ mentors, loading, error, demandes, onAssignClick }: {
  mentors: MentorTableau[];
  loading: boolean;
  error: string | null;
  demandes: Demande[];
  onAssignClick: (mentor: MentorTableau) => void;
}) {
  const [search, setSearch] = useState('');
  const [filterSature, setFilterSature] = useState<'all' | 'dispo' | 'sature'>('all');

  const filtered = mentors.filter(m => {
    const matchSearch = !search.trim()
      || `${m.name} ${m.city} ${m.association}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterSature === 'all'
      ? true
      : filterSature === 'dispo' ? !m.est_sature : m.est_sature;
    return matchSearch && matchFilter;
  });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
      <p className="text-sm text-red-700">{error}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nom, ville, association…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'dispo', 'sature'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterSature(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filterSature === f
                  ? f === 'dispo'   ? 'bg-emerald-600 text-white border-emerald-600'
                  : f === 'sature'  ? 'bg-red-600 text-white border-red-600'
                  :                   'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {f === 'all'    ? `Tous (${mentors.length})`
               : f === 'dispo'  ? `Dispo (${mentors.filter(m => !m.est_sature).length})`
               :                  `Complets (${mentors.filter(m => m.est_sature).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Info assignation directe */}
      {demandes.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-xl text-xs text-violet-700">
          <UserPlus className="w-3.5 h-3.5 shrink-0" />
          Cliquez sur <strong>"Assigner"</strong> pour attribuer directement un mentor à une demande en attente.
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mentor</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Association</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Localisation</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dispo.</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actifs</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Terminés</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-400">
                    Aucun mentor trouvé
                  </td>
                </tr>
              ) : filtered.map(m => (
                <tr key={m.id} className={`hover:bg-slate-50/50 transition-colors ${m.est_sature ? 'opacity-60' : ''}`}>
                  {/* Mentor */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                        m.est_sature ? 'bg-slate-300' : 'bg-ora-blue'
                      }`}>
                        {m.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{m.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {m.is_trained && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <GraduationCap className="w-2 h-2" />Formé
                            </span>
                          )}
                          {m.est_sature && (
                            <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">
                              Complet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Association */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-slate-600 text-sm">{m.association}</p>
                  </td>
                  {/* Localisation */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-sm text-slate-500">
                      {m.city && <p>{m.city}</p>}
                      {m.department && <p className="text-[11px] text-slate-400">{m.department}</p>}
                    </div>
                  </td>
                  {/* Disponibilité */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-base font-black ${m.disponibilite > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m.disponibilite}<span className="text-xs font-normal text-slate-400">/{m.capacite_max}</span>
                      </span>
                      <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${m.est_sature ? 'bg-red-400' : 'bg-emerald-400'}`}
                          style={{ width: `${(m.nb_actifs / Math.max(m.capacite_max, 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  {/* Actifs */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-bold text-violet-600">{m.nb_actifs}</span>
                  </td>
                  {/* Terminés */}
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-sm text-slate-400">{m.nb_termines}</span>
                  </td>
                  {/* Action */}
                  <td className="px-4 py-3 text-center">
                    {!m.est_sature && demandes.length > 0 ? (
                      <button
                        onClick={() => onAssignClick(m)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                      >
                        <UserPlus className="w-3 h-3" />Assigner
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
type Tab = 'matching' | 'mentors';
type SuggestionMode = 'ai' | 'manual';

export function MatchingBoard() {
  const [activeTab, setActiveTab] = useState<Tab>('matching');

  // ── Matching state ──────────────────────────────────────────
  const [demandes, setDemandes]                 = useState<Demande[]>([]);
  const [loadingDemandes, setLoadingDemandes]   = useState(true);
  const [errorDemandes, setErrorDemandes]       = useState<string | null>(null);
  const [selectedDemande, setSelectedDemande]   = useState<Demande | null>(null);
  const [suggestions, setSuggestions]           = useState<SuggestionsData | null>(null);
  const [loadingSugg, setLoadingSugg]           = useState(false);
  const [suggestionMode, setSuggestionMode]     = useState<SuggestionMode>('ai');
  const [manualSearch, setManualSearch]         = useState('');
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);
  const [justification, setJustification]       = useState('');
  const [assigning, setAssigning]               = useState(false);
  const [assignError, setAssignError]           = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess]       = useState<string | null>(null);

  // AP sélection manuelle (quand NO_AP_AVAILABLE)
  const [needApSelection, setNeedApSelection]   = useState(false);
  const [animateurs, setAnimateurs]             = useState<Animateur[]>([]);
  const [selectedApId, setSelectedApId]         = useState<number | null>(null);

  // ── Mentors tableau state ───────────────────────────────────
  const [mentors, setMentors]                   = useState<MentorTableau[]>([]);
  const [loadingMentors, setLoadingMentors]     = useState(false);
  const [errorMentors, setErrorMentors]         = useState<string | null>(null);

  // Façon 2 : assignation depuis le tableau
  const [tableauMentor, setTableauMentor]       = useState<MentorTableau | null>(null);
  const [tableauDemandeId, setTableauDemandeId] = useState<number | null>(null);
  const [assigningTableau, setAssigningTableau] = useState(false);
  const [tableauError, setTableauError]         = useState<string | null>(null);

  // ── Fetch demandes ──────────────────────────────────────────
  const fetchDemandes = useCallback(async () => {
    try {
      setLoadingDemandes(true);
      setErrorDemandes(null);
      const res = await api.get('/pole/requests/pending/');
      setDemandes(res.data.demandes ?? []);
    } catch (err) {
      setErrorDemandes((err as ApiError).response?.data?.error ?? 'Erreur de chargement');
    } finally {
      setLoadingDemandes(false);
    }
  }, []);

  // ── Fetch mentors ───────────────────────────────────────────
  const fetchMentors = useCallback(async () => {
    if (mentors.length > 0) return;
    try {
      setLoadingMentors(true);
      setErrorMentors(null);
      const res = await api.get('/pole/mentors/');
      setMentors(res.data.mentors ?? []);
    } catch (err) {
      setErrorMentors((err as ApiError).response?.data?.error ?? 'Erreur de chargement');
    } finally {
      setLoadingMentors(false);
    }
  }, [mentors.length]);

  // ── Fetch animateurs (APs) pour sélection manuelle ─────────
  const fetchAnimateurs = useCallback(async () => {
    if (animateurs.length > 0) return;
    try {
      const res = await api.get('/pole/animateurs/');
      setAnimateurs(res.data.animateurs ?? []);
    } catch {
      // Silencieux — on affiche juste un message vide dans l'UI
    }
  }, [animateurs.length]);

  useEffect(() => { fetchDemandes(); }, [fetchDemandes]);

  // Charge mentors si on bascule sur l'onglet ou en mode recherche manuelle
  useEffect(() => {
    if (activeTab === 'mentors' || suggestionMode === 'manual') fetchMentors();
  }, [activeTab, suggestionMode, fetchMentors]);

  // ── Sélectionner une demande → suggestions IA ──────────────
  const handleSelectDemande = async (demande: Demande) => {
    if (selectedDemande?.id === demande.id) return;
    setSelectedDemande(demande);
    setSelectedMentorId(null);
    setJustification('');
    setAssignError(null);
    setAssignSuccess(null);
    setSuggestions(null);
    setSuggestionMode('ai');
    setManualSearch('');
    setNeedApSelection(false);
    setSelectedApId(null);
    setLoadingSugg(true);
    fetchAnimateurs(); // Pré-charger les APs pour la sélection
    try {
      const res = await api.get<SuggestionsData>(`/pole/matching/${demande.id}/`);
      setSuggestions(res.data);
    } catch {
      setSuggestions(null);
    } finally {
      setLoadingSugg(false);
    }
  };

  // ── Mentors filtrés pour la recherche manuelle ──────────────
  const manualMentors = useMemo(() => {
    return mentors.filter(m => {
      if (!manualSearch.trim()) return true;
      return `${m.name} ${m.city} ${m.association}`.toLowerCase().includes(manualSearch.toLowerCase());
    });
  }, [mentors, manualSearch]);

  // ── Score IA pour le mentor sélectionné (si dispo) ─────────
  const aiScoreForSelected = useMemo(() => {
    if (!suggestions || !selectedMentorId) return undefined;
    return suggestions.suggestions.find(s => s.mentor_id === selectedMentorId)?.score;
  }, [suggestions, selectedMentorId]);

  // ── Confirmer le matching (Façon 1) ────────────────────────
  const handleAssign = async () => {
    if (!selectedDemande || !selectedMentorId) return;
    setAssigning(true);
    setAssignError(null);
    setNeedApSelection(false);

    try {
      const payload: Record<string, unknown> = {
        request_id:    selectedDemande.id,
        mentor_id:     selectedMentorId,
        justification: justification.trim() || undefined,
        ai_score:      aiScoreForSelected,
      };
      if (selectedApId) payload.ap_id = selectedApId;

      const res = await api.post('/pole/matching/assign/', payload);
      setAssignSuccess(res.data?.message ?? 'Mentorat créé avec succès.');
      setDemandes(prev => prev.filter(d => d.id !== selectedDemande.id));
      // Invalide le cache mentors pour forcer un rechargement
      setMentors([]);
      setSelectedDemande(null);
      setSuggestions(null);
      setSelectedMentorId(null);
      setJustification('');
      setSelectedApId(null);
    } catch (err) {
      const e = err as ApiError;
      const errData = e.response?.data;
      if (errData?.code === 'NO_AP_AVAILABLE') {
        setNeedApSelection(true);
        fetchAnimateurs();
        setAssignError(`Aucun AP dans l'association de ce mentor. Choisissez-en un manuellement.`);
      } else {
        setAssignError(errData?.error ?? errData?.message ?? "Erreur lors de l'assignation");
      }
    } finally {
      setAssigning(false);
    }
  };

  // ── Confirmer le matching (Façon 2 — depuis tableau) ────────
  const handleAssignFromTableau = async () => {
    if (!tableauMentor || !tableauDemandeId) return;
    setAssigningTableau(true);
    setTableauError(null);
    try {
      const res = await api.post('/pole/matching/assign/', {
        request_id: tableauDemandeId,
        mentor_id:  tableauMentor.id,
      });
      setAssignSuccess(res.data?.message ?? 'Mentorat créé avec succès.');
      setDemandes(prev => prev.filter(d => d.id !== tableauDemandeId));
      setMentors([]);
      setTableauMentor(null);
      setTableauDemandeId(null);
    } catch (err) {
      const e = err as ApiError;
      setTableauError(e.response?.data?.error ?? "Erreur lors de l'assignation");
    } finally {
      setAssigningTableau(false);
    }
  };

  const clearSuggestions = () => {
    setSelectedDemande(null);
    setSuggestions(null);
    setSelectedMentorId(null);
    setAssignError(null);
    setNeedApSelection(false);
    setSelectedApId(null);
    setSuggestionMode('ai');
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── En-tête ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matching & Mentors</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Associez les jeunes avec les mentors disponibles de votre pôle
          </p>
        </div>
        {demandes.length > 0 && activeTab === 'matching' && (
          <span className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold">
            {demandes.length} demande{demandes.length > 1 ? 's' : ''} en attente
          </span>
        )}
      </div>

      {/* ── Onglets ────────────────────────────────────────── */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('matching')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'matching' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          Matching
          {demandes.length > 0 && (
            <span className="text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
              {demandes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('mentors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'mentors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutList className="w-4 h-4" />
          Tableau des mentors
        </button>
      </div>

      {/* ── Succès global ───────────────────────────────────── */}
      {assignSuccess && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {assignSuccess}
          <button onClick={() => setAssignSuccess(null)} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ONGLET MATCHING
          ══════════════════════════════════════════════════════ */}
      {activeTab === 'matching' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">

          {/* ── Colonne gauche : Demandes ── */}
          <div className="xl:col-span-2 space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Demandes en attente
            </h2>

            {loadingDemandes ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-slate-300" />
              </div>
            ) : errorDemandes ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-700">{errorDemandes}</p>
                <button onClick={fetchDemandes} className="mt-3 text-xs font-semibold text-red-600 hover:underline">
                  Réessayer
                </button>
              </div>
            ) : demandes.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl py-16 text-center shadow-sm">
                <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">Aucune demande en attente</p>
                <p className="text-xs text-slate-300 mt-1">Toutes les demandes ont été traitées</p>
              </div>
            ) : (
              <div className="space-y-2">
                {demandes.map(d => (
                  <DemandeCard
                    key={d.id}
                    demande={d}
                    selected={selectedDemande?.id === d.id}
                    onClick={() => handleSelectDemande(d)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Colonne droite : Suggestions ── */}
          <div className="xl:col-span-3">
            {!selectedDemande ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 flex flex-col items-center text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  <ArrowRight className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Sélectionnez une demande</p>
                <p className="text-xs text-slate-300 mt-1">Les mentors suggérés apparaîtront ici</p>
              </div>
            ) : loadingSugg ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
                <p className="text-xs text-slate-400">Calcul du meilleur matching…</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* ── Header suggestions ── */}
                <div className="px-5 py-4 border-b border-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Suggestions pour <span className="text-ora-blue">{suggestions?.demande.jeune ?? selectedDemande.jeune}</span>
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                        {suggestions?.demande.diplome_label && (
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full font-medium">
                            {suggestions.demande.diplome_label}
                          </span>
                        )}
                        {suggestions?.demande.situation_label && (
                          <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-full">
                            {suggestions.demande.situation_label}
                          </span>
                        )}
                        {suggestions?.demande.nom_etablissement && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />{suggestions.demande.nom_etablissement}
                          </span>
                        )}
                        {suggestions && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {suggestions.stats.total_disponibles} disponible{suggestions.stats.total_disponibles > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-[10px] text-violet-500 font-semibold flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5" />Trié par score IA
                        </span>
                      </div>
                      {selectedDemande.raison_transfert && (
                        <div className="flex items-start gap-1.5 mt-2 px-2.5 py-1.5 bg-violet-50 border border-violet-100 rounded-lg">
                          <ArrowRight className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-violet-700 leading-snug">
                            <span className="font-semibold">Demande transférée :</span> {selectedDemande.raison_transfert}
                          </p>
                        </div>
                      )}
                    </div>
                    <button onClick={clearSuggestions} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ── Sous-onglets : IA / Recherche libre ── */}
                  <div className="flex gap-1 mt-3">
                    <button
                      onClick={() => { setSuggestionMode('ai'); setSelectedMentorId(null); setAssignError(null); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        suggestionMode === 'ai'
                          ? 'bg-violet-50 text-violet-700 border border-violet-200'
                          : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <Star className="w-3 h-3" />
                      Suggestions IA
                      {suggestions && (
                        <span className="bg-violet-100 text-violet-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          {suggestions.suggestions.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => { setSuggestionMode('manual'); setSelectedMentorId(null); setAssignError(null); fetchMentors(); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        suggestionMode === 'manual'
                          ? 'bg-slate-800 text-white border border-slate-800'
                          : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <Search className="w-3 h-3" />
                      Recherche libre
                    </button>
                  </div>
                </div>

                {/* ── Liste suggestions IA ── */}
                {suggestionMode === 'ai' && (
                  <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto">
                    {!suggestions ? (
                      <div className="py-10 text-center">
                        <AlertCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Impossible de charger les suggestions</p>
                        <button
                          onClick={() => { setSuggestionMode('manual'); fetchMentors(); }}
                          className="mt-3 text-xs text-violet-600 font-semibold hover:underline"
                        >
                          Passer en recherche libre
                        </button>
                      </div>
                    ) : suggestions.suggestions.length === 0 ? (
                      <div className="py-10 text-center">
                        <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Aucun mentor disponible via l'IA</p>
                        <button
                          onClick={() => { setSuggestionMode('manual'); fetchMentors(); }}
                          className="mt-3 text-xs text-violet-600 font-semibold hover:underline"
                        >
                          Rechercher manuellement
                        </button>
                      </div>
                    ) : suggestions.suggestions.map(m => (
                      <SuggestionCard
                        key={m.mentor_id}
                        mentor={m}
                        selected={selectedMentorId === m.mentor_id}
                        onClick={() => {
                          setSelectedMentorId(prev => prev === m.mentor_id ? null : m.mentor_id);
                          setAssignError(null);
                          setNeedApSelection(false);
                          setSelectedApId(null);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* ── Recherche libre (tous les mentors du pôle) ── */}
                {suggestionMode === 'manual' && (
                  <div className="p-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={manualSearch}
                        onChange={e => setManualSearch(e.target.value)}
                        placeholder="Nom, ville, association…"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue"
                        autoFocus
                      />
                    </div>
                    {loadingMentors ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto">
                        {manualMentors.length === 0 ? (
                          <p className="text-center text-sm text-slate-400 py-8">Aucun mentor trouvé</p>
                        ) : manualMentors.map(m => (
                          <ManualMentorCard
                            key={m.id}
                            mentor={m}
                            selected={selectedMentorId === m.id}
                            onClick={() => {
                              if (m.est_sature) return;
                              setSelectedMentorId(prev => prev === m.id ? null : m.id);
                              setAssignError(null);
                              setNeedApSelection(false);
                              setSelectedApId(null);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Zone confirmation ── */}
                {selectedMentorId && (
                  <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                    {/* Sélection AP — toujours visible */}
                    <APSelector
                      animateurs={animateurs}
                      selectedApId={selectedApId}
                      onSelect={setSelectedApId}
                      required={needApSelection}
                    />

                    <textarea
                      value={justification}
                      onChange={e => setJustification(e.target.value)}
                      placeholder="Justification du choix (optionnel)…"
                      rows={2}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue resize-none"
                    />

                    {assignError && (
                      <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{assignError}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => { setSelectedMentorId(null); setAssignError(null); setNeedApSelection(false); setSelectedApId(null); }}
                        className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleAssign}
                        disabled={assigning || (needApSelection && !selectedApId)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-ora-blue text-white text-sm font-bold rounded-xl hover:bg-ora-blue/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm shadow-ora-blue/20"
                      >
                        {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Confirmer le mentorat
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Légende ── */}
                {suggestionMode === 'ai' && (
                  <div className="px-5 py-3 border-t border-slate-50 flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />Même ville
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />Même département
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />Autre zone
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />Score IA calculé automatiquement
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ONGLET TABLEAU MENTORS
          ══════════════════════════════════════════════════════ */}
      {activeTab === 'mentors' && (
        <div className="space-y-4">
          <MentorsTableau
            mentors={mentors}
            loading={loadingMentors}
            error={errorMentors}
            demandes={demandes}
            onAssignClick={(mentor) => {
              setTableauMentor(mentor);
              setTableauDemandeId(null);
              setTableauError(null);
            }}
          />

          {/* ── Façon 2 : panel d'assignation depuis tableau ── */}
          {tableauMentor && (
            <div className="bg-white rounded-2xl border-2 border-violet-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                    {tableauMentor.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-violet-900">Assigner {tableauMentor.name}</p>
                    <p className="text-[11px] text-violet-600">
                      {tableauMentor.association} · {tableauMentor.disponibilite} place{tableauMentor.disponibilite > 1 ? 's' : ''} disponible{tableauMentor.disponibilite > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setTableauMentor(null); setTableauDemandeId(null); setTableauError(null); }}
                  className="p-1.5 hover:bg-violet-100 rounded-lg text-violet-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm font-semibold text-slate-700">
                  À quelle demande souhaitez-vous l'assigner ?
                </p>

                {loadingDemandes ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                  </div>
                ) : demandes.length === 0 ? (
                  <div className="text-center py-6 text-sm text-slate-400">
                    Aucune demande en attente
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {demandes.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setTableauDemandeId(d.id)}
                        className={`text-left p-3 rounded-xl border-2 transition-all ${
                          tableauDemandeId === d.id
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{d.jeune}</p>
                          {tableauDemandeId === d.id && <CheckCircle className="w-3.5 h-3.5 text-violet-600 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <UrgenceBadge level={d.urgence} />
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                            <MapPin className="w-2.5 h-2.5" />{d.ville}
                          </span>
                        </div>
                        {d.diplome_label && (
                          <p className="text-[10px] text-indigo-500 mt-1 truncate">{d.diplome_label}</p>
                        )}
                        {d.nom_etablissement && (
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5 truncate">
                            <Building2 className="w-2.5 h-2.5 shrink-0" />{d.nom_etablissement}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {tableauError && (
                  <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{tableauError}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => { setTableauMentor(null); setTableauDemandeId(null); setTableauError(null); }}
                    className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAssignFromTableau}
                    disabled={!tableauDemandeId || assigningTableau}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {assigningTableau
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <UserPlus className="w-4 h-4" />}
                    Confirmer l'assignation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
