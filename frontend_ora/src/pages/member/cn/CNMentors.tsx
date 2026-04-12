// src/pages/member/cn/CNMentors.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../services/api';
import {
  Search, Loader2,
  Mail, Phone, MapPin,
  CheckCircle, XCircle,
  Users, UserCheck, GraduationCap,
  ToggleLeft, ToggleRight,
  ChevronDown, Filter,
} from 'lucide-react';

interface Association { id: number; code: string; name: string; }

interface Mentor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city?: string;
  pole_name?: string;
  pole_id?: number;
  association?: Association;
  is_active: boolean;
  is_trained: boolean;
  disponibilite_reelle: number;
  max_capacity: number;
}

interface MentorMeta {
  total_counts: {
    all: number; actifs: number; inactifs: number;
    formes: number; disponibles: number;
  };
  count: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

type ActiveFilter = 'all' | 'actifs' | 'inactifs';

const PAGE_SIZE = 25;

// Les 4 associations ORA (IDs stables en base)
const ASSOCIATIONS = [
  { id: 3, code: 'AGIR',  name: 'AGIR' },
  { id: 4, code: 'ECTI',  name: 'ECTI' },
  { id: 5, code: 'EGEE',  name: 'EGEE' },
  { id: 6, code: 'OTECI', name: 'OTECI' },
];

export function CNMentors() {
  const [mentors, setMentors]           = useState<Mentor[]>([]);
  const [meta, setMeta]                 = useState<MentorMeta | null>(null);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [searchInput, setSearchInput]   = useState('');
  const [search, setSearch]             = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [assocId, setAssocId]           = useState('');
  const [togglingId, setTogglingId]     = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch paginé ──────────────────────────────────────────────────────────
  const fetchMentors = useCallback(async (
    isActive: ActiveFilter, q: string, assoc: string, page: number, append = false
  ) => {
    if (page === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
      if (isActive === 'actifs')   params.is_active = 'true';
      if (isActive === 'inactifs') params.is_active = 'false';
      if (q)     params.search = q;
      if (assoc) params.association_id = assoc;

      const res = await api.get('/cn/mentors/', { params });
      const { mentors: rows, ...pageMeta } = res.data;
      setMeta(pageMeta);
      setMentors(prev => append ? [...prev, ...rows] : rows);
    } catch { /* silencieux */ } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Refetch quand filtre / search / association change
  useEffect(() => {
    fetchMentors(activeFilter, search, assocId, 1, false);
  }, [activeFilter, search, assocId, fetchMentors]);

  // Debounce saisie
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 350);
  };

  const handleLoadMore = () => {
    if (!meta?.has_next) return;
    fetchMentors(activeFilter, search, assocId, meta.page + 1, true);
  };

  // Toggle actif / inactif
  const handleToggleActive = async (mentor: Mentor) => {
    setTogglingId(mentor.id);
    try {
      await api.patch(`/cn/mentors/${mentor.id}/`, { is_active: !mentor.is_active });
      // Mise à jour locale optimiste
      setMentors(prev => prev.map(m =>
        m.id === mentor.id ? { ...m, is_active: !m.is_active } : m
      ));
      setMeta(prev => prev ? {
        ...prev,
        total_counts: {
          ...prev.total_counts,
          actifs:   prev.total_counts.actifs   + (mentor.is_active ? -1 : 1),
          inactifs: prev.total_counts.inactifs + (mentor.is_active ? 1 : -1),
        },
      } : prev);
    } catch { /* silencieux */ } finally {
      setTogglingId(null);
    }
  };

  const tc = meta?.total_counts;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestion des Mentors</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {tc
            ? `${tc.all} mentor${tc.all > 1 ? 's' : ''} · ${tc.actifs} actifs · ${tc.inactifs} inactifs`
            : '—'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />}        label="Total"       value={tc?.all        ?? 0} color="blue" />
        <StatCard icon={<CheckCircle className="w-5 h-5" />}  label="Actifs"      value={tc?.actifs     ?? 0} color="green" />
        <StatCard icon={<XCircle className="w-5 h-5" />}      label="Inactifs"    value={tc?.inactifs   ?? 0} color="red" />
        <StatCard icon={<GraduationCap className="w-5 h-5" />} label="Formés"     value={tc?.formes     ?? 0} color="purple" />
        <StatCard icon={<UserCheck className="w-5 h-5" />}    label="Disponibles" value={tc?.disponibles ?? 0} color="orange" />
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Nom, email, ville, pôle…"
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-ora-blue focus:border-transparent"
          />
        </div>

        {/* Filtre association */}
        <div className="relative shrink-0">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={assocId}
            onChange={e => setAssocId(e.target.value)}
            className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:ring-2 focus:ring-ora-blue focus:border-transparent appearance-none"
          >
            <option value="">Toutes les associations</option>
            {ASSOCIATIONS.map(a => (
              <option key={a.id} value={String(a.id)}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Filtre actif / inactif */}
        <div className="flex gap-1.5 shrink-0">
          {(['all', 'actifs', 'inactifs'] as ActiveFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === f
                  ? 'bg-ora-blue text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'actifs' ? 'Actifs' : 'Inactifs'}
              {tc && (
                <span className={`ml-1.5 text-xs ${activeFilter === f ? 'text-blue-200' : 'text-slate-400'}`}>
                  {f === 'all' ? tc.all : f === 'actifs' ? tc.actifs : tc.inactifs}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      {mentors.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl py-16 text-center shadow-sm">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">Aucun mentor trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mentor</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pôle / Association</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Capacité</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Formé</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {mentors.map(mentor => (
                  <MentorRow
                    key={mentor.id}
                    mentor={mentor}
                    toggling={togglingId === mentor.id}
                    onToggle={() => handleToggleActive(mentor)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charger plus */}
      {meta?.has_next && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
          >
            {loadingMore
              ? <><Loader2 className="w-4 h-4 animate-spin" />Chargement…</>
              : <><ChevronDown className="w-4 h-4" />Charger plus ({meta.count - mentors.length} restant{meta.count - mentors.length > 1 ? 's' : ''})</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string;
}) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    red:    'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  };
  return (
    <div className={`${colors[color]} rounded-xl p-4 border text-center`}>
      <div className="flex items-center justify-center gap-2 mb-1">
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}

function MentorRow({ mentor, toggling, onToggle }: {
  mentor: Mentor; toggling: boolean; onToggle: () => void;
}) {
  const occupied = mentor.max_capacity - mentor.disponibilite_reelle;
  return (
    <tr className={`hover:bg-slate-50/50 transition-colors ${!mentor.is_active ? 'opacity-60' : ''}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 ${mentor.is_active ? 'bg-ora-blue' : 'bg-slate-300'}`}>
            {mentor.first_name.charAt(0)}{mentor.last_name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 leading-tight">{mentor.first_name} {mentor.last_name}</p>
            {mentor.city && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <MapPin className="w-3 h-3" />{mentor.city}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3 hidden md:table-cell">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />{mentor.email}
          </div>
          {mentor.phone && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />{mentor.phone}
            </div>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="text-xs">
          {mentor.pole_name && <p className="font-medium text-slate-800">{mentor.pole_name}</p>}
          {mentor.association && <p className="text-slate-400">{mentor.association.name}</p>}
        </div>
      </td>

      <td className="px-4 py-3 text-center">
        <span className="font-medium text-slate-900 text-xs">{occupied}/{mentor.max_capacity}</span>
        <p className="text-[11px] text-slate-400">{mentor.disponibilite_reelle} dispo</p>
      </td>

      <td className="px-4 py-3 text-center">
        {mentor.is_trained
          ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
          : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
        }
      </td>

      <td className="px-4 py-3 text-center">
        <button
          onClick={onToggle}
          disabled={toggling}
          className="flex items-center gap-1 mx-auto transition-colors disabled:opacity-40"
          title={mentor.is_active ? 'Désactiver' : 'Activer'}
        >
          {toggling
            ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            : mentor.is_active
              ? <ToggleRight className="w-7 h-7 text-green-500" />
              : <ToggleLeft className="w-7 h-7 text-slate-400" />
          }
        </button>
      </td>
    </tr>
  );
}
