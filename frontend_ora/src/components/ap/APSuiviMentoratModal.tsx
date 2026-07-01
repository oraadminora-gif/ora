// src/components/ap/APSuiviMentoratModal.tsx
import { useState, useEffect } from 'react';
import {
  X, Loader2, Save, Lock, Mail, Phone, MapPin,
  GraduationCap, Building2, User, Calendar, AlertCircle, CheckCircle,
  Bell,
} from 'lucide-react';
import api from '../../services/api';

interface Choice { value: string; label: string; }

interface SuiviDetail {
  id: number;
  status: string; status_label: string;
  assigned_at: string | null;
  expected_end_date: string | null;
  closed_at: string | null;
  request_date: string | null;
  alerte_rouge: boolean;
  closure_reason_code: string;
  closure_reason_label: string;
  closure_reason: string;
  nb_rencontres: number;
  nb_heures: number;
  objectif_mentor: string;
  bilan_suivi: string;
  problematiques: string[];
  type_mentorat: string;
  type_mentorat_label: string;
  closure_reason_choices: Choice[];
  problematiques_choices: Choice[];
  cloture_en_attente: boolean;
  cloture_action_demandee: string;
  cloture_reason_demandee: string;
  cloture_message_demandee: string;
  mentor: {
    first_name: string; last_name: string; email: string; phone: string;
    city: string; code_postal: string; department: string;
    association: string; is_trained: boolean; training_date: string;
    observations: string;
  } | null;
  jeune: {
    first_name: string; last_name: string; email: string; phone: string;
    birth_date: string; gender: string; gender_label: string;
    commune: string; code_postal: string; city: string;
    diplome_prepare: string; diplome_label: string;
    situation: string; situation_label: string;
    nom_etablissement: string; needs_description: string;
    request_date: string;
  } | null;
  ap_responsable: { first_name: string; last_name: string; email: string; } | null;
}

interface Props { mentoratId: number; onClose: () => void; onSaved?: () => void; }

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-400 shrink-0 w-36">{label}</span>
      <span className="text-slate-700 font-medium">{value}</span>
    </div>
  );
}

const INPUT = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue';

// ── Diplômes disponibles ──────────────────────────────────────────────────────
const DIPLOMES = [
  { value: 'CAP',       label: 'Niveau 3 — CAP' },
  { value: 'BEP',       label: 'Niveau 3 — BEP' },
  { value: 'BAC_PRO',   label: 'Niveau 4 — Bac Pro' },
  { value: 'BAC_AUTRE', label: 'Niveau 4 — Bac autres' },
  { value: 'BP',        label: 'Niveau 4 — BP' },
  { value: 'BTS',       label: 'Niveau 5 — BTS' },
  { value: 'DUT',       label: 'Niveau 5 — DUT' },
  { value: 'LIC_PRO',   label: 'Niveau 6 — Licence Pro' },
  { value: 'BUT',       label: 'Niveau 6 — BUT' },
  { value: 'MASTER',    label: 'Niveau 7 — Master' },
  { value: 'DEA',       label: 'Niveau 7 — DEA' },
  { value: 'DES',       label: "Niveau 7 — Diplôme d'études spécialisées" },
  { value: 'ING',       label: 'Niveau 7 — Ingénieur' },
];

// ── Éditeur complet du jeune ──────────────────────────────────────────────────
interface JeuneData {
  first_name: string; last_name: string; email: string; phone: string;
  birth_date: string; gender: string; gender_label: string;
  commune: string; code_postal: string; city: string;
  diplome_prepare: string; diplome_label: string;
  situation: string; situation_label: string;
  etablissement_id: number | null; nom_etablissement: string;
  needs_description: string;
}

interface EtabOption { id: number; nom: string; code_postal: string }

