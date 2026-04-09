// src/components/ap/APMentorDetailModal.tsx
import { useState, useEffect } from 'react';
import {
  X, Loader2, AlertTriangle, CheckCircle, Clock, Calendar,
  Users, Phone, Mail, MapPin, History, StickyNote, Save,
  Plus, Pencil, Trash2, ChevronDown, ChevronUp, Video, PhoneCall, MessageSquare,
  ClipboardList,
} from 'lucide-react';
import api from '../../services/api';
import type {
  APMentorDetail, APMentoratActif, APMentorHistorique, APSuiviStats
} from '../../pages/member/ap/APDashboard.types';

interface ApiError { response?: { data?: { error?: string } } }

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

const TYPE_OPTIONS = [
  { value: 'PRESENTIEL', label: 'Présentiel',      icon: Users },
  { value: 'VISIO',      label: 'Visio',           icon: Video },
  { value: 'TELEPHONE',  label: 'Téléphone',       icon: PhoneCall },
  { value: 'EMAIL',      label: 'Email/Msg',       icon: MessageSquare },
];

const EMPTY_FORM: SuiviFormData = {
  date_rencontre: new Date().toISOString().slice(0, 10),
  duree_minutes: 60,
  type_rencontre: 'PRESENTIEL',
  objectifs_atteints: false,
  notes: '',
};

