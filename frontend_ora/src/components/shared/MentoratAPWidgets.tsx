// src/components/shared/MentoratAPWidgets.tsx
// Composants partagés entre AP (APMentorDetailModal) et ACP (GestionMentorats)
import { useState, useEffect } from 'react';
import {
  X, Loader2, AlertTriangle, CheckCircle, Calendar,
  Users, Plus, Pencil, Trash2, Video, PhoneCall, MessageSquare, Lock,
} from 'lucide-react';
import api from '../../services/api';

interface ApiError { response?: { data?: { error?: string } } }

// ── Types ──────────────────────────────────────────────────────────────────────
interface SuiviRencontre {
  id: number;
  date_rencontre: string;
  duree_minutes: number;
  type_rencontre: string;
  type_rencontre_label: string;
  objectifs_atteints: boolean;
  notes: string;
}

interface SuiviFormData {
  date_rencontre: string;
  duree_minutes: number;
  type_rencontre: string;
  objectifs_atteints: boolean;
  notes: string;
}

interface SuiviData {
  problematiques: string[];
  dernier_contact: string | null;
  expected_end_date: string | null;
  alerte_rouge: boolean;
  jeune_gender: string;
  jeune_birth_date: string | null;
  jeune_diplome_prepare: string;
  jeune_situation: string;
  jeune_urgency_level: number;
  jeune_etablissement_id: number | null;
  jeune_nom_etablissement: string;
}

interface MentoratFinancement {
  id: number;
  financement_id: number;
  financement_nom: string;
  financement_code: string;
  type: string;
  type_label: string;
  code_specifique: string;
}

interface FinancementOption { id: number; nom: string; code: string; type: string; }
interface EtabOption { id: number; nom: string; code_postal: string; }

// ── Constants ──────────────────────────────────────────────────────────────────
const TYPE_OPTIONS = [
  { value: 'PRESENTIEL', label: 'Présentiel', icon: Users },
  { value: 'VISIO',      label: 'Visio',      icon: Video },
  { value: 'TELEPHONE',  label: 'Téléphone',  icon: PhoneCall },
  { value: 'EMAIL',      label: 'Email/Msg',  icon: MessageSquare },
];

const EMPTY_FORM: SuiviFormData = {
  date_rencontre: new Date().toISOString().slice(0, 10),
  duree_minutes: 60,
  type_rencontre: 'PRESENTIEL',
  objectifs_atteints: false,
  notes: '',
};

const PROBLEMATIQUES: { code: string; label: string }[] = [
  { code: 'aide_informatique',   label: 'Aide informatique' },
  { code: 'fle',                 label: 'Apprentissage du français (FLE)' },
  { code: 'changer_employeur',   label: "Changer d'employeur" },
  { code: 'handicap',            label: 'Handicap' },
  { code: 'logement',            label: 'Logement' },
  { code: 'orientation',         label: 'Orientation' },
  { code: 'prob_administratif',  label: 'Problème administratif' },
  { code: 'prob_financier',      label: 'Problème financier — Gérer Budget' },
  { code: 'fragilite_mentale',   label: 'Fragilité mentale' },
  { code: 'prep_dossier',        label: 'Prép dossier professionnel' },
  { code: 'relation_employeur',  label: "Relation avec l'employeur" },
  { code: 'recherche_contrat',   label: 'Recherche contrat apprentissage' },
  { code: 'salaire',             label: 'Salaire / Respect de convention' },
  { code: 'soutien_moral',       label: 'Soutien moral' },
  { code: 'soutien_scolaire',    label: 'Soutien scolaire' },
  { code: 'autre',               label: 'Autre' },
];

const INPUT_CLS = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue bg-white transition-all';

