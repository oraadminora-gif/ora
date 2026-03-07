// src/pages/member/cn/CNConfiguration.tsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Users, UserPlus, Shield, Search,
  CheckCircle, XCircle, ToggleLeft, ToggleRight,
  Mail, Phone, User, Save, Copy, Check, X,
  MapPin, Building2, Briefcase,
} from 'lucide-react';

// ─── Constantes ──────────────────────────────────────────────────────────────

const FONCTIONS = [
  { value: 'membre',       label: 'Membre CN' },
  { value: 'resp_anim',    label: 'Responsable Animation du Comité' },
  { value: 'resp_reseau',  label: 'Responsable Animation du Réseau des Pôles' },
  { value: 'resp_doc',     label: 'Responsable Doc Internes – Formation' },
  { value: 'resp_finance', label: 'Responsable Finance/Financements/Achats' },
  { value: 'resp_com',     label: 'Responsable Com (yc TSB) – Partenariats' },
  { value: 'resp_si',      label: "Responsable des Systèmes d'Information (SI)" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface CNMembre {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ville: string;
  fonction: string;
  fonction_label: string;
  association_id: number | null;
  association_name: string | null;
  pole_id: number | null;
  pole_name: string | null;
  is_active: boolean;
  is_super_admin: boolean;
  cn_acces_complet: boolean;
  has_account: boolean;
  created_at: string;
}

interface MyProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ville: string;
  fonction: string;
  fonction_label: string;
  association_id: number | null;
  association_name: string | null;
  pole_id: number | null;
  pole_name: string | null;
  is_super_admin: boolean;
}

interface PoleOption        { id: number; name: string; code: string; }
interface AssocOption       { id: number; name: string; code: string; }

type Tab = 'membres' | 'profil';

// ─── TempPasswordDialog ───────────────────────────────────────────────────────

function TempPasswordDialog({ name, email, password, onClose }: {
  name: string; email: string; password: string; onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Membre CN créé</h3>
            <p className="text-sm text-slate-500">{name}</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>{email}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="font-mono text-sm bg-slate-200 px-2 py-0.5 rounded">{password}</span>
            </div>
            <button onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs text-ora-blue hover:bg-blue-50 rounded-lg">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          Notez ce mot de passe temporaire — il ne sera plus affiché.
        </p>
        <button onClick={onClose}
          className="w-full py-2.5 bg-ora-blue text-white rounded-xl font-medium hover:bg-ora-dark">
          Fermer
        </button>
      </div>
    </div>
  );
}

// ─── AddMemberModal ───────────────────────────────────────────────────────────

function AddMemberModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (membre: CNMembre & { temp_password: string }) => void;
}) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    ville: '', fonction: 'membre', association_id: '', pole_id: '',
    is_super_admin: false,
  });
  const [poles, setPoles]   = useState<PoleOption[]>([]);
  const [assocs, setAssocs] = useState<AssocOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    Promise.all([api.get('/poles/'), api.get('/cn/annuaire/')]).then(([pRes]) => {
      const poleList: PoleOption[] = pRes.data.results ?? pRes.data ?? [];
      setPoles(poleList);
    });
    // Fetch associations via poles endpoint or dedicated list
    api.get('/poles/').then(res => {
      // Use associations from annuaire if available
    });
    // Load associations from animateurs data to get the 4 national ones
    api.get('/cn/annuaire/').then(res => {
      const map = new Map<number, AssocOption>();
      (res.data.animateurs ?? []).forEach((a: { association_id: number; association_name: string; }) => {
        if (!map.has(a.association_id))
          map.set(a.association_id, { id: a.association_id, name: a.association_name, code: '' });
      });
      setAssocs(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, []);

  const needsPole = form.fonction === 'acp' || form.fonction === 'ap';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        association_id: form.association_id ? Number(form.association_id) : null,
        pole_id: form.pole_id ? Number(form.pole_id) : null,
      };
      const res = await api.post('/cn/membres/', payload);
      onCreated(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const F = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent text-sm";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Ajouter un membre CN</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-4">
          {/* Prénom / Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prénom *</label>
              <input className={F} value={form.first_name} required
                onChange={e => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
              <input className={F} value={form.last_name} required
                onChange={e => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
            <input type="email" className={F} value={form.email} required
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>

          {/* Téléphone / Ville */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
              <input className={F} value={form.phone} placeholder="optionnel"
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ville</label>
              <input className={F} value={form.ville} placeholder="optionnel"
                onChange={e => setForm({ ...form, ville: e.target.value })} />
            </div>
          </div>

          {/* Fonction */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fonction</label>
            <select className={F} value={form.fonction}
              onChange={e => setForm({ ...form, fonction: e.target.value, pole_id: '' })}>
              {FONCTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Association */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Association</label>
            <select className={F} value={form.association_id}
              onChange={e => setForm({ ...form, association_id: e.target.value })}>
              <option value="">— Aucune —</option>
              {assocs.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Pôle — uniquement si ACP ou AP */}
          {needsPole && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Pôle de rattachement
              </label>
              <select className={F} value={form.pole_id}
                onChange={e => setForm({ ...form, pole_id: e.target.value })}>
                <option value="">— Aucun pôle —</option>
                {poles.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          )}

          {/* Super admin */}
          <label className="flex items-center gap-3 cursor-pointer select-none p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <input type="checkbox" checked={form.is_super_admin}
              onChange={e => setForm({ ...form, is_super_admin: e.target.checked })}
              className="w-4 h-4 text-amber-500 rounded" />
            <div>
              <p className="text-sm font-medium text-slate-800">Super administrateur</p>
              <p className="text-xs text-slate-500">Accès à l'interface d'administration Django</p>
            </div>
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">
              Annuler
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-ora-blue text-white rounded-lg text-sm hover:bg-ora-dark disabled:opacity-60">
              <UserPlus className="w-4 h-4" />
              {submitting ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Fonction badge ────────────────────────────────────────────────────────────

function FonctionBadge({ fonction, label }: { fonction: string; label: string }) {
  const MAP: Record<string, string> = {
    resp_anim:    'bg-amber-100 text-amber-800 border-amber-200',
    resp_reseau:  'bg-blue-50   text-blue-700  border-blue-200',
    resp_doc:     'bg-violet-50 text-violet-700 border-violet-200',
    resp_finance: 'bg-green-50  text-green-700 border-green-200',
    resp_com:     'bg-orange-50 text-orange-700 border-orange-200',
    resp_si:      'bg-cyan-50   text-cyan-700   border-cyan-200',
    membre:       'bg-slate-100 text-slate-600  border-slate-200',
  };
  const cls = MAP[fonction] ?? MAP['membre'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {label}
    </span>
  );
}

// ─── MembresTab ───────────────────────────────────────────────────────────────

function MembresTab({ currentUserId }: { currentUserId: number }) {
  const [membres, setMembres]   = useState<CNMembre[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [tempPwd, setTempPwd]   = useState<{ name: string; email: string; password: string } | null>(null);
  const [togglingId, setTogglingId]   = useState<number | null>(null);
  const [togglingAccesId, setTogglingAccesId] = useState<number | null>(null);

  useEffect(() => { fetchMembres(); }, []);

  const fetchMembres = async () => {
    try {
      const res = await api.get('/cn/membres/');
      setMembres(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (m: CNMembre) => {
    if (m.id === currentUserId) return;
    setTogglingId(m.id);
    try {
      await api.patch(`/cn/membres/${m.id}/`, { is_active: !m.is_active });
      setMembres(prev => prev.map(x => x.id === m.id ? { ...x, is_active: !x.is_active } : x));
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleAcces = async (m: CNMembre) => {
    if (m.id === currentUserId) return;
    setTogglingAccesId(m.id);
    try {
      await api.patch(`/cn/membres/${m.id}/`, { cn_acces_complet: !m.cn_acces_complet });
      setMembres(prev => prev.map(x => x.id === m.id ? { ...x, cn_acces_complet: !x.cn_acces_complet } : x));
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingAccesId(null);
    }
  };

  const handleCreated = (membre: CNMembre & { temp_password: string }) => {
    setMembres(prev => [...prev, membre]);
    setShowAdd(false);
    setTempPwd({
      name:     `${membre.first_name} ${membre.last_name}`,
      email:    membre.email,
      password: membre.temp_password,
    });
  };

  const filtered = membres.filter(m =>
    `${m.first_name} ${m.last_name} ${m.email} ${m.ville ?? ''} ${m.association_name ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:  membres.length,
    actifs: membres.filter(m => m.is_active).length,
    admins: membres.filter(m => m.is_super_admin).length,
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ora-blue" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total membres CN', value: stats.total,  color: 'blue'  },
          { label: 'Actifs',           value: stats.actifs, color: 'green' },
          { label: 'Super admins',     value: stats.admins, color: 'amber' },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-200 rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold text-${s.color}-700`}>{s.value}</p>
            <p className={`text-xs text-${s.color}-600 mt-0.5`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Rechercher un membre CN..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-ora-blue focus:border-transparent" />
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-ora-blue text-white rounded-xl text-sm font-medium hover:bg-ora-dark">
          <UserPlus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Membre</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Contact</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Affiliation</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Fonction</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Accès complet</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(m => {
                const isSelf = m.id === currentUserId;
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    {/* Membre */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${m.is_active ? 'bg-amber-500' : 'bg-slate-300'}`}>
                          {m.first_name.charAt(0)}{m.last_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {m.first_name} {m.last_name}
                            {isSelf && <span className="ml-1.5 text-[10px] bg-ora-blue/10 text-ora-blue px-1.5 py-0.5 rounded font-semibold">vous</span>}
                            {m.is_super_admin && <Shield className="inline w-3 h-3 text-amber-500 ml-1" />}
                          </p>
                          <p className="text-xs text-slate-400">
                            Depuis {new Date(m.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{m.email}</span>
                        </div>
                        {m.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{m.phone}</span>
                          </div>
                        )}
                        {m.ville && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{m.ville}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Affiliation */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="space-y-0.5 text-xs text-slate-500">
                        {m.association_name && (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{m.association_name}</span>
                          </div>
                        )}
                        {m.pole_name && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded">Pôle</span>
                            <span>{m.pole_name}</span>
                          </div>
                        )}
                        {!m.association_name && !m.pole_name && (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </div>
                    </td>

                    {/* Fonction */}
                    <td className="px-5 py-3.5 text-center">
                      <FonctionBadge fonction={m.fonction} label={m.fonction_label} />
                    </td>

                    {/* Toggle accès complet */}
                    <td className="px-5 py-3.5 text-center">
                      <button onClick={() => handleToggleAcces(m)}
                        disabled={isSelf || togglingAccesId === m.id}
                        title={isSelf ? 'Impossible de modifier votre propre accès' : (m.cn_acces_complet ? 'Réduire l\'accès' : 'Donner l\'accès complet')}
                        className="flex mx-auto disabled:opacity-40 disabled:cursor-not-allowed">
                        {m.cn_acces_complet
                          ? <ToggleRight className="w-7 h-7 text-amber-500" />
                          : <ToggleLeft  className="w-7 h-7 text-slate-300" />
                        }
                      </button>
                    </td>

                    {/* Toggle actif */}
                    <td className="px-5 py-3.5 text-center">
                      <button onClick={() => handleToggle(m)}
                        disabled={isSelf || togglingId === m.id}
                        title={isSelf ? 'Impossible de vous désactiver' : (m.is_active ? 'Désactiver' : 'Activer')}
                        className="flex mx-auto disabled:opacity-40 disabled:cursor-not-allowed">
                        {m.is_active
                          ? <ToggleRight className="w-7 h-7 text-green-500" />
                          : <ToggleLeft  className="w-7 h-7 text-slate-300" />
                        }
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-slate-400">Aucun résultat</div>
        )}
      </div>

      {showAdd && (
        <AddMemberModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />
      )}
      {tempPwd && (
        <TempPasswordDialog
          name={tempPwd.name} email={tempPwd.email} password={tempPwd.password}
          onClose={() => setTempPwd(null)} />
      )}
    </div>
  );
}

// ─── ProfilTab ────────────────────────────────────────────────────────────────

function ProfilTab() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [form, setForm]       = useState({
    first_name: '', last_name: '', phone: '',
    ville: '', fonction: 'membre', association_id: '', pole_id: '',
  });
  const [poles, setPoles]     = useState<PoleOption[]>([]);
  const [assocs, setAssocs]   = useState<AssocOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/cn/membres/me/'),
      api.get('/poles/'),
      api.get('/cn/annuaire/'),
    ]).then(([meRes, pRes, annRes]) => {
      const p = meRes.data as MyProfile;
      setProfile(p);
      setForm({
        first_name:    p.first_name,
        last_name:     p.last_name,
        phone:         p.phone,
        ville:         p.ville,
        fonction:      p.fonction || 'membre',
        association_id: p.association_id ? String(p.association_id) : '',
        pole_id:        p.pole_id       ? String(p.pole_id)        : '',
      });
      const poleList: PoleOption[] = pRes.data.results ?? pRes.data ?? [];
      setPoles(poleList);
      const map = new Map<number, AssocOption>();
      (annRes.data.animateurs ?? []).forEach((a: { association_id: number; association_name: string }) => {
        if (!map.has(a.association_id))
          map.set(a.association_id, { id: a.association_id, name: a.association_name, code: '' });
      });
      setAssocs(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        association_id: form.association_id ? Number(form.association_id) : null,
        pole_id:        form.pole_id        ? Number(form.pole_id)        : null,
      };
      const res = await api.patch('/cn/membres/me/', payload);
      setProfile(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ora-blue" />
    </div>
  );

  const F = "w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-ora-blue focus:border-transparent";
  const needsPole = form.fonction === 'acp' || form.fonction === 'ap';

  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-bold text-xl">
            {profile?.first_name.charAt(0)}{profile?.last_name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{profile?.first_name} {profile?.last_name}</p>
            {profile && (
              <FonctionBadge fonction={profile.fonction} label={profile.fonction_label} />
            )}
            {profile?.is_super_admin && (
              <span className="inline-flex items-center gap-1 ml-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-semibold">
                <Shield className="w-3 h-3" /> Super admin
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prénom / Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom</label>
              <input className={F} value={form.first_name} required
                onChange={e => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nom</label>
              <input className={F} value={form.last_name} required
                onChange={e => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>

          {/* Email (lecture seule) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500">
              <Mail className="w-4 h-4 shrink-0" />{profile?.email}
            </div>
            <p className="text-xs text-slate-400 mt-1">L'email n'est pas modifiable</p>
          </div>

          {/* Téléphone / Ville */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className={`${F} pl-9`} value={form.phone} placeholder="optionnel"
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ville</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className={`${F} pl-9`} value={form.ville} placeholder="optionnel"
                  onChange={e => setForm({ ...form, ville: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Fonction */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              <Briefcase className="inline w-3.5 h-3.5 mr-1 text-slate-400" />Fonction
            </label>
            <select className={F} value={form.fonction}
              onChange={e => setForm({ ...form, fonction: e.target.value, pole_id: '' })}>
              {FONCTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Association */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              <Building2 className="inline w-3.5 h-3.5 mr-1 text-slate-400" />Association
            </label>
            <select className={F} value={form.association_id}
              onChange={e => setForm({ ...form, association_id: e.target.value })}>
              <option value="">— Aucune —</option>
              {assocs.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Pôle — conditionnel */}
          {needsPole && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Pôle de rattachement
              </label>
              <select className={F} value={form.pole_id}
                onChange={e => setForm({ ...form, pole_id: e.target.value })}>
                <option value="">— Aucun pôle —</option>
                {poles.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-ora-blue text-white rounded-xl text-sm font-medium hover:bg-ora-dark disabled:opacity-60 transition-colors">
            {saved
              ? <><CheckCircle className="w-4 h-4" /> Enregistré</>
              : <><Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer'}</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── CNConfiguration ──────────────────────────────────────────────────────────

export function CNConfiguration() {
  const [tab, setTab]               = useState<Tab>('membres');
  const [currentUserId, setCurrentUserId] = useState<number>(0);

  useEffect(() => {
    api.get('/cn/membres/me/').then(res => setCurrentUserId(res.data.id)).catch(() => {});
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'membres', label: 'Membres CN', icon: <Users className="w-4 h-4" /> },
    { key: 'profil',  label: 'Mon profil', icon: <User  className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuration</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gestion du Conseil National et de votre profil</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'membres' && <MembresTab currentUserId={currentUserId} />}
      {tab === 'profil'  && <ProfilTab />}
    </div>
  );
}
