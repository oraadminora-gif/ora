// src/pages/member/cn/AnnuaireORA.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../services/api';
import {
  Search, Loader2, AlertCircle, Mail, Phone, MapPin,
  Building2, Crown, Users,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface CNMember {
  id: number; first_name: string; last_name: string;
  email: string; phone: string; ville: string;
  fonction: string; fonction_label: string;
  association_id: number | null; association_name: string | null;
  pole_id: number | null; pole_name: string | null;
  is_active: boolean; is_super_admin: boolean;
}
interface Animateur {
  id: number; first_name: string; last_name: string;
  email: string; phone: string; city: string;
  pole_id: number; pole_name: string; pole_code: string;
  association_id: number; association_name: string;
  is_coordinator: boolean; is_active: boolean;
}
interface Pole        { id: number; name: string; code: string; }
interface Association { id: number; name: string; code: string; }

type TabKey = 'all' | 'cn' | 'acp' | 'ap';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function initials(fn: string, ln: string) {
  return `${fn[0] ?? ''}${ln[0] ?? ''}`.toUpperCase();
}

function roleLabel(role: 'cn' | 'acp' | 'ap') {
  if (role === 'cn')  return 'CN';
  if (role === 'acp') return 'ACP';
  return 'AP';
}

function roleBg(role: 'cn' | 'acp' | 'ap') {
  if (role === 'cn')  return 'bg-amber-500';
  if (role === 'acp') return 'bg-blue-500';
  return 'bg-violet-500';
}

function roleBadge(role: 'cn' | 'acp' | 'ap') {
  if (role === 'cn')  return 'bg-amber-50 text-amber-700 border-amber-200';
  if (role === 'acp') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-violet-50 text-violet-700 border-violet-200';
}

// ─────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────
function ContactCard({ role, fn, ln, email, phone, city, poleName, poleCode, assocName, isActive, isSuperAdmin, fonctionLabel }: {
  role: 'cn' | 'acp' | 'ap';
  fn: string; ln: string; email: string; phone?: string; city?: string;
  poleName?: string; poleCode?: string; assocName?: string;
  isActive: boolean; isSuperAdmin?: boolean;
  fonctionLabel?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 ${!isActive ? 'opacity-60' : ''}`}>
      {/* Avatar + nom + badge */}
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${roleBg(role)}`}>
          {initials(fn, ln)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900 truncate">{fn} {ln}</p>
            {isSuperAdmin && (
              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Super admin" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge(role)}`}>
              {roleLabel(role)}
            </span>
            {fonctionLabel && fonctionLabel !== 'Membre CN' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-50 text-slate-600 border-slate-200">
                {fonctionLabel}
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              {isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
      </div>

      {/* Coordonnées */}
      <div className="space-y-1.5 text-sm">
        <a href={`mailto:${email}`}
          className="flex items-center gap-2 text-slate-600 hover:text-violet-600 transition-colors min-w-0">
          <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{email}</span>
        </a>
        {phone && (
          <div className="flex items-center gap-2 text-slate-500">
            <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{phone}</span>
          </div>
        )}
        {city && (
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{city}</span>
          </div>
        )}
      </div>

      {/* Pôle + Association (pour animateurs) */}
      {(poleName || assocName) && (
        <div className="pt-2 border-t border-slate-50 space-y-1 text-xs text-slate-500">
          {poleName && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{poleCode}</span>
              <span className="truncate">{poleName}</span>
            </div>
          )}
          {assocName && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
              <span className="truncate">{assocName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export function AnnuaireORA() {
  const [cnMembers, setCnMembers]   = useState<CNMember[]>([]);
  const [animateurs, setAnimateurs] = useState<Animateur[]>([]);
  const [poles, setPoles]           = useState<Pole[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [tab, setTab]               = useState<TabKey>('all');
  const [search, setSearch]         = useState('');
  const [filterPole, setFilterPole] = useState('');
  const [filterAssoc, setFilterAssoc] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [annRes, polesRes] = await Promise.all([
        api.get('/cn/annuaire/'),
        api.get('/poles/'),
      ]);
      setCnMembers(annRes.data.cn_members ?? []);
      setAnimateurs(annRes.data.animateurs ?? []);
      const poleList: Pole[] = polesRes.data.results ?? polesRes.data ?? [];
      setPoles(poleList);
    } catch { setError('Erreur de chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Associations dynamiques selon le pôle sélectionné
  useEffect(() => {
    if (!filterPole) {
      // Toutes les associations des animateurs chargés
      const map = new Map<number, Association>();
      animateurs.forEach(a => {
        if (!map.has(a.association_id))
          map.set(a.association_id, { id: a.association_id, name: a.association_name, code: '' });
      });
      setAssociations(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      const map = new Map<number, Association>();
      animateurs.filter(a => String(a.pole_id) === filterPole).forEach(a => {
        if (!map.has(a.association_id))
          map.set(a.association_id, { id: a.association_id, name: a.association_name, code: '' });
      });
      setAssociations(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
      setFilterAssoc('');
    }
  }, [filterPole, animateurs]);

  // Construction de la liste unifiée filtrée
  const items = useMemo(() => {
    const q = search.trim().toLowerCase();

    type Card = { type: 'cn' | 'acp' | 'ap'; key: string; data: CNMember | Animateur };
    const cards: Card[] = [];

    if (tab === 'all' || tab === 'cn') {
      cnMembers.forEach(m => {
        if (q && !`${m.first_name} ${m.last_name} ${m.email} ${m.ville ?? ''} ${m.association_name ?? ''} ${m.fonction_label ?? ''}`.toLowerCase().includes(q)) return;
        cards.push({ type: 'cn', key: `cn-${m.id}`, data: m });
      });
    }

    if (tab === 'all' || tab === 'acp' || tab === 'ap') {
      animateurs.forEach(a => {
        if (tab === 'acp' && !a.is_coordinator) return;
        if (tab === 'ap'  &&  a.is_coordinator) return;
        if (filterPole && String(a.pole_id) !== filterPole) return;
        if (filterAssoc && String(a.association_id) !== filterAssoc) return;
        if (q && !`${a.first_name} ${a.last_name} ${a.email} ${a.pole_name} ${a.association_name}`.toLowerCase().includes(q)) return;
        cards.push({ type: a.is_coordinator ? 'acp' : 'ap', key: `anim-${a.id}`, data: a });
      });
    }

    return cards;
  }, [tab, search, filterPole, filterAssoc, cnMembers, animateurs]);

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: 'Tous',       count: cnMembers.length + animateurs.length },
    { key: 'cn',  label: 'Membres CN', count: cnMembers.length },
    { key: 'acp', label: 'ACPs',       count: animateurs.filter(a => a.is_coordinator).length },
    { key: 'ap',  label: 'APs',        count: animateurs.filter(a => !a.is_coordinator).length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Annuaire ORA</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {cnMembers.length + animateurs.length} membres au total
          </p>
        </div>
        {/* Barre de recherche header */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-500'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filtres pôle + association (masqués sur onglet CN) */}
      {tab !== 'cn' && (
        <div className="flex flex-wrap gap-3">
          <select value={filterPole} onChange={e => setFilterPole(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30">
            <option value="">Tous les pôles</option>
            {poles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {associations.length > 0 && (
            <select value={filterAssoc} onChange={e => setFilterAssoc(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30">
              <option value="">Toutes les associations</option>
              {associations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun membre trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => {
            if (item.type === 'cn') {
              const m = item.data as CNMember;
              return (
                <ContactCard key={item.key}
                  role="cn"
                  fn={m.first_name} ln={m.last_name}
                  email={m.email} phone={m.phone} city={m.ville || undefined}
                  assocName={m.association_name || undefined}
                  poleName={m.pole_name || undefined}
                  isActive={m.is_active} isSuperAdmin={m.is_super_admin}
                  fonctionLabel={m.fonction_label} />
              );
            }
            const a = item.data as Animateur;
            return (
              <ContactCard key={item.key}
                role={item.type as 'acp' | 'ap'}
                fn={a.first_name} ln={a.last_name}
                email={a.email} phone={a.phone} city={a.city}
                poleName={a.pole_name} poleCode={a.pole_code}
                assocName={a.association_name}
                isActive={a.is_active} />
            );
          })}
        </div>
      )}
    </div>
  );
}