function JeuneEditor({ mentoratId, initial, onUpdate }: {
  mentoratId: number;
  initial: JeuneData;
  onUpdate: (updated: JeuneData) => void;
}) {
  const [editing, setEditing]             = useState(false);
  const [form, setForm]                   = useState<JeuneData>(initial);
  const [saving, setSaving]               = useState(false);
  const [err, setErr]                     = useState('');
  const [etabs, setEtabs]                 = useState<EtabOption[]>([]);
  const [etabSelectVal, setEtabSelectVal] = useState<string>(
    initial.etablissement_id ? String(initial.etablissement_id)
      : (initial.nom_etablissement ? 'autre' : '')
  );
  const [autreNom, setAutreNom]           = useState(
    initial.etablissement_id ? '' : initial.nom_etablissement
  );

  useEffect(() => {
    if (!editing) return;
    api.get<EtabOption[]>('/ap/etablissements/').then(r => setEtabs(r.data)).catch(() => {});
  }, [editing]);

  const set = (field: keyof JeuneData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setErr('');
    const payload: Record<string, unknown> = {
      first_name: form.first_name, last_name: form.last_name,
      email: form.email, phone: form.phone,
      birth_date: form.birth_date || null,
      gender: form.gender,
      commune: form.commune, code_postal: form.code_postal, city: form.commune,
      diplome_prepare: form.diplome_prepare,
      situation: form.situation,
      needs_description: form.needs_description,
    };
    if (form.situation === 'apprentissage') {
      if (etabSelectVal && etabSelectVal !== 'autre') {
        payload.etablissement_id = Number(etabSelectVal);
      } else {
        payload.etablissement_id  = null;
        payload.nom_etablissement = autreNom.trim();
      }
    } else {
      payload.etablissement_id  = null;
      payload.nom_etablissement = '';
    }
    try {
      const res = await api.patch<JeuneData>(`/ap/mentorats/${mentoratId}/jeune/`, payload);
      setForm(res.data);
      setEtabSelectVal(
        res.data.etablissement_id ? String(res.data.etablissement_id)
          : (res.data.nom_etablissement ? 'autre' : '')
      );
      setAutreNom(res.data.etablissement_id ? '' : res.data.nom_etablissement);
      onUpdate(res.data);
      setEditing(false);
    } catch { setErr('Erreur de sauvegarde.'); }
    finally { setSaving(false); }
  };

  if (!editing) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            {form.email && <div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" />{form.email}</div>}
            {form.phone && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" />{form.phone}</div>}
            {(form.commune || form.city) && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {form.code_postal && `${form.code_postal} `}{form.commune || form.city}
              </div>
            )}
            {form.birth_date && <div className="text-sm text-slate-600">{new Date(form.birth_date).toLocaleDateString('fr-FR')}{form.gender_label ? ` · ${form.gender_label}` : ''}</div>}
            {form.diplome_label && <div className="text-sm text-slate-600">{form.diplome_label}</div>}
            <div className="text-sm text-slate-600">
              <span className="font-medium">{form.situation_label || '—'}</span>
              {form.nom_etablissement && <span className="text-slate-400"> · {form.nom_etablissement}</span>}
            </div>
            {form.needs_description && <p className="text-sm text-slate-500 italic leading-relaxed">{form.needs_description}</p>}
          </div>
          <button onClick={() => setEditing(true)}
            className="text-xs text-ora-blue hover:underline shrink-0 mt-0.5">Modifier</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-white border-2 border-ora-blue/20 rounded-xl">
      {err && <p className="text-xs text-red-600">{err}</p>}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prénom</label>
          <input value={form.first_name} onChange={set('first_name')} className={INPUT} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nom</label>
          <input value={form.last_name} onChange={set('last_name')} className={INPUT} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
          <input type="email" value={form.email} onChange={set('email')} className={INPUT} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Téléphone</label>
          <input type="tel" value={form.phone} onChange={set('phone')} className={INPUT} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Code postal</label>
          <input value={form.code_postal} onChange={set('code_postal')} className={INPUT} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Commune</label>
          <input value={form.commune} onChange={set('commune')} className={INPUT} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date de naissance</label>
          <input type="date" value={form.birth_date} onChange={set('birth_date')} className={INPUT} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Genre</label>
          <select value={form.gender} onChange={set('gender')} className={INPUT}>
            <option value="">— Non précisé —</option>
            <option value="M">Garçon</option>
            <option value="F">Fille</option>
            <option value="O">Autre</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Diplôme préparé</label>
        <select value={form.diplome_prepare} onChange={set('diplome_prepare')} className={INPUT}>
          <option value="">— Choisir —</option>
          {DIPLOMES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Situation</label>
        <div className="flex gap-2">
          {([['apprentissage', 'En apprentissage'], ['recherche', 'En recherche']] as [string,string][]).map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => setForm(prev => ({ ...prev, situation: val }))}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                form.situation === val ? 'bg-ora-blue text-white border-ora-blue' : 'bg-white text-slate-500 border-slate-200'
              }`}>{lbl}</button>
          ))}
        </div>
      </div>

      {form.situation === 'apprentissage' && (
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Établissement / CFA</label>
          <select value={etabSelectVal}
            onChange={e => {
              const v = e.target.value;
              setEtabSelectVal(v);
              if (v === 'autre') { setForm(prev => ({ ...prev, etablissement_id: null })); }
              else if (v === '') { setForm(prev => ({ ...prev, etablissement_id: null })); setAutreNom(''); }
              else { setForm(prev => ({ ...prev, etablissement_id: Number(v) })); setAutreNom(''); }
            }}
            className={INPUT}>
            <option value="">— Sélectionner un CFA —</option>
            {etabs.map(e => (
              <option key={e.id} value={String(e.id)}>
                {e.nom}{e.code_postal ? ` (${e.code_postal})` : ''}
              </option>
            ))}
            <option value="autre">Autre…</option>
          </select>
          {etabSelectVal === 'autre' && (
            <input type="text" value={autreNom} onChange={e => setAutreNom(e.target.value)}
              placeholder="Nom de l'établissement…" className={INPUT} />
          )}
        </div>
      )}

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Demande</label>
        <textarea rows={3} value={form.needs_description} onChange={set('needs_description')}
          className={`${INPUT} resize-none`} />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => { setEditing(false); setForm(initial); }}
          className="flex-1 py-2 text-sm text-slate-500 border border-slate-200 rounded-xl">Annuler</button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex-1 py-2 text-sm font-bold text-white bg-ora-blue rounded-xl disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

// ── Section financeur du mentorat ─────────────────────────────────────────────
interface MF { id: number; financement_id: number; financement_nom: string; financement_code: string; type_label: string; }
interface Fin { id: number; nom: string; code: string; type_label: string; }

function FinanceurSection({ mentoratId }: { mentoratId: number }) {
  const [mfs, setMfs]           = useState<MF[]>([]);
  const [fins, setFins]         = useState<Fin[]>([]);
  const [selected, setSelected] = useState('');
  const [adding, setAdding]     = useState(false);
  const [loading, setLoading]   = useState(true);
  // Création inline
  const [showCreate, setShowCreate] = useState(false);
  const [createNom, setCreateNom]   = useState('');
  const [createCode, setCreateCode] = useState('');
  const [createType, setCreateType] = useState<'local'|'national'>('local');
  const [creating, setCreating]     = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get<{ financements: MF[] }>(`/ap/mentorats/${mentoratId}/financements/`),
      api.get<{ financements: Fin[] }>('/financements/'),
    ]).then(([mfRes, finRes]) => {
      setMfs(mfRes.data.financements ?? []);
      setFins(finRes.data.financements ?? []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [mentoratId]);

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true);
    try {
      await api.post(`/ap/mentorats/${mentoratId}/financements/`, { financement_id: Number(selected) });
      setSelected('');
      loadAll();
    } finally { setAdding(false); }
  };

  const handleRemove = async (mfId: number) => {
    await api.delete(`/ap/mentorats/${mentoratId}/financements/${mfId}/`);
    loadAll();
  };

  const handleCreate = async () => {
    if (!createNom.trim() || !createCode.trim()) return;
    setCreating(true);
    try {
      const res = await api.post<Fin>('/financements/', { nom: createNom.trim(), code: createCode.trim().toUpperCase(), type: createType });
      setFins(prev => [...prev, res.data]);
      setSelected(String(res.data.id));
      setShowCreate(false); setCreateNom(''); setCreateCode('');
    } finally { setCreating(false); }
  };

  if (loading) return <p className="text-xs text-slate-400">Chargement des financeurs…</p>;

  const usedIds = new Set(mfs.map(m => m.financement_id));
  const available = fins.filter(f => !usedIds.has(f.id));

  return (
    <div className="space-y-2">
      {mfs.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Aucun financeur associé</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {mfs.map(mf => (
            <span key={mf.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold rounded-full">
              {mf.financement_nom} <span className="text-violet-400">({mf.financement_code})</span>
              <button onClick={() => handleRemove(mf.id)} className="text-violet-400 hover:text-red-500 transition-colors">×</button>
            </span>
          ))}
        </div>
      )}
      {!showCreate ? (
        <div className="flex gap-2">
          <select value={selected} onChange={e => e.target.value === '__create__' ? (setShowCreate(true), setSelected('')) : setSelected(e.target.value)}
            className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40 focus:border-ora-blue bg-white">
            <option value="">— Choisir un financeur —</option>
            {available.map(f => <option key={f.id} value={f.id}>{f.nom} ({f.code})</option>)}
            <option value="__create__">+ Créer un nouveau…</option>
          </select>
          <button onClick={handleAdd} disabled={!selected || adding}
            className="px-3 py-1.5 bg-ora-blue text-white text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-ora-blue/90">
            {adding ? '…' : 'Ajouter'}
          </button>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <input type="text" placeholder="Nom *" value={createNom} onChange={e => setCreateNom(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40" />
          <div className="flex gap-2">
            <input type="text" placeholder="Code *" value={createCode} onChange={e => setCreateCode(e.target.value.toUpperCase())}
              className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40" />
            {(['local','national'] as const).map(t => (
              <button key={t} type="button" onClick={() => setCreateType(t)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${createType === t ? 'bg-ora-blue text-white border-ora-blue' : 'bg-white text-slate-500 border-slate-200'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-1 text-xs text-slate-500 border border-slate-200 rounded-lg">Annuler</button>
            <button onClick={handleCreate} disabled={creating} className="flex-1 py-1 text-xs font-semibold text-white bg-ora-blue rounded-lg disabled:opacity-50">{creating ? '…' : 'Créer'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function APSuiviMentoratModal({ mentoratId, onClose, onSaved }: Props) {
  const [data, setData]         = useState<SuiviDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // Champs éditables
  const [expectedEnd, setExpectedEnd]         = useState('');
  const [nbRencontres, setNbRencontres]       = useState('0');
  const [nbHeures, setNbHeures]               = useState('0');
  const [objectif, setObjectif]               = useState('');
  const [bilan, setBilan]                     = useState('');
  const [problematiques, setProblematiques]   = useState<string[]>([]);
  const [typeMentorat, setTypeMentorat]       = useState('');
  const [closureCode, setClosureCode]         = useState('');
  const [closedAt, setClosedAt]               = useState('');


  useEffect(() => {
    api.get<SuiviDetail>(`/ap/mentorats/${mentoratId}/suivi-detail/`).then(r => {
      const d = r.data;
      setData(d);
      setExpectedEnd(d.expected_end_date ?? '');
      setNbRencontres(String(d.nb_rencontres));
      setNbHeures(String(d.nb_heures));
      setObjectif(d.objectif_mentor);
      setBilan(d.bilan_suivi);
      setProblematiques(d.problematiques ?? []);
      setTypeMentorat(d.type_mentorat ?? '');
      setClosureCode(d.closure_reason_code ?? '');
      setClosedAt(d.closed_at ?? '');
    }).catch(() => setError('Erreur de chargement')).finally(() => setLoading(false));
  }, [mentoratId]);

  const toggleProb = (code: string) => {
    setProblematiques(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const buildPayload = () => ({
    expected_end_date: expectedEnd || null,
    nb_rencontres:     Number(nbRencontres) || 0,
    nb_heures:         Number(nbHeures) || 0,
    objectif_mentor:   objectif,
    bilan_suivi:       bilan,
    problematiques,
    type_mentorat:     typeMentorat,
  });

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = buildPayload();
      const res = await api.patch<SuiviDetail>(`/ap/mentorats/${mentoratId}/suivi-detail/`, payload);
      setData(res.data);
      onSaved?.();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { error?: string; detail?: string } }; message?: string };
      const msg = err.response?.data?.error
        ?? err.response?.data?.detail
        ?? (err.response?.status ? `Erreur ${err.response.status}` : err.message)
        ?? 'Erreur lors de la sauvegarde.';
      setError(msg);
    } finally { setSaving(false); }
  };

  const [confirmSaving, setConfirmSaving] = useState(false);
  const [confirmError,  setConfirmError]  = useState('');

  const handleConfirmerCloture = async (action: 'confirm' | 'reject') => {
    if (!data) return;
    setConfirmSaving(true); setConfirmError('');
    try {
      await api.post(`/ap/mentorats/${data.id}/confirmer-cloture/`, { action });
      onSaved?.();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setConfirmError(err.response?.data?.error ?? 'Erreur');
    } finally { setConfirmSaving(false); }
  };

  const canCloturer = closureCode && closedAt && data?.status === 'ACTIVE';

  const handleCloturer = async () => {
    if (!canCloturer) return;
    if (!confirm('Confirmer la clôture de ce mentorat ?')) return;
    setSaving(true); setError('');
    try {
      const res = await api.patch<SuiviDetail>(`/ap/mentorats/${mentoratId}/suivi-detail/`, {
        ...buildPayload(),
        cloturer: true,
        closure_reason_code: closureCode,
        closed_at: closedAt,
      });
      setData(res.data);
      setSuccess('Mentorat clôturé.');
      onSaved?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error ?? 'Erreur lors de la clôture.');
    } finally { setSaving(false); }
  };

  const isClosed = data?.status === 'CLOSED' || data?.status === 'ABORTED';


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Suivi du mentorat</h2>
            {data && (
              <p className="text-xs text-slate-400 mt-0.5">
                {data.mentor ? `${data.mentor.first_name} ${data.mentor.last_name}` : ''}
                {data.jeune ? ` · ${data.jeune.first_name} ${data.jeune.last_name}` : ''}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  data.status === 'ACTIVE'  ? 'bg-emerald-100 text-emerald-700' :
                  data.status === 'CLOSED'  ? 'bg-slate-100 text-slate-500' :
                  data.status === 'ABORTED' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-700'
                }`}>{data.status_label}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-ora-blue" />
          </div>
        ) : !data ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : (
          <div className="overflow-y-auto max-h-[80vh]">
            <div className="px-6 py-5 space-y-6">

              {/* Dates */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />Dates
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Date de demande"   value={data.jeune?.request_date ? new Date(data.jeune.request_date).toLocaleDateString('fr-FR') : ''} />
                  <InfoRow label="Date d'affectation" value={data.assigned_at ? new Date(data.assigned_at).toLocaleDateString('fr-FR') : ''} />
                  {data.closed_at && <InfoRow label="Date de clôture" value={new Date(data.closed_at).toLocaleDateString('fr-FR')} />}
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date prévisionnelle de fin</label>
                  <input type="date" value={expectedEnd} onChange={e => setExpectedEnd(e.target.value)}
                    disabled={isClosed} className={INPUT} />
                </div>
              </section>

              {/* Jeune */}
              {data.jeune && (
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />Jeune
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-2">
                      {data.jeune.first_name} {data.jeune.last_name}
                    </p>
                    <JeuneEditor
                      mentoratId={data.id}
                      initial={data.jeune}
                      onUpdate={updated => setData(prev => prev ? { ...prev, jeune: { ...prev.jeune!, ...updated } } : prev)}
                    />
                  </div>
                </section>
              )}

              {/* Mentor */}
              {data.mentor && (
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" />Mentor
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <p className="font-semibold text-slate-900">{data.mentor.first_name} {data.mentor.last_name}
                      {data.mentor.is_trained && <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">Formé{data.mentor.training_date ? ` (${new Date(data.mentor.training_date).toLocaleDateString('fr-FR', {month:'short',year:'numeric'})})` : ''}</span>}
                    </p>
                    {data.mentor.email && <div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" />{data.mentor.email}</div>}
                    {data.mentor.phone && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" />{data.mentor.phone}</div>}
                    {(data.mentor.city || data.mentor.code_postal) && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {data.mentor.code_postal && `${data.mentor.code_postal} `}{data.mentor.city}{data.mentor.department ? ` · ${data.mentor.department}` : ''}
                      </div>
                    )}
                    <InfoRow label="Association" value={data.mentor.association} />
                    {data.mentor.observations && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Particularité pour l'affectation</p>
                        <p className="text-sm text-amber-800">{data.mentor.observations}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Suivi éditable */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Suivi</h3>
                <div className="space-y-4">

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre de rencontres</label>
                      <input type="number" min="0" value={nbRencontres} onChange={e => setNbRencontres(e.target.value)}
                        disabled={isClosed} className={INPUT} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre d'heures</label>
                      <input type="number" min="0" step="0.5" value={nbHeures} onChange={e => setNbHeures(e.target.value)}
                        disabled={isClosed} className={INPUT} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Type de mentorat</label>
                    <div className="flex gap-2">
                      {([['', '— Non renseigné —'], ['presentiel', 'Présentiel'], ['distanciel', 'Distanciel']] as [string, string][]).map(([val, lbl]) => (
                        <button key={val} type="button"
                          disabled={isClosed}
                          onClick={() => setTypeMentorat(val)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            typeMentorat === val
                              ? 'bg-ora-blue text-white border-ora-blue'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}>{lbl}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Problématique(s)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {data.problematiques_choices.map(c => (
                        <button key={c.value} type="button"
                          disabled={isClosed}
                          onClick={() => toggleProb(c.value)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                            problematiques.includes(c.value)
                              ? 'bg-ora-blue text-white border-ora-blue'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Objectif du mentor</label>
                    <textarea rows={3} value={objectif} onChange={e => setObjectif(e.target.value)}
                      disabled={isClosed} placeholder="Objectif défini pour ce mentorat…"
                      className={`${INPUT} resize-none`} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Bilan sommaire du suivi</label>
                    <textarea rows={4} value={bilan} onChange={e => setBilan(e.target.value)}
                      disabled={isClosed} placeholder="Bilan global du suivi de ce mentorat…"
                      className={`${INPUT} resize-none`} />
                  </div>
                </div>
              </section>

              {/* Financeur */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Financeur</h3>
                <FinanceurSection mentoratId={data.id} />
              </section>

              {/* ── Clôture demandée par le mentor ── */}
              {data.cloture_en_attente && !isClosed && (
                <section className="border-2 border-amber-300 rounded-xl p-4 space-y-3 bg-amber-50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-800">Le mentor demande la clôture</h3>
                      {data.cloture_reason_demandee && (
                        <p className="text-xs text-amber-700 mt-0.5">
                          Raison : {
                            data.closure_reason_choices.find(c => c.value === data.cloture_reason_demandee)?.label
                            ?? data.cloture_reason_demandee
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  {data.cloture_message_demandee && (
                    <div className="bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {data.cloture_message_demandee}
                    </div>
                  )}
                  {confirmError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{confirmError}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleConfirmerCloture('confirm')} disabled={confirmSaving}
                      className="flex-1 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all">
                      {confirmSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Confirmer la clôture
                    </button>
                    <button onClick={() => handleConfirmerCloture('reject')} disabled={confirmSaving}
                      className="flex-1 py-2 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all">
                      <X className="w-4 h-4" /> Rejeter
                    </button>
                  </div>
                </section>
              )}

              {/* Clôture */}
              {!isClosed && (
                <section className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clôture</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Date de clôture *</label>
                      <input type="date" value={closedAt} onChange={e => setClosedAt(e.target.value)} className={INPUT} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Raison de clôture *</label>
                      <select value={closureCode} onChange={e => setClosureCode(e.target.value)} className={INPUT}>
                        <option value="">— Choisir —</option>
                        {data.closure_reason_choices.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {!canCloturer && (closedAt || closureCode) && (
                    <p className="text-xs text-amber-600">Complétez la date ET la raison pour pouvoir clôturer.</p>
                  )}
                </section>
              )}

              {isClosed && data.closure_reason_label && (
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Raison de clôture</p>
                  <p className="text-sm text-slate-700">{data.closure_reason_label}</p>
                  {data.closed_at && <p className="text-xs text-slate-400 mt-0.5">Le {new Date(data.closed_at).toLocaleDateString('fr-FR')}</p>}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                  <CheckCircle className="w-4 h-4 shrink-0" />{success}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white sticky bottom-0 rounded-b-2xl flex items-center justify-between gap-3">
              <button onClick={onClose}
                className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50">
                Fermer
              </button>
              <div className="flex gap-2">
                {!isClosed && (
                  <>
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-ora-blue text-white text-sm font-bold rounded-xl hover:bg-ora-blue/90 disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Enregistrer le suivi
                    </button>
                    <button onClick={handleCloturer} disabled={saving || !canCloturer}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-bold rounded-xl hover:bg-slate-800 disabled:opacity-40">
                      <Lock className="w-4 h-4" />
                      Clôturer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
