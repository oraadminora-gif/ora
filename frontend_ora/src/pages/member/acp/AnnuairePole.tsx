// src/pages/member/acp/AnnuairePole.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../services/api';
import {
  Search, Loader2, AlertCircle, Mail, Phone, MapPin,
  Building2, Users, GraduationCap, Star,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface PoleAnimateur {
  id: number;
  first_name: string; last_name: string;
  email: string; phone: string; city: string;
  association_id: number; association_name: string;
  is_coordinator: boolean; is_active: boolean;
}

interface PoleMentor {
  id: number;
  first_name: string; last_name: string;
  email: string; phone: string; city: string;
  association_id: number; association_name: string;
  is_trained: boolean; is_active: boolean;
  disponibilite: number; capacite_max: number;
}

interface PoleInfo { id: number; name: string; code: string }
interface Association { id: number; name: string }

type TabKey = 'all' | 'acp' | 'ap' | 'mentor';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function initials(fn: string, ln: string) {
  return `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// ANIMATEUR CARD  (ACP / AP)
// ─────────────────────────────────────────────────────────────
function AnimateurCard({ a }: { a: PoleAnimateur }) {
  const isAcp = a.is_coordinator;
  const avatarCls = isAcp ? 'bg-violet-500' : 'bg-sky-500';
  const badgeCls  = isAcp
    ? 'bg-violet-50 text-violet-700 border-violet-200'
    : 'bg-sky-50 text-sky-700 border-sky-200';

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 ${!a.is_active ? 'opacity-60' : ''}`}>
      {/* Avatar + nom + badge */}
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarCls}`}>
          {initials(a.first_name, a.last_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{a.first_name} {a.last_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeCls}`}>
              {isAcp ? 'ACP' : 'AP'}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${a.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              {a.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
      </div>

      {/* Coordonnées */}
      <div className="space-y-1.5">
        <a href={`mailto:${a.email}`}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-violet-600 transition-colors min-w-0">
          <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{a.email}</span>
        </a>
        {a.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{a.phone}</span>
          </div>
        )}
        {a.city && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{a.city}</span>
          </div>
        )}
      </div>

      {/* Association */}
      <div className="pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
          <span className="truncate">{a.association_name}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MENTOR CARD