// ── Formulaire suivi AP ────────────────────────────────────────────────────────
function APSuiviForm({
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

// ── Panneau suivi AP (expandable) ─────────────────────────────────────────────
function APSuiviPanel({ mentoratId }: { mentoratId: number }) {
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

// ── Constantes ────────────────────────────────────────────────────────────────
const PROBLEMATIQUES: { code: string; label: string }[] = [
  { code: 'aide_informatique',  label: 'Aide informatique' },
  { code: 'fle',                label: 'Apprentissage du français (FLE)' },
  { code: 'changer_employeur',  label: "Changer d'employeur" },
  { code: 'handicap',           label: 'Handicap' },
  { code: 'logement',           label: 'Logement' },
  { code: 'orientation',        label: 'Orientation' },
  { code: 'prob_administratif', label: 'Problème administratif' },
  { code: 'prob_financier',     label: 'Problème financier — Gérer Budget' },
  { code: 'fragilite_mentale',  label: 'Fragilité mentale' },
  { code: 'prep_dossier',       label: 'Prép dossier professionnel' },
  { code: 'relation_employeur', label: "Relation avec l'employeur" },
  { code: 'recherche_contrat',  label: 'Recherche contrat apprentissage' },
  { code: 'salaire',            label: 'Salaire / Respect de convention' },
  { code: 'soutien_moral',      label: 'Soutien moral' },
  { code: 'soutien_scolaire',   label: 'Soutien scolaire' },
  { code: 'autre',              label: 'Autre' },
];

const INPUT_CLS = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue bg-white transition-all';

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
interface EtabOption2 { id: number; nom: string; code_postal: string; }

// ── Modal Suivi Avancé (Problématiques → Financements) ────────────────────────
function APMentoratSuiviModal({
  mentoratId,
  jeuneName,
  onClose,
}: {
  mentoratId: number;
  jeuneName: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<SuiviData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [etabs, setEtabs] = useState<EtabOption2[]>([]);
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
      api.get<EtabOption2[]>('/ap/etablissements/'),
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
            <div>
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
                        const res = await api.post<EtabOption2>('/ap/etablissements/', { nom: newEtabNom.trim(), code_postal: newEtabCp.trim() });
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
            </div>
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

interface Props {
  mentorId: number;
  onClose: () => void;
  onAlertChanged: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

// ── Badge inactivité ───────────────────────────────────────────────────────────
function InactiviteBadge({ jours, level }: { jours: number | null; level: string }) {
  if (level === 'ok' || jours === null) return null;

  const cfg =
    level === 'alert'
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-orange-100 text-orange-700 border-orange-200';
  const label = level === 'alert' ? `${jours}j sans contact ⚠️` : `${jours}j sans contact`;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${cfg}`}>
      <Clock className="w-2.5 h-2.5" /> {label}
    </span>
  );
}

// ── Stats suivis ───────────────────────────────────────────────────────────────
function SuiviStatsMini({ stats }: { stats: APSuiviStats }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ora-blue bg-ora-blue/8 border border-ora-blue/15 px-2 py-1 rounded-full">
        <Calendar className="w-2.5 h-2.5" />
        {stats.nb_rencontres} rencontre{stats.nb_rencontres !== 1 ? 's' : ''}
      </span>
      {stats.total_minutes > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
          <Clock className="w-2.5 h-2.5" />
          {formatDuree(stats.total_minutes)} total
        </span>
      )}
    </div>
  );
}

// ── Carte mentorat actif (vue AP, avec gestion suivis) ─────────────────────────
function MentoratActifRow({
  mentorat,
  onAlertToggle,
  onNotesOpen,
}: {
  mentorat: APMentoratActif;
  onAlertToggle: (m: APMentoratActif) => void;
  onNotesOpen: (m: APMentoratActif) => void;
}) {
  const { jeune, inactivite, alerte_rouge, suivi_stats } = mentorat;
  const [showSuivis, setShowSuivis] = useState(false);
  const [showSuiviModal, setShowSuiviModal] = useState(false);

  const borderClass = alerte_rouge
    ? 'border-red-200 bg-red-50/30'
    : inactivite.level === 'warn'
    ? 'border-orange-100 bg-orange-50/10'
    : 'border-slate-100 bg-white';

  return (
    <div className={`rounded-xl border px-4 py-3 space-y-2 transition-all ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-800">{jeune?.name ?? '—'}</p>
            {alerte_rouge && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <AlertTriangle className="w-2.5 h-2.5" /> Alerte
              </span>
            )}
            <InactiviteBadge jours={inactivite.jours} level={inactivite.level} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
            {jeune?.city && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{jeune.city}</span>}
            {mentorat.date_debut && <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />Depuis {formatDate(mentorat.date_debut)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onNotesOpen(mentorat)}
            title="Notes de suivi"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <StickyNote className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onAlertToggle(mentorat)}
            title={alerte_rouge ? "Résoudre l'alerte" : 'Signaler une alerte'}
            className={`p-1.5 rounded-lg transition-colors ${alerte_rouge ? 'hover:bg-red-100' : 'hover:bg-orange-50'}`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${alerte_rouge ? 'text-red-500' : 'text-slate-300 hover:text-orange-400'}`} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <SuiviStatsMini stats={suivi_stats} />
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowSuiviModal(true)}
            className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 hover:text-violet-800 transition-colors">
            <ClipboardList className="w-3 h-3" /> Modifier le suivi
          </button>
          <button
            onClick={() => setShowSuivis(v => !v)}
            className="flex items-center gap-1 text-[10px] font-semibold text-ora-blue hover:text-ora-dark transition-colors"
          >
            {showSuivis ? <><ChevronUp className="w-3 h-3" /> Masquer</> : <><ChevronDown className="w-3 h-3" /> Rencontres</>}
          </button>
        </div>
      </div>
      {showSuivis && (
        <div className="border-t border-slate-100 pt-2">
          <APSuiviPanel mentoratId={mentorat.id} />
        </div>
      )}
      {showSuiviModal && (
        <APMentoratSuiviModal
          mentoratId={mentorat.id}
          jeuneName={jeune?.name ?? '—'}
          onClose={() => setShowSuiviModal(false)}
        />
      )}
    </div>
  );
}

// ── Modal notes ────────────────────────────────────────────────────────────────
function NotesModal({
  mentoratId,
  initialNotes,
  jeuneName,
  onSaved,
  onClose,
}: {
  mentoratId: number;
  initialNotes: string;
  jeuneName: string;
  onSaved: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      await api.patch(`/ap/mentorats/${mentoratId}/notes/`, { notes_suivi: notes });
      onSaved(notes);
    } catch (err) {
      setError((err as ApiError).response?.data?.error ?? 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-ora-blue" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Notes de suivi AP</h4>
              <p className="text-[10px] text-slate-400">Mentorat de {jeuneName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={6}
            placeholder="Observations, points à surveiller, décisions prises..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue resize-none transition-all"
          />
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-ora-blue hover:bg-ora-dark text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-ora-blue/20">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal alerte ───────────────────────────────────────────────────────────────
function AlerteModal({
  mentorat,
  onConfirm,
  onClose,
}: {
  mentorat: APMentoratActif;
  onConfirm: (action: 'signaler' | 'resoudre', note: string) => Promise<void>;
  onClose: () => void;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const action: 'signaler' | 'resoudre' = mentorat.alerte_rouge ? 'resoudre' : 'signaler';

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(action, note);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className={`px-5 py-4 border-b rounded-t-2xl ${action === 'signaler' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {action === 'signaler'
                ? <AlertTriangle className="w-5 h-5 text-red-600" />
                : <CheckCircle className="w-5 h-5 text-emerald-600" />}
              <h4 className={`text-sm font-bold ${action === 'signaler' ? 'text-red-800' : 'text-emerald-800'}`}>
                {action === 'signaler' ? 'Signaler une alerte' : 'Résoudre l\'alerte'}
              </h4>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mentorat de <strong>{mentorat.jeune?.name ?? '—'}</strong>
          </p>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Note <span className="font-normal text-slate-300">(optionnelle)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder={action === 'signaler' ? 'Ex: Le mentor n\'a pas répondu depuis 5 semaines...' : 'Ex: Situation résolue, contact rétabli...'}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue resize-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
              Annuler
            </button>
            <button onClick={handleConfirm} disabled={saving}
              className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                action === 'signaler' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {action === 'signaler' ? 'Confirmer l\'alerte' : 'Marquer comme résolu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MODAL PRINCIPALE ───────────────────────────────────────────────────────────
export function APMentorDetailModal({ mentorId, onClose, onAlertChanged }: Props) {
  const [detail, setDetail] = useState<APMentorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'mentorats' | 'historique'>('mentorats');
  const [alerteMentorat, setAlerteMentorat] = useState<APMentoratActif | null>(null);
  const [notesMentorat, setNotesMentorat] = useState<APMentoratActif | null>(null);

  useEffect(() => { fetchDetail(); }, [mentorId]);

  const fetchDetail = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get<APMentorDetail>(`/ap/mentors/${mentorId}/`);
      setDetail(res.data);
    } catch { setError('Impossible de charger le détail.'); }
    finally { setLoading(false); }
  };

  const handleAlertConfirm = async (action: 'signaler' | 'resoudre', note: string) => {
    if (!alerteMentorat) return;
    try {
      await api.post(`/ap/mentorats/${alerteMentorat.id}/alerte/`, { action, note });
      setAlerteMentorat(null);
      onAlertChanged();
      fetchDetail();
    } catch { /* affiche erreur si besoin */ }
  };

  const handleNotesSaved = () => { setNotesMentorat(null); };

  if (!detail && loading) return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );

  const mentor = detail?.mentor;
  if (!mentor) return null;

  const initials = `${mentor.first_name.charAt(0)}${mentor.last_name.charAt(0)}`.toUpperCase();
  const inactivite = mentor.derniere_activite;

  const tabs = [
    { key: 'mentorats', label: 'Mentorats actifs', icon: Users, count: mentor.nb_mentorats_actifs },
    { key: 'historique', label: 'Historique', icon: History, count: mentor.nb_mentorats_termines },
  ] as const;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

          {/* ── Header mentor ─────────────────────────────────────── */}
          <div className={`px-6 py-5 border-b ${
            inactivite.level === 'alert' ? 'bg-red-50/50 border-red-100' :
            inactivite.level === 'warn'  ? 'bg-orange-50/30 border-orange-100' :
            'bg-slate-50/60 border-slate-100'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm shrink-0 ${
                  inactivite.level === 'alert' ? 'bg-red-500 shadow-red-200' :
                  inactivite.level === 'warn'  ? 'bg-orange-500 shadow-orange-200' :
                  'bg-ora-blue shadow-ora-blue/20'
                }`}>
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">
                      {mentor.first_name} {mentor.last_name}
                    </h3>
                    {mentor.is_trained && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-2.5 h-2.5" /> Formé
                      </span>
                    )}
                    <InactiviteBadge jours={inactivite.jours} level={inactivite.level} />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {[
                      { icon: Mail,  v: mentor.email },
                      { icon: Phone, v: mentor.phone || '—' },
                      { icon: MapPin,v: mentor.city  || '—' },
                    ].map(({ icon: Icon, v }) => (
                      <span key={v} className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Icon className="w-2.5 h-2.5" /> {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Capacité */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Max',        value: mentor.capacite.max,        color: 'text-slate-700' },
                { label: 'Utilisés',   value: mentor.capacite.utilisee,   color: 'text-ora-blue' },
                { label: 'Disponible', value: mentor.capacite.disponible, color: mentor.capacite.disponible > 0 ? 'text-emerald-600' : 'text-red-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-100 px-3 py-2 text-center">
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Barre capacité */}
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-ora-blue rounded-full transition-all"
                style={{ width: `${mentor.capacite.max > 0 ? (mentor.capacite.utilisee / mentor.capacite.max) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────── */}
          <div className="flex border-b border-slate-100 bg-white">
            {tabs.map(({ key, label, icon: Icon, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2 ${
                  tab === key ? 'text-ora-blue border-ora-blue bg-ora-blue/3' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  tab === key ? 'bg-ora-blue text-white' : 'bg-slate-100 text-slate-400'
                }`}>{count}</span>
              </button>
            ))}
          </div>

          {/* ── Contenu ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl px-4 py-3">{error}</div>
            )}

            {tab === 'mentorats' && (
              <>
                {mentor.mentorats_actifs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Aucun mentorat actif</p>
                  </div>
                ) : (
                  mentor.mentorats_actifs.map(m => (
                    <MentoratActifRow
                      key={m.id}
                      mentorat={m}
                      onAlertToggle={setAlerteMentorat}
                      onNotesOpen={setNotesMentorat}
                    />
                  ))
                )}
              </>
            )}

            {tab === 'historique' && (
              <>
                {(!detail?.historique || detail.historique.length === 0) ? (
                  <div className="text-center py-10 text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Aucun mentorat terminé</p>
                  </div>
                ) : (
                  detail.historique.map((h: APMentorHistorique) => (
                    <div key={h.id} className="flex items-start gap-3 border border-slate-100 rounded-xl px-4 py-3 bg-white">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        h.statut_final === 'CLOSED' ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        {h.statut_final === 'CLOSED'
                          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          : <X className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{h.jeune}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className={`text-[10px] font-bold ${h.statut_final === 'CLOSED' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {h.statut_final === 'CLOSED' ? 'Clôturé' : 'Abandonné'}
                          </span>
                          {h.date_fin && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />{new Date(h.date_fin).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                        <SuiviStatsMini stats={h.suivi_stats} />
                        {h.closure_reason && (
                          <p className="text-[10px] text-slate-400 mt-1 italic truncate">"{h.closure_reason}"</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sous-modals */}
      {alerteMentorat && (
        <AlerteModal
          mentorat={alerteMentorat}
          onConfirm={handleAlertConfirm}
          onClose={() => setAlerteMentorat(null)}
        />
      )}

      {notesMentorat && (
        <NotesModal
          mentoratId={notesMentorat.id}
          initialNotes={''}
          jeuneName={notesMentorat.jeune?.name ?? '—'}
          onSaved={handleNotesSaved}
          onClose={() => setNotesMentorat(null)}
        />
      )}
    </>
  );
}
