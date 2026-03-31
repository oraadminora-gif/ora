// src/pages/member/acp/GestionMentors.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import {
  Plus, Search, GraduationCap, Loader2, AlertCircle,
  Pencil, X, CheckCircle, UserX, UserCheck, Users, Key, Copy,
  Link2, Link2Off, Inbox, UserPlus, Ban, ChevronDown, ChevronUp, Trash2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Mentor {
  id: number; name: string; first_name: string; last_name: string;
  email: string; phone: string; city: string; code_postal: string;
  observations: string;
  department: string | null; department_id: number | null;
  association: string; association_id: number;
  is_trained: boolean; training_date: string | null; is_active: boolean;
  disponibilite: number; capacite_max: number; est_sature: boolean;
  nb_actifs: number; nb_termines: number;
  // Compte utilisateur
  has_account: boolean; user_id: number | null; user_email: string | null;
}

interface Association { id: number; name: string; code: string; }
interface Department  { id: number; code: string; name: string; label: string; }

type ModalMode = 'create' | 'edit' | null;

interface Candidature {
  id: number;
  first_name: string; last_name: string;
  email: string; phone: string;
  code_postal: string; commune: string;
  pole_name: string | null;
  association_id: number | null; association_name: string | null;
  experience_pro: string;
  domaines: string[];
  disponibilite: string;
  motivation: string;
  statut: 'PENDING' | 'VALIDATED' | 'REJECTED';
  statut_label: string;
  notes_rejet: string;
  validated_by: string | null;
  mentor_id: number | null;
  created_at: string;
}

interface MentorForm {
  first_name: string; last_name: string; email: string; phone: string;
  city: string; code_postal: string; observations: string;
  association_id: string; department_id: string; max_capacity: string;
  is_trained: boolean; training_date: string; is_active: boolean;
  // Compte
  create_account: boolean;
  link_user_email: string;
}

const EMPTY_FORM: MentorForm = {
  first_name: '', last_name: '', email: '', phone: '', city: '', code_postal: '',
  observations: '',
  association_id: '', department_id: '', max_capacity: '1',
  is_trained: false, training_date: '', is_active: true,
  create_account: false, link_user_email: '',
};