// ─────────────────────────────────────────────────────────────
function MentorCard({ m }: { m: PoleMentor }) {
  const dispo    = m.disponibilite;
  const pct      = m.capacite_max > 0 ? Math.round((dispo / m.capacite_max) * 100) : 0;
  const isSature = dispo === 0;
  const dispoColor = isSature
    ? 'text-red-600 bg-red-50 border-red-200'
    : dispo <= 1
      ? 'text-orange-600 bg-orange-50 border-orange-200'
      : 'text-emerald-600 bg-emerald-50 border-emerald-200';

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 ${!m.is_active ? 'opacity-60' : ''}`}>
      {/* Avatar + nom + badges */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 bg-emerald-500">
          {initials(m.first_name, m.last_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{m.first_name} {m.last_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
              Mentor
            </span>
            {m.is_trained && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                <GraduationCap className="w-2.5 h-2.5" />Formé
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              {m.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
      </div>

      {/* Coordonnées */}
      <div className="space-y-1.5">
        <a href={`mailto:${m.email}`}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors min-w-0">
          <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{m.email}</span>
        </a>
        {m.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{m.phone}</span>
          </div>
        )}
        {m.city && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{m.city}</span>
          </div>
        )}
      </div>

      {/* Association + capacité */}
      <div className="pt-2 border-t border-slate-50 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
          <span className="truncate">{m.association_name}</span>
        </div>

        {/* Barre capacité */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Disponibilité</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${dispoColor}`}>
              {isSature ? 'Saturé' : `${dispo}/${m.capacite_max} place${dispo > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isSature ? 'bg-red-400' : dispo <= 1 ? 'bg-orange-400' : 'bg-emerald-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export function AnnuairePole() {
  const [animateurs, setAnimateurs]   = useState<PoleAnimateur[]>([]);
  const [mentors, setMentors]         = useState<PoleMentor[]>([]);
  const [pole, setPole]               = useState<PoleInfo | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [tab, setTab]                 = useState<TabKey>('all');
  const [search, setSearch]           = useState('');
  const [filterAssoc, setFilterAssoc] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/pole/annuaire/');
      const data = res.data;
      setPole(data.pole);
      setAnimateurs(data.animateurs ?? []);
      setMentors(data.mentors ?? []);

      // Build unique association list from both sources
      const map = new Map<number, Association>();
      [...(data.animateurs ?? []), ...(data.mentors ?? [])].forEach(
        (p: { association_id: number; association_name: string }) => {
          if (!map.has(p.association_id))
            map.set(p.association_id, { id: p.association_id, name: p.association_name });
        }
      );
      setAssociations(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Compteurs pour les onglets ───────────────────────────────
  const counts = useMemo(() => ({
    all:    animateurs.length + mentors.length,
    acp:    animateurs.filter(a => a.is_coordinator).length,
    ap:     animateurs.filter(a => !a.is_coordinator).length,
    mentor: mentors.length,
  }), [animateurs, mentors]);

  // ── Items filtrés ─────────────────────────────────────────────
  const filteredAnimateurs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return animateurs.filter(a => {
      if (tab === 'acp' && !a.is_coordinator) return false;
      if (tab === 'ap'  &&  a.is_coordinator) return false;
      if (tab === 'mentor') return false;
      if (filterAssoc && String(a.association_id) !== filterAssoc) return false;
      if (q && !`${a.first_name} ${a.last_name} ${a.email} ${a.association_name} ${a.city}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [animateurs, tab, search, filterAssoc]);

  const filteredMentors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mentors.filter(m => {
      if (tab === 'acp' || tab === 'ap') return false;
      if (filterAssoc && String(m.association_id) !== filterAssoc) return false;
      if (q && !`${m.first_name} ${m.last_name} ${m.email} ${m.association_name} ${m.city}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [mentors, tab, search, filterAssoc]);

  const totalFiltered = filteredAnimateurs.length + filteredMentors.length;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all',    label: 'Tous',    count: counts.all    },
    { key: 'acp',    label: 'ACP',     count: counts.acp    },
    { key: 'ap',     label: 'APs',     count: counts.ap     },
    { key: 'mentor', label: 'Mentors', count: counts.mentor },
  ];

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Annuaire Pôle</h1>
          {pole && (
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
              <span className="font-mono text-xs bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-lg font-bold">
                {pole.code}
              </span>
              <span>{pole.name}</span>
              <span className="text-slate-300">·</span>
              <span>{counts.all} membres</span>
            </p>
          )}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
          />
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              tab === t.key ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filtre association ───────────────────────────────── */}
      {associations.length > 1 && (
        <div>
          <select
            value={filterAssoc}
            onChange={e => setFilterAssoc(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          >
            <option value="">Toutes les associations</option>
            {associations.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Contenu ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={loadData} className="mt-3 px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
            Réessayer
          </button>
        </div>
      ) : totalFiltered === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">Aucun membre trouvé</p>
          {search && (
            <button onClick={() => setSearch('')} className="mt-2 text-xs text-violet-600 hover:underline">
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section ACP + APs */}
          {filteredAnimateurs.length > 0 && (
            <div>
              {tab === 'all' && (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5" />
                  Animateurs ({filteredAnimateurs.length})
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAnimateurs.map(a => (
                  <AnimateurCard key={`anim-${a.id}`} a={a} />
                ))}
              </div>
            </div>
          )}

          {/* Section Mentors */}
          {filteredMentors.length > 0 && (
            <div>
              {tab === 'all' && (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  Mentors ({filteredMentors.length})
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMentors.map(m => (
                  <MentorCard key={`mentor-${m.id}`} m={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
