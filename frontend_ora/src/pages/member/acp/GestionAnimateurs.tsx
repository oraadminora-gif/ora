// src/pages/member/acp/GestionAnimateurs.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../services/api';
import {
  Plus, Search, Loader2, AlertCircle, Pencil, X,
  CheckCircle, UserX, Shield, Key, Copy,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Animateur {
  id: number; name: string; first_name: string; last_name: string;
  email: string; phone: string; city: string;
  association: string; association_id: number;
  is_active: boolean;
}
interface Association { id: number; name: string; code: string; }

type ModalMode = 'create' | 'edit' | null;

interface APForm {
  first_name: string; last_name: string; email: string;
  phone: string; city: string; association_id: string; is_active: boolean;
}

const EMPTY_FORM: APForm = {
  first_name: '', last_name: '', email: '', phone: '', city: '',
  association_id: '', is_active: true,
};

// ─────────────────────────────────────────────────────────────
// MODALE MOT DE PASSE TEMPORAIRE
// ─────────────────────────────────────────────────────────────
function TempPasswordDialog({ name, email, password, onClose }: {
  name: string; email: string; password: string; onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 mx-auto">
          <Key className="w-7 h-7 text-amber-600" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-slate-900">Compte AP créé</h3>
          <p className="text-sm text-slate-500 mt-1">
            Transmettez ces identifiants à <strong>{name}</strong> en toute sécurité.
          </p>
        </div>

        <div className="space-y-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Email de connexion</p>
            <p className="text-sm font-mono text-slate-800 mt-0.5">{email}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Mot de passe temporaire</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-mono font-bold text-slate-900 flex-1 tracking-widest">{password}</p>
              <button onClick={handleCopy}
                className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-600 transition-colors"
                title="Copier">
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          Ce mot de passe ne sera affiché qu'une seule fois. L'AP pourra le modifier après sa première connexion.
        </p>

        <button onClick={onClose}
          className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all">
          J'ai noté les identifiants
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODALE CREATE / EDIT
// ─────────────────────────────────────────────────────────────
function APModal({
  mode, ap, associations, onClose, onSaved,
}: {
  mode: ModalMode;
  ap: Animateur | null;
  associations: Association[];
  onClose: () => void;
  onSaved: (a: Animateur, tempPassword?: string) => void;
}) {
  const [form, setForm] = useState<APForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && ap) {
      setForm({
        first_name:     ap.first_name,
        last_name:      ap.last_name,
        email:          ap.email,
        phone:          ap.phone,
        city:           ap.city,
        association_id: String(ap.association_id),
        is_active:      ap.is_active,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [mode, ap]);

  const set = (field: keyof APForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const toggle = () => setForm(prev => ({ ...prev, is_active: !prev.is_active }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...form, association_id: Number(form.association_id) };
      if (mode === 'create') {
        const res = await api.post('/pole/animateurs/', payload);
        onSaved(res.data, res.data.temp_password);
      } else {
        const res = await api.patch(`/pole/animateurs/${ap!.id}/`, payload);
        onSaved(res.data);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {mode === 'create' ? 'Nouvel animateur de pôle' : `Modifier ${ap?.name}`}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *">
              <input required value={form.first_name} onChange={set('first_name')}
                className={INPUT} placeholder="Marie" />
            </Field>
            <Field label="Nom *">
              <input required value={form.last_name} onChange={set('last_name')}
                className={INPUT} placeholder="Dupont" />
            </Field>
          </div>

          <Field label={mode === 'create' ? 'Email (identifiant de connexion) *' : 'Email'}>
            <input required type="email" value={form.email}
              onChange={set('email')} disabled={mode === 'edit'}
              className={`${INPUT} ${mode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder="marie.dupont@email.fr" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone">
              <input value={form.phone} onChange={set('phone')} className={INPUT} placeholder="06 xx xx xx xx" />
            </Field>
            <Field label="Ville">
              <input value={form.city} onChange={set('city')} className={INPUT} placeholder="Paris" />
            </Field>
          </div>

          <Field label="Association *">
            <select required value={form.association_id} onChange={set('association_id')} className={INPUT}>
              <option value="">— Choisir —</option>
              {associations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>

          {mode === 'edit' && (
            <div className="flex items-center gap-2">
              <Toggle label="Compte actif" value={form.is_active} onToggle={toggle} />
            </div>
          )}

          {mode === 'create' && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <Key className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Un mot de passe temporaire sera généré automatiquement et affiché une seule fois.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-60 transition-all">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {mode === 'create' ? 'Créer le compte AP' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export function GestionAnimateurs() {
  const [aps, setAps]                   = useState<Animateur[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [search, setSearch]             = useState('');
  const [modalMode, setModalMode]       = useState<ModalMode>(null);
  const [editingAP, setEditingAP]       = useState<Animateur | null>(null);
  const [successMsg, setSuccessMsg]     = useState<string | null>(null);
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{ name: string; email: string; password: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, assocRes] = await Promise.all([
        api.get('/pole/animateurs/'),
        api.get('/pole/associations/'),
      ]);
      setAps(aRes.data.animateurs ?? []);
      setAssociations(assocRes.data.associations ?? []);
    } catch { setError('Erreur de chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => aps.filter(ap => {
    if (!search.trim()) return true;
    return `${ap.name} ${ap.email} ${ap.association} ${ap.city}`.toLowerCase().includes(search.toLowerCase());
  }), [aps, search]);

  const handleSaved = (saved: Animateur, tempPassword?: string) => {
    setAps(prev => {
      const idx = prev.findIndex(a => a.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setModalMode(null);
    if (tempPassword) {
      setTempPasswordInfo({ name: saved.name, email: saved.email, password: tempPassword });
    } else {
      setSuccessMsg('Animateur mis à jour.');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleDeactivate = async (ap: Animateur) => {
    if (!confirm(`Désactiver le compte de ${ap.name} ?`)) return;
    try {
      const res = await api.patch(`/pole/animateurs/${ap.id}/`, { is_active: false });
      setAps(prev => prev.map(a => a.id === ap.id ? res.data : a));
      setSuccessMsg(`${ap.name} désactivé.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch { setError('Erreur lors de la désactivation'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des animateurs</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {aps.filter(a => a.is_active).length} APs actifs dans votre pôle
          </p>
        </div>
        <button onClick={() => { setEditingAP(null); setModalMode('create'); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-all shadow-sm shadow-violet-500/20">
          <Plus className="w-4 h-4" />Nouvel AP
        </button>
      </div>

      {/* Succès */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />{successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Nom, email, association…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Animateur</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Association</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Ville</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-sm text-slate-400">Aucun animateur trouvé</td></tr>
              ) : filtered.map(ap => (
                <tr key={ap.id} className={`hover:bg-slate-50/50 transition-colors ${!ap.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${ap.is_active ? 'bg-violet-500' : 'bg-slate-300'}`}>
                        {ap.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{ap.name}</p>
                        <p className="text-[11px] text-slate-400">{ap.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-slate-600">{ap.association}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-slate-500">{ap.city || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ap.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      <Shield className="w-2.5 h-2.5" />
                      {ap.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditingAP(ap); setModalMode('edit'); }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700" title="Modifier">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {ap.is_active && (
                        <button onClick={() => handleDeactivate(ap)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600" title="Désactiver">
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      {modalMode && (
        <APModal
          mode={modalMode}
          ap={editingAP}
          associations={associations}
          onClose={() => setModalMode(null)}
          onSaved={handleSaved}
        />
      )}
      {tempPasswordInfo && (
        <TempPasswordDialog
          name={tempPasswordInfo.name}
          email={tempPasswordInfo.email}
          password={tempPasswordInfo.password}
          onClose={() => { setTempPasswordInfo(null); setSuccessMsg('Compte AP créé avec succès.'); setTimeout(() => setSuccessMsg(null), 4000); }}
        />
      )}
    </div>
  );
}

// Helpers UI
const INPUT = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-2">
      <div className={`w-9 h-5 rounded-full transition-all relative ${value ? 'bg-violet-500' : 'bg-slate-200'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-4' : 'left-0.5'}`} />
      </div>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
    </button>
  );
}