// ── APSuiviForm ────────────────────────────────────────────────────────────────
export function APSuiviForm({
  mentoratId, initial, suiId, onSaved, onCancel,
}: {
  mentoratId: number;
  initial?: SuiviFormData;
  suiId?: number;
  onSaved: (s: SuiviRencontre) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<SuiviFormData>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      const res = suiId
        ? await api.patch<SuiviRencontre>(`/ap/mentorats/${mentoratId}/suivis/${suiId}/`, form)
        : await api.post<SuiviRencontre>(`/ap/mentorats/${mentoratId}/suivis/`, form);
      onSaved(res.data);
    } catch (err) {
      setError((err as ApiError).response?.data?.error ?? 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 mt-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</label>
          <input type="date" required value={form.date_rencontre}
            onChange={e => setForm({ ...form, date_rencontre: e.target.value })}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-ora-blue/30 bg-white"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Durée (min)</label>
          <input type="number" required min={5} max={480} value={form.duree_minutes}
            onChange={e => setForm({ ...form, duree_minutes: parseInt(e.target.value) || 30 })}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-ora-blue/30 bg-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" onClick={() => setForm({ ...form, type_rencontre: value })}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
              form.type_rencontre === value
                ? 'bg-ora-blue text-white border-ora-blue'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Icon className="w-3 h-3" /> {label}
          </button>
        ))}
      </div>
      <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
        rows={2} placeholder="Notes de la rencontre…"
        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-ora-blue/30 resize-none bg-white"
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <div onClick={() => setForm({ ...form, objectifs_atteints: !form.objectifs_atteints })}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
            form.objectifs_atteints ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
          }`}>
          {form.objectifs_atteints && <CheckCircle className="w-2.5 h-2.5 text-white" />}
        </div>
        <span className="text-xs text-slate-600">Objectifs atteints</span>
      </label>
      {error && <p className="text-[11px] text-red-600 bg-red-50 rounded-lg px-2 py-1">{error}</p>}
      <div className="flex gap-1.5">
        <button type="button" onClick={onCancel}
          className="flex-1 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-white">Annuler</button>
        <button type="submit" disabled={saving}
          className="flex-1 py-1.5 bg-ora-blue text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1">
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          {suiId ? 'Modifier' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

// ── APSuiviPanel ───────────────────────────────────────────────────────────────
export function APSuiviPanel({ mentoratId }: { mentoratId: number }) {
  const [suivis, setSuivis] = useState<SuiviRencontre[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get<{ suivis: SuiviRencontre[] }>(`/ap/mentorats/${mentoratId}/suivis/`)
      .then(r => setSuivis(r.data.suivis))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mentoratId]);

  const handleSaved = (saved: SuiviRencontre) => {
    setSuivis(prev => editId ? prev.map(s => s.id === editId ? saved : s) : [saved, ...prev]);
    setShowForm(false); setEditId(null);
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await api.delete(`/ap/mentorats/${mentoratId}/suivis/${id}/`);
      setSuivis(prev => prev.filter(s => s.id !== id));
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  };

  const formatDureeMin = (min: number) => min < 60 ? `${min}min` : `${Math.floor(min/60)}h${min%60 ? String(min%60).padStart(2,'0') : ''}`;

  if (loading) return <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-slate-300" /></div>;

  return (
    <div className="mt-2 space-y-2">
      {suivis.length === 0 && !showForm && (
        <p className="text-[11px] text-slate-300 text-center py-2">Aucune rencontre enregistrée</p>
      )}
      {suivis.map(s => (
        <div key={s.id} className="bg-white border border-slate-100 rounded-lg px-3 py-2">
          {editId === s.id ? (
            <APSuiviForm
              mentoratId={mentoratId}
              suiId={s.id}
              initial={{ date_rencontre: s.date_rencontre, duree_minutes: s.duree_minutes, type_rencontre: s.type_rencontre, objectifs_atteints: s.objectifs_atteints, notes: s.notes }}
              onSaved={handleSaved}
              onCancel={() => setEditId(null)}
            />
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-700">{new Date(s.date_rencontre).toLocaleDateString('fr-FR')}</span>
                  <span className="text-[10px] text-slate-400">{formatDureeMin(s.duree_minutes)}</span>
                  <span className="text-[10px] text-slate-400">{s.type_rencontre_label}</span>
                  {s.objectifs_atteints && <span className="text-[10px] text-emerald-600 font-semibold">✓ Obj. atteints</span>}
                </div>
                {s.notes && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{s.notes}</p>}
              </div>
              <div className="flex gap-0.5 shrink-0">
                <button onClick={() => { setEditId(s.id); setShowForm(false); }}
                  className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-ora-blue transition-colors">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                  className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50">
                  {deleting === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {showForm && !editId && (
        <APSuiviForm mentoratId={mentoratId} onSaved={handleSaved} onCancel={() => setShowForm(false)} />
      )}
      {!showForm && !editId && (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-slate-200 text-slate-400 hover:text-ora-blue hover:border-ora-blue rounded-lg text-[11px] font-semibold transition-colors">
          <Plus className="w-3 h-3" /> Ajouter une rencontre
        </button>
      )}
    </div>
  );
}

// ── APSuiviPanelModal (rencontres dans une fenêtre modale) ─────────────────────
export function APSuiviPanelModal({
  mentoratId, jeuneName, onClose,
}: {
  mentoratId: number;
  jeuneName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-ora-blue" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Rencontres de suivi</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{jeuneName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <APSuiviPanel mentoratId={mentoratId} />
        </div>
      </div>
    </div>
  );
}

// ── APMentoratSuiviModal ───────────────────────────────────────────────────────
export function APMentoratSuiviModal({
  mentoratId, jeuneName, onClose,
}: {
  mentoratId: number;
  jeuneName: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<SuiviData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [etabs, setEtabs] = useState<EtabOption[]>([]);
  const [financements, setFinancements] = useState<MentoratFinancement[]>([]);
  const [fOptions, setFOptions] = useState<FinancementOption[]>([]);
  const [addingF, setAddingF] = useState(false);
  const [selFId, setSelFId] = useState('');
  const [codeSpec, setCodeSpec] = useState('');
  const [savingF, setSavingF] = useState(false);
  const [showAddEtab, setShowAddEtab] = useState(false);
  const [newEtabNom, setNewEtabNom] = useState('');
  const [newEtabCp, setNewEtabCp] = useState('');
  const [addingEtab, setAddingEtab] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<SuiviData>(`/ap/mentorats/${mentoratId}/suivi/`),
      api.get<{ financements: MentoratFinancement[] }>(`/ap/mentorats/${mentoratId}/financements/`),
      api.get<EtabOption[]>('/ap/etablissements/'),
      api.get<{ financements: FinancementOption[] }>('/financements/'),
    ]).then(([s, f, e, fo]) => {
      setData(s.data);
      setFinancements(f.data.financements ?? []);
      setEtabs(e.data);
      setFOptions(fo.data.financements ?? []);
    }).catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [mentoratId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSaving(true); setError(null);
    try {
      const res = await api.patch<SuiviData>(`/ap/mentorats/${mentoratId}/suivi/`, {
        problematiques:    data.problematiques,
        alerte_rouge:      data.alerte_rouge,
        dernier_contact:   data.dernier_contact || null,
        expected_end_date: data.expected_end_date || null,
        gender:            data.jeune_gender,
        birth_date:        data.jeune_birth_date || null,
        diplome_prepare:   data.jeune_diplome_prepare,
        situation:         data.jeune_situation,
        urgency_level:     data.jeune_urgency_level,
        ...(data.jeune_etablissement_id
          ? { etablissement_id: data.jeune_etablissement_id }
          : { etablissement_id: null, nom_etablissement: data.jeune_nom_etablissement }),
      });
      setData(res.data);
      onClose();
    } catch (err) {
      setError((err as ApiError).response?.data?.error ?? 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const toggleProblematique = (code: string) => {
    if (!data) return;
    const sel = data.problematiques;
    setData({ ...data, problematiques: sel.includes(code) ? sel.filter(c => c !== code) : sel.length < 3 ? [...sel, code] : sel });
  };

  const handleAddFinancement = async () => {
    if (!selFId) return;
    setSavingF(true);
    try {
      const res = await api.post<MentoratFinancement>(`/ap/mentorats/${mentoratId}/financements/`, {
        financement_id: Number(selFId), code_specifique: codeSpec.trim(),
      });
      setFinancements(prev => {
        const exists = prev.find(i => i.financement_id === res.data.financement_id);
        return exists ? prev.map(i => i.financement_id === res.data.financement_id ? { ...i, code_specifique: res.data.code_specifique } : i) : [...prev, res.data];
      });
      setAddingF(false); setSelFId(''); setCodeSpec('');
    } catch { /* silent */ } finally { setSavingF(false); }
  };

  const handleRemoveFinancement = async (mfId: number) => {
    try {
      await api.delete(`/ap/mentorats/${mentoratId}/financements/${mfId}/`);
      setFinancements(prev => prev.filter(i => i.id !== mfId));
    } catch { /* silent */ }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );

  if (!data) return null;

  const etabSelectValue = data.jeune_etablissement_id ? String(data.jeune_etablissement_id) : (data.jeune_nom_etablissement ? 'autre' : '');

  const handleEtabChange = (val: string) => {
    if (val === 'autre') setData({ ...data, jeune_etablissement_id: null });
    else if (val === '') setData({ ...data, jeune_etablissement_id: null, jeune_nom_etablissement: '' });
    else setData({ ...data, jeune_etablissement_id: Number(val), jeune_nom_etablissement: '' });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Suivi du mentorat</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">{jeuneName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSave} className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

          {/* ── Problématiques ── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Problématiques</h3>
              <span className="text-[10px] text-slate-400">{data.problematiques.length}/3 sélectionnée{data.problematiques.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PROBLEMATIQUES.map(({ code, label }) => {
                const isSel = data.problematiques.includes(code);
                const isDisabled = !isSel && data.problematiques.length >= 3;
                return (
                  <button key={code} type="button" onClick={() => toggleProblematique(code)}
                    disabled={isDisabled}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      isSel ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                      : isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700'
                    }`}>
                    {label}
                  </button>
                );
              })}
            </div>
            {data.problematiques.length === 3 && (
              <p className="text-[10px] text-amber-600">Maximum 3 problématiques. Désélectionnez-en une pour changer.</p>
            )}
          </section>

          {/* ── Dates & Alertes ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Dates & Alertes
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dernier contact</label>
                <input type="date" value={data.dernier_contact ?? ''} onChange={e => setData({ ...data, dernier_contact: e.target.value })} className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fin prévue</label>
                <input type="date" value={data.expected_end_date ?? ''} onChange={e => setData({ ...data, expected_end_date: e.target.value })} className={INPUT_CLS} />
              </div>
            </div>
            <button type="button" onClick={() => setData({ ...data, alerte_rouge: !data.alerte_rouge })}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold w-full transition-all ${
                data.alerte_rouge ? 'bg-red-50 border-red-300 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}>
              <AlertTriangle className={`w-4 h-4 ${data.alerte_rouge ? 'text-red-500' : 'text-slate-400'}`} />
              {data.alerte_rouge ? 'Alerte rouge activée — cliquer pour désactiver' : 'Activer une alerte rouge'}
            </button>
          </section>

          {/* ── Informations du jeune ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informations du jeune</h3>

            {/* Genre */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Genre</label>
              <div className="flex gap-2">
                {([['M', 'Garçon'], ['F', 'Fille'], ['O', 'Autre']] as [string, string][]).map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => setData({ ...data, jeune_gender: val })}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      data.jeune_gender === val ? 'bg-ora-blue/8 border-ora-blue text-ora-blue' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Date naissance */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date de naissance</label>
              <input type="date" value={data.jeune_birth_date ?? ''} onChange={e => setData({ ...data, jeune_birth_date: e.target.value })} className={INPUT_CLS} />
            </div>

            {/* Diplôme */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diplôme préparé</label>
              <select value={data.jeune_diplome_prepare} onChange={e => setData({ ...data, jeune_diplome_prepare: e.target.value })} className={INPUT_CLS}>
                <option value="">— Sélectionner —</option>
                <optgroup label="Niveau 3"><option value="CAP">CAP</option><option value="BEP">BEP</option></optgroup>
                <optgroup label="Niveau 4"><option value="BAC_PRO">Bac Pro</option><option value="BAC_AUTRE">Bac autres</option><option value="BP">BP</option></optgroup>
                <optgroup label="Niveau 5"><option value="BTS">BTS</option><option value="DUT">DUT</option></optgroup>
                <optgroup label="Niveau 6"><option value="LIC_PRO">Licence Pro</option><option value="BUT">BUT</option></optgroup>
                <optgroup label="Niveau 7"><option value="MASTER">Master</option><option value="DEA">DEA</option><option value="DES">Diplôme d'études spécialisées</option><option value="ING">Ingénieur</option></optgroup>
              </select>
            </div>

            {/* Situation */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Situation</label>
              <div className="flex gap-2">
                {([['apprentissage', 'Déjà en apprentissage'], ['recherche', "En recherche d'apprentissage"]] as [string, string][]).map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => setData({ ...data, jeune_situation: val })}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      data.jeune_situation === val ? 'bg-ora-blue/8 border-ora-blue text-ora-blue' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Urgence */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Niveau d'urgence</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <button key={lvl} type="button" onClick={() => setData({ ...data, jeune_urgency_level: lvl })}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                      data.jeune_urgency_level === lvl
                        ? lvl >= 4 ? 'bg-red-500 border-red-500 text-white' : lvl === 3 ? 'bg-amber-400 border-amber-400 text-white' : 'bg-green-500 border-green-500 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}>
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {data.jeune_urgency_level <= 2 ? 'Faible urgence' : data.jeune_urgency_level === 3 ? 'Urgence modérée' : data.jeune_urgency_level === 4 ? 'Urgence élevée' : 'Urgence critique'}
              </p>
            </div>

            {/* Établissement */}
            {data.jeune_situation === 'apprentissage' && <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Établissement / CFA</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select value={etabSelectValue} onChange={e => handleEtabChange(e.target.value)} className={`${INPUT_CLS} flex-1`}>
                    <option value="">— Sélectionner —</option>
                    {etabs.map(e => <option key={e.id} value={String(e.id)}>{e.nom}{e.code_postal ? ` (${e.code_postal})` : ''}</option>)}
                    <option value="autre">Autre…</option>
                  </select>
                  <button type="button" onClick={() => setShowAddEtab(v => !v)}
                    className="shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-semibold text-ora-blue border border-ora-blue/30 rounded-lg hover:bg-ora-blue/5 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>
                {etabSelectValue === 'autre' && (
                  <input type="text" value={data.jeune_nom_etablissement} onChange={e => setData({ ...data, jeune_nom_etablissement: e.target.value })}
                    placeholder="Nom de l'établissement…" className={INPUT_CLS} />
                )}
                {showAddEtab && (
                  <div className="flex gap-2 p-3 bg-ora-blue/5 border border-ora-blue/20 rounded-xl">
                    <input type="text" value={newEtabNom} onChange={e => setNewEtabNom(e.target.value)} placeholder="Nom *"
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40" />
                    <input type="text" value={newEtabCp} onChange={e => setNewEtabCp(e.target.value)} placeholder="CP"
                      className="w-20 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40" />
                    <button type="button" disabled={addingEtab || !newEtabNom.trim()} onClick={async () => {
                      setAddingEtab(true);
                      try {
                        const res = await api.post<EtabOption>('/ap/etablissements/', { nom: newEtabNom.trim(), code_postal: newEtabCp.trim() });
                        setEtabs(prev => [...prev, res.data]);
                        setData({ ...data, jeune_etablissement_id: res.data.id, jeune_nom_etablissement: '' });
                        setNewEtabNom(''); setNewEtabCp(''); setShowAddEtab(false);
                      } catch { /* silent */ } finally { setAddingEtab(false); }
                    }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-ora-blue rounded-lg hover:bg-ora-blue/90 disabled:opacity-50">
                      {addingEtab ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Créer
                    </button>
                  </div>
                )}
              </div>
            </div>}
          </section>

          {/* ── Financements ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>💰</span> Financements
            </h3>
            {financements.length === 0 && !addingF && (
              <p className="text-xs text-slate-400 italic">Aucun financeur associé</p>
            )}
            <div className="space-y-1.5">
              {financements.map(mf => (
                <div key={mf.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-700">{mf.financement_nom}</span>
                    <span className="ml-1.5 text-[10px] text-slate-400 font-mono">{mf.financement_code}</span>
                    <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mf.type === 'national' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      {mf.type_label}
                    </span>
                    {mf.code_specifique && <p className="text-[10px] text-slate-400 mt-0.5">{mf.code_specifique}</p>}
                  </div>
                  <button type="button" onClick={() => handleRemoveFinancement(mf.id)}
                    className="shrink-0 p-1 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {addingF ? (
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <select value={selFId} onChange={e => setSelFId(e.target.value)} className={INPUT_CLS}>
                  <option value="">— Choisir un financeur —</option>
                  {fOptions.filter(o => !financements.find(i => i.financement_id === o.id)).map(o => (
                    <option key={o.id} value={o.id}>{o.nom} ({o.code})</option>
                  ))}
                </select>
                <input type="text" value={codeSpec} onChange={e => setCodeSpec(e.target.value)}
                  placeholder="Code contrat / dossier (optionnel)" className={INPUT_CLS} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setAddingF(false); setSelFId(''); setCodeSpec(''); }}
                    className="flex-1 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-white">Annuler</button>
                  <button type="button" onClick={handleAddFinancement} disabled={savingF || !selFId}
                    className="flex-1 py-1.5 text-xs font-semibold text-white bg-ora-blue rounded-lg hover:bg-ora-blue/90 disabled:opacity-50">
                    {savingF ? 'Ajout…' : 'Ajouter'}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setAddingF(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-ora-blue hover:underline">
                <Plus className="w-3.5 h-3.5" /> Ajouter un financeur
              </button>
            )}
          </section>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-ora-blue hover:bg-ora-dark text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-ora-blue/20">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── CloturerDirectModal ────────────────────────────────────────────────────────
export function CloturerDirectModal({
  id, jeuneName, onClose, onDone,
}: {
  id: number;
  jeuneName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [action, setAction]   = useState<'CLOSED' | 'ABORTED'>('CLOSED');
  const [reason, setReason]   = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await api.post(`/ap/mentorats/${id}/cloturer-direct/`, { action, reason, message });
      onDone();
    } catch (err) {
      setError((err as ApiError).response?.data?.error ?? 'Erreur lors de la clôture');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              Clôturer le mentorat — <span className="text-slate-500 font-normal">{jeuneName}</span>
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Action */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Type de clôture</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'CLOSED',  label: 'Clôturer', sub: 'Mentorat terminé normalement',    color: 'emerald' },
                { value: 'ABORTED', label: 'Arrêter',  sub: 'Arrêt prématuré du mentorat',     color: 'orange'  },
              ] as const).map(opt => (
                <label key={opt.value}
                  className={`flex flex-col gap-0.5 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                    action === opt.value
                      ? opt.color === 'emerald' ? 'border-emerald-500 bg-emerald-50' : 'border-orange-400 bg-orange-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="action" value={opt.value}
                      checked={action === opt.value}
                      onChange={() => setAction(opt.value)}
                      className="w-3.5 h-3.5 accent-current" />
                    <span className="text-sm font-bold text-slate-800">{opt.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-5">{opt.sub}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Raison */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Raison</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Ex : objectifs atteints, départ du jeune…"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>

          {/* Message au jeune */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Message au jeune <span className="text-slate-400 font-normal normal-case tracking-normal">(envoyé par email)</span>
            </label>
            <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Expliquez au jeune les raisons de la clôture…"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 ${
                action === 'CLOSED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-500 hover:bg-orange-600'
              }`}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              {action === 'CLOSED' ? 'Confirmer la clôture' : "Confirmer l'arrêt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