// ─────────────────────────────────────────────────────────────
// TEMP PASSWORD DIALOG  (identique à GestionAnimateurs)
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 mx-auto">
          <Key className="w-7 h-7 text-amber-600" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-slate-900">Compte mentor créé</h3>
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
          Ce mot de passe ne sera affiché qu'une seule fois. Le mentor pourra le modifier après sa première connexion.
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
// MODAL
// ─────────────────────────────────────────────────────────────
function MentorModal({
  mode, mentor, associations, departments, isAP, onClose, onSaved,
}: {
  mode: ModalMode;
  mentor: Mentor | null;
  associations: Association[];
  departments: Department[];
  isAP: boolean;
  onClose: () => void;
  onSaved: (m: Mentor, tempPassword?: string) => void;
}) {
  const [form, setForm] = useState<MentorForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && mentor) {
      setForm({
        first_name:      mentor.first_name,
        last_name:       mentor.last_name,
        email:           mentor.email,
        phone:           mentor.phone,
        city:            mentor.city,
        code_postal:     mentor.code_postal ?? '',
        observations:    mentor.observations ?? '',
        association_id:  String(mentor.association_id),
        department_id:   mentor.department_id ? String(mentor.department_id) : '',
        max_capacity:    String(mentor.capacite_max),
        is_trained:      mentor.is_trained,
        training_date:   mentor.training_date ?? '',
        is_active:       mentor.is_active,
        create_account:  false,
        link_user_email: '',
      });
    } else {
      // Pré-sélectionner l'association si une seule est disponible (cas AP)
      const defaultAssoc = associations.length === 1 ? String(associations[0].id) : '';
      setForm({ ...EMPTY_FORM, association_id: defaultAssoc });
    }
    setError(null);
  }, [mode, mentor, associations]);

  const set = (field: keyof MentorForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const toggle = (field: 'is_trained' | 'is_active' | 'create_account') =>
    setForm(prev => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        first_name:     form.first_name,
        last_name:      form.last_name,
        email:          form.email,
        phone:          form.phone,
        city:           form.city,
        code_postal:    form.code_postal,
        observations:   form.observations,
        association_id: Number(form.association_id),
        department_id:  form.department_id ? Number(form.department_id) : null,
        max_capacity:   Number(form.max_capacity),
        is_trained:     form.is_trained,
        training_date:  form.is_trained && form.training_date ? form.training_date : null,
        is_active:      form.is_active,
      };

      if (mode === 'create') {
        if (form.create_account) payload.create_account = true;
        else if (form.link_user_email.trim()) payload.link_user_email = form.link_user_email.trim();
      } else {
        // edit : inclure link_user_email si renseigné
        if (form.link_user_email.trim()) payload.link_user_email = form.link_user_email.trim();
      }

      const res = mode === 'create'
        ? await api.post('/pole/mentors/', payload)
        : await api.patch(`/pole/mentors/${mentor!.id}/`, payload);

      onSaved(res.data, res.data.temp_password);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlinkAccount = async () => {
    if (!mentor || !confirm('Délier le compte utilisateur de ce mentor ?')) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.patch(`/pole/mentors/${mentor.id}/`, { link_user_email: '' });
      onSaved(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === 'create' ? 'Nouveau mentor' : `Modifier ${mentor?.name}`;
  const isEdit = mode === 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Nom / Prénom */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom *">
              <input required value={form.first_name} onChange={set('first_name')}
                className={INPUT} placeholder="Jean" />
            </Field>
            <Field label="Nom *">
              <input required value={form.last_name} onChange={set('last_name')}
                className={INPUT} placeholder="Martin" />
            </Field>
          </div>

          <Field label="Email *">
            <input required type="email" value={form.email} onChange={set('email')}
              className={INPUT} placeholder="jean.martin@email.fr" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone">
              <input value={form.phone} onChange={set('phone')} className={INPUT} placeholder="06 xx xx xx xx" />
            </Field>
            <Field label="Ville">
              <input value={form.city} onChange={set('city')} className={INPUT} placeholder="Paris" />
            </Field>
          </div>

          <Field label="Code postal">
            <input value={form.code_postal} onChange={set('code_postal')} className={INPUT} placeholder="75001" maxLength={10} />
          </Field>

          <Field label="Association *">
            <select required value={form.association_id} onChange={set('association_id')}
              disabled={associations.length === 1}
              className={INPUT}>
              <option value="">— Choisir —</option>
              {associations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>

          <Field label="Département">
            <select value={form.department_id} onChange={set('department_id')} className={INPUT}>
              <option value="">— Aucun —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </Field>

          <Field label="Capacité max (jeunes simultanés)">
            <input type="number" min={1} max={10} value={form.max_capacity}
              onChange={set('max_capacity')} className={INPUT} />
          </Field>

          <div className="flex items-center gap-6">
            <Toggle label="Mentor formé" value={form.is_trained} onToggle={() => toggle('is_trained')} />
            {isEdit && (
              <Toggle label="Actif" value={form.is_active} onToggle={() => toggle('is_active')} />
            )}
          </div>

          {form.is_trained && (
            <Field label="Date de formation">
              <input
                type="date"
                value={form.training_date}
                onChange={set('training_date')}
                max={new Date().toISOString().split('T')[0]}
                className={INPUT}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Optionnelle — améliore la précision du matching (critère «&nbsp;formation récente&nbsp;»).
              </p>
            </Field>
          )}

          <Field label="Observations">
            <textarea
              value={form.observations}
              onChange={e => setForm(prev => ({ ...prev, observations: e.target.value }))}
              rows={3}
              placeholder="Notes internes sur ce mentor (visibles ACP uniquement)…"
              className={`${INPUT} resize-none`}
            />
          </Field>

          {/* ── Compte utilisateur ──────────────────────────────── */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Compte de connexion
            </p>

            {isEdit && mentor?.has_account ? (
              /* Edit : compte déjà lié */
              <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span className="font-mono">{mentor.user_email}</span>
                </div>
                <button type="button" onClick={handleUnlinkAccount} disabled={submitting}
                  className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700 font-semibold">
                  <Link2Off className="w-3 h-3" /> Délier
                </button>
              </div>
            ) : isEdit ? (
              /* Edit : pas de compte — proposer de lier un compte existant */
              <Field label="Lier à un compte existant (email)">
                <input type="email" value={form.link_user_email} onChange={set('link_user_email')}
                  className={INPUT} placeholder="email@existant.fr" />
                <p className="text-[11px] text-slate-400 mt-1">
                  Entrez l'email d'un compte déjà créé (ex : un ACP qui est aussi mentor).
                </p>
              </Field>
            ) : (
              /* Création : deux options */
              <div className="space-y-3">
                <Toggle
                  label="Créer un compte de connexion pour ce mentor"
                  value={form.create_account}
                  onToggle={() => toggle('create_account')}
                />

                {form.create_account ? (
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    <Key className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Un mot de passe temporaire sera généré et affiché une seule fois.
                  </div>
                ) : (
                  <Field label="Ou lier à un compte existant (email)">
                    <input type="email" value={form.link_user_email} onChange={set('link_user_email')}
                      className={INPUT} placeholder="email@existant.fr (optionnel)" />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Permet à un utilisateur existant (ACP, AP…) d'être aussi mentor.
                    </p>
                  </Field>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-ora-blue text-white text-sm font-bold rounded-xl hover:bg-ora-blue/90 disabled:opacity-60 transition-all">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {mode === 'create' ? 'Créer le mentor' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export function GestionMentors() {
  const { activeRole } = useAuth();
  const isAP = activeRole === 'AP';

  const [mentors, setMentors]           = useState<Mentor[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [departments, setDepartments]   = useState<Department[]>([]);
  const [search, setSearch]             = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalMode, setModalMode]       = useState<ModalMode>(null);
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [successMsg, setSuccessMsg]     = useState<string | null>(null);
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{
    name: string; email: string; password: string;
  } | null>(null);

  // ── Candidatures ─────────────────────────────────────────
  const [tab, setTab]                     = useState<'mentors' | 'candidatures'>('mentors');
  const [candidatures, setCandidatures]   = useState<Candidature[]>([]);
  const [candLoading, setCandLoading]     = useState(false);
  const [expandedCand, setExpandedCand]   = useState<number | null>(null);
  const [rejectId, setRejectId]           = useState<number | null>(null);
  const [rejectNote, setRejectNote]       = useState('');

  const pendingCount = candidatures.filter(c => c.statut === 'PENDING').length;

  const loadCandidatures = useCallback(async () => {
    setCandLoading(true);
    try {
      const res = await api.get('/pole/candidatures-mentors/');
      setCandidatures(res.data);
    } catch { /* silencieux */ }
    finally { setCandLoading(false); }
  }, []);

  useEffect(() => { loadCandidatures(); }, [loadCandidatures]);

  const handleValider = async (id: number) => {
    if (!confirm('Valider cette candidature et créer le mentor ?')) return;
    try {
      await api.post(`/pole/candidatures-mentors/${id}/valider/`);
      setCandidatures(prev => prev.map(c =>
        c.id === id ? { ...c, statut: 'VALIDATED', statut_label: 'Validée' } : c
      ));
      setSuccessMsg('Candidature validée — mentor créé.');
      setTimeout(() => setSuccessMsg(null), 4000);
      loadData(); // rafraîchit la liste des mentors
    } catch { setError('Erreur lors de la validation.'); }
  };

  const handleRejeter = async (id: number) => {
    try {
      await api.post(`/pole/candidatures-mentors/${id}/rejeter/`, { notes_rejet: rejectNote });
      setCandidatures(prev => prev.map(c =>
        c.id === id ? { ...c, statut: 'REJECTED', statut_label: 'Rejetée' } : c
      ));
      setRejectId(null);
      setRejectNote('');
      setSuccessMsg('Candidature rejetée.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch { setError('Erreur lors du rejet.'); }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, aRes, dRes] = await Promise.all([
        api.get('/pole/mentors/'),
        api.get('/pole/associations/'),
        api.get('/pole/departments/'),
      ]);
      setMentors(mRes.data.mentors ?? []);
      setAssociations(aRes.data.associations ?? []);
      setDepartments(dRes.data.departments ?? []);
    } catch {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => mentors.filter(m => {
    const matchSearch = !search.trim()
      || `${m.name} ${m.city} ${m.association} ${m.email}`.toLowerCase().includes(search.toLowerCase());
    const matchActive = filterActive === 'all'
      ? true : filterActive === 'active' ? m.is_active : !m.is_active;
    return matchSearch && matchActive;
  }), [mentors, search, filterActive]);

  const handleSaved = (saved: Mentor, tempPassword?: string) => {
    setMentors(prev => {
      const idx = prev.findIndex(m => m.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setModalMode(null);

    if (tempPassword) {
      setTempPasswordInfo({ name: saved.name, email: saved.email, password: tempPassword });
    } else {
      setSuccessMsg(modalMode === 'create' ? 'Mentor créé avec succès.' : 'Mentor mis à jour.');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const openEdit = (m: Mentor) => { setEditingMentor(m); setModalMode('edit'); };
  const openCreate = () => { setEditingMentor(null); setModalMode('create'); };

  const handleDelete = async (m: Mentor) => {
    if (!confirm(`Supprimer définitivement ${m.name} ?\n\nCette action est irréversible.`)) return;
    try {
      await api.delete(`/pole/mentors/${m.id}/`);
      setMentors(prev => prev.filter(x => x.id !== m.id));
      setSuccessMsg(`${m.name} supprimé.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Erreur lors de la suppression.');
    }
  };

  const handleToggleActive = async (m: Mentor) => {
    const action = m.is_active ? 'Désactiver' : 'Réactiver';
    if (!confirm(`${action} ${m.name} ?`)) return;
    try {
      const res = await api.patch(`/pole/mentors/${m.id}/`, { is_active: !m.is_active });
      setMentors(prev => prev.map(x => x.id === m.id ? res.data : x));
      setSuccessMsg(`${m.name} ${m.is_active ? 'désactivé' : 'réactivé'}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch { setError(`Erreur lors de la ${m.is_active ? 'désactivation' : 'réactivation'}`); }
  };

  const stats = useMemo(() => ({
    total:       mentors.length,
    actifs:      mentors.filter(m => m.is_active).length,
    disponibles: mentors.filter(m => m.is_active && !m.est_sature).length,
    formes:      mentors.filter(m => m.is_trained).length,
    avecCompte:  mentors.filter(m => m.has_account).length,
  }), [mentors]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des mentors</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {stats.actifs} actifs · {stats.disponibles} disponibles · {stats.formes} formés · {stats.avecCompte} avec compte
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-ora-blue text-white text-sm font-bold rounded-xl hover:bg-ora-blue/90 transition-all shadow-sm shadow-ora-blue/20">
          <Plus className="w-4 h-4" />Nouveau mentor
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('mentors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'mentors' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" /> Mentors ({stats.total})
        </button>
        <button
          onClick={() => setTab('candidatures')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'candidatures' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Inbox className="w-4 h-4" /> Candidatures
          {pendingCount > 0 && (
            <span className="bg-ora-orange text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Panel Candidatures ────────────────────────────────── */}
      {tab === 'candidatures' && (
        <div className="space-y-3">
          {candLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-sm p-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
            </div>
          )}
          {!candLoading && candidatures.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Aucune candidature pour le moment.</p>
            </div>
          )}
          {!candLoading && candidatures.map(c => (
            <div key={c.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                c.statut === 'PENDING' ? 'border-slate-200' :
                c.statut === 'VALIDATED' ? 'border-green-200 opacity-75' :
                'border-red-200 opacity-75'
              }`}
            >
              {/* Ligne principale */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">
                      {c.first_name} {c.last_name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.statut === 'PENDING'    ? 'bg-amber-100 text-amber-700' :
                      c.statut === 'VALIDATED'  ? 'bg-green-100 text-green-700' :
                                                  'bg-red-100 text-red-700'
                    }`}>{c.statut_label}</span>
                    {c.association_name && (
                      <span className="text-xs px-2 py-0.5 bg-ora-blue/10 text-ora-blue rounded-full font-medium">
                        {c.association_name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {c.email}{c.phone ? ` · ${c.phone}` : ''} · {c.code_postal}{c.commune ? ` ${c.commune}` : ''}
                    {c.pole_name ? ` · Pôle ${c.pole_name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.statut === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleValider(c.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Valider
                      </button>
                      <button
                        onClick={() => { setRejectId(c.id); setRejectNote(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" /> Rejeter
                      </button>
                    </>
                  )}
                  {c.statut === 'VALIDATED' && c.mentor_id && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Mentor #{c.mentor_id}
                    </span>
                  )}
                  <button
                    onClick={() => setExpandedCand(expandedCand === c.id ? null : c.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    {expandedCand === c.id
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Détail dépliable */}
              {expandedCand === c.id && (
                <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Expérience professionnelle</p>
                    <p className="text-slate-700 whitespace-pre-line">{c.experience_pro}</p>
                  </div>
                  {c.domaines.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Domaines</p>
                      <div className="flex flex-wrap gap-1">
                        {c.domaines.map(d => (
                          <span key={d} className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-600">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {c.disponibilite && (
                    <p><span className="font-medium text-slate-600">Disponibilité :</span> {c.disponibilite.replace(/_/g, ' ')}</p>
                  )}
                  {c.motivation && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Motivation</p>
                      <p className="text-slate-700 italic">{c.motivation}</p>
                    </div>
                  )}
                  {c.notes_rejet && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-600 mb-1">Motif de rejet</p>
                      <p className="text-red-700">{c.notes_rejet}</p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400">
                    Reçue le {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    {c.validated_by ? ` · Traitée par ${c.validated_by}` : ''}
                  </p>
                </div>
              )}

              {/* Zone rejet inline */}
              {rejectId === c.id && (
                <div className="border-t border-red-100 bg-red-50 px-5 py-4 space-y-3">
                  <p className="text-sm font-semibold text-red-700">Motif de rejet (optionnel)</p>
                  <textarea
                    rows={2}
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value)}
                    placeholder="Expliquez la raison du rejet pour l'archivage..."
                    className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-300 focus:outline-none resize-none bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejeter(c.id)}
                      className="px-4 py-1.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600"
                    >
                      Confirmer le rejet
                    </button>
                    <button
                      onClick={() => setRejectId(null)}
                      className="px-4 py-1.5 bg-white border border-slate-200 text-sm text-slate-600 rounded-lg hover:bg-slate-50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Panel Mentors (existant) ──────────────────────── */}
      {tab === 'mentors' && (<>

      {/* Succès */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />{successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nom, email, ville, association…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue" />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filterActive === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}>
              {f === 'all' ? `Tous (${stats.total})` : f === 'active' ? `Actifs (${stats.actifs})` : `Inactifs (${stats.total - stats.actifs})`}
            </button>
          ))}
        </div>
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
          <button onClick={loadData} className="mt-3 text-xs font-semibold text-red-600 hover:underline">Réessayer</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl py-16 text-center shadow-sm">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">Aucun mentor trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mentor</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Association</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Localisation</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Capacité</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actifs</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(m => (
                  <tr key={m.id} className={`hover:bg-slate-50/50 transition-colors ${!m.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${!m.is_active ? 'bg-slate-300' : m.est_sature ? 'bg-orange-400' : 'bg-ora-blue'}`}>
                          {m.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{m.name}</p>
                          <p className="text-[11px] text-slate-400">{m.email}</p>
                          <div className="flex gap-1 mt-0.5">
                            {m.is_trained && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                                <GraduationCap className="w-2 h-2" />Formé
                              </span>
                            )}
                            {m.has_account && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-sky-600 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded-full"
                                title={`Compte : ${m.user_email}`}>
                                <Link2 className="w-2 h-2" />Compte
                              </span>
                            )}
                            {!m.is_active && (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Inactif</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-slate-600">{m.association}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-sm text-slate-500">{m.city || '—'}</p>
                      {m.department && <p className="text-[11px] text-slate-400">{m.department}</p>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-base font-black ${m.disponibilite > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m.disponibilite}
                      </span>
                      <span className="text-xs text-slate-400">/{m.capacite_max}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold text-violet-600">{m.nb_actifs}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Edit : ACP = tous les mentors ; AP = seulement son association */}
                        {(!isAP || m.association_id === associations[0]?.id) && (
                          <button onClick={() => openEdit(m)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                            title="Modifier">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Désactiver / Réactiver */}
                        {(!isAP || m.association_id === associations[0]?.id) && (
                          <button onClick={() => handleToggleActive(m)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              m.is_active
                                ? 'hover:bg-orange-50 text-slate-400 hover:text-orange-500'
                                : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                            }`}
                            title={m.is_active ? 'Désactiver' : 'Réactiver'}>
                            {m.is_active
                              ? <UserX className="w-3.5 h-3.5" />
                              : <UserCheck className="w-3.5 h-3.5" />
                            }
                          </button>
                        )}
                        {/* Supprimer — ACP seulement (action irréversible) */}
                        {!isAP && (
                          <button onClick={() => handleDelete(m)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                            title="Supprimer définitivement">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </>)}{/* fin tab === 'mentors' */}

      {/* Modal Mentor */}
      {modalMode && (
        <MentorModal
          mode={modalMode}
          mentor={editingMentor}
          associations={associations}
          departments={departments}
          isAP={isAP}
          onClose={() => setModalMode(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Temp Password Dialog */}
      {tempPasswordInfo && (
        <TempPasswordDialog
          name={tempPasswordInfo.name}
          email={tempPasswordInfo.email}
          password={tempPasswordInfo.password}
          onClose={() => {
            setTempPasswordInfo(null);
            setSuccessMsg('Mentor créé avec succès.');
            setTimeout(() => setSuccessMsg(null), 4000);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPERS UI
// ─────────────────────────────────────────────────────────────
const INPUT = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue";

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
      <div className={`w-9 h-5 rounded-full transition-all relative ${value ? 'bg-ora-blue' : 'bg-slate-200'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-4' : 'left-0.5'}`} />
      </div>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
    </button>
  );
}
