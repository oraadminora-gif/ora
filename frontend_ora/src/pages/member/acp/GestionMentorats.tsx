// src/pages/member/acp/GestionMentorats.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../services/api';
import {
  Search, Loader2, AlertCircle, Pencil, X, CheckCircle,
  HandHeart, AlertTriangle, Calendar, User, FileText, Banknote, Plus, Trash2,
  UserCheck, Building2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Mentorat {
  id: number;
  mentor_id: number;
  mentor_name: string;
  mentor_assoc: string;
  jeune_name: string;
  jeune_ville: string;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'ABORTED';
  status_label: string;
  assigned_at: string | null;
  expected_end_date: string | null;
  closed_at: string | null;
  alerte_rouge: boolean;
  dernier_contact: string | null;
  notes_suivi: string;
  closure_reason: string;
  pole_id: number;
  pole_name: string | null;
  jeune_birth_date: string | null;
  jeune_gender: string;
  jeune_gender_label: string;
  jeune_diplome_prepare: string;
  jeune_diplome_label: string;
  jeune_situation: string;
  jeune_situation_label: string;
  jeune_urgency_level: number;
  jeune_etablissement_id: number | null;
  jeune_nom_etablissement: string;
  ap_responsable_id: number | null;
  ap_responsable_name: string | null;
  ap_responsable_assoc: string | null;
  problematiques: string[];
}

interface MentorOption { id: number; name: string; association: string; disponibilite: number; }
interface PoleOption { id: number; name: string; code: string; }

// ─────────────────────────────────────────────────────────────
// PROBLÉMATIQUES
// ─────────────────────────────────────────────────────────────
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

interface Animateur { id: number; name: string; association: string; }
interface EtabOption { id: number; nom: string; code_postal: string; }

type TabFilter = 'all' | 'ACTIVE' | 'CLOSED' | 'ABORTED' | 'PENDING';

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  ACTIVE:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50   text-amber-700   border-amber-200',
  CLOSED:  'bg-slate-100  text-slate-600   border-slate-200',
  ABORTED: 'bg-red-50     text-red-600     border-red-200',
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLE[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// FINANCEMENTS SECTION (dans le modal)
// ─────────────────────────────────────────────────────────────
interface MentoratFinancement {
  id: number;
  financement_id: number;
  financement_nom: string;
  financement_code: string;
  type: string;
  type_label: string;
  code_specifique: string;
}

interface FinancementOption { id: number; nom: string; code: string; type: string }

function FinancementsSection({ mentoratId, disabled }: { mentoratId: number; disabled: boolean }) {
  const [items, setItems]       = useState<MentoratFinancement[]>([]);
  const [options, setOptions]   = useState<FinancementOption[]>([]);
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);
  const [selId, setSelId]       = useState('');
  const [codeSpec, setCodeSpec] = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/mentorats/${mentoratId}/financements-list/`),
      api.get('/financements/'),
    ]).then(([mfRes, fRes]) => {
      setItems(mfRes.data.financements ?? []);
      setOptions(fRes.data.financements ?? []);
    }).finally(() => setLoading(false));
  }, [mentoratId]);

  const handleAdd = async () => {
    if (!selId) { setError('Sélectionner un financeur'); return; }
    setSaving(true); setError('');
    try {
      const res = await api.post(`/mentorats/${mentoratId}/add_financement/`, {
        financement_id: Number(selId),
        code_specifique: codeSpec.trim(),
      });
      setItems(prev => {
        const exists = prev.find(i => i.financement_id === res.data.financement_id);
        if (exists) return prev.map(i => i.financement_id === res.data.financement_id ? { ...i, code_specifique: res.data.code_specifique } : i);
        return [...prev, res.data as MentoratFinancement];
      });
      setAdding(false); setSelId(''); setCodeSpec('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error ?? 'Erreur');
    } finally { setSaving(false); }
  };

  const handleRemove = async (mfId: number) => {
    try {
      await api.delete(`/mentorats/${mentoratId}/financements/${mfId}/`);
      setItems(prev => prev.filter(i => i.id !== mfId));
    } catch { /* silent */ }
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-300" /></div>;

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <Banknote className="w-3.5 h-3.5" /> Financements
      </h3>

      {items.length === 0 && !adding && (
        <p className="text-xs text-slate-400 italic">Aucun financeur associé</p>
      )}

      {/* Liste des financements */}
      <div className="space-y-1.5">
        {items.map(mf => (
          <div key={mf.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-700">{mf.financement_nom}</span>
              <span className="ml-1.5 text-[10px] text-slate-400 font-mono">{mf.financement_code}</span>
              <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mf.type === 'national' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                {mf.type_label}
              </span>
              {mf.code_specifique && (
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Code : {mf.code_specifique}</p>
              )}
            </div>
            {!disabled && (
              <button onClick={() => handleRemove(mf.id)}
                className="shrink-0 p-1 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Formulaire ajout */}
      {adding ? (
        <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <select value={selId} onChange={e => setSelId(e.target.value)}
            className={INPUT}>
            <option value="">— Choisir un financeur —</option>
            {options.filter(o => !items.find(i => i.financement_id === o.id)).map(o => (
              <option key={o.id} value={o.id}>{o.nom} ({o.code})</option>
            ))}
          </select>
          <input type="text" value={codeSpec} onChange={e => setCodeSpec(e.target.value)}
            placeholder="Code contrat / dossier (optionnel)"
            className={INPUT} />
          <div className="flex gap-2">
            <button type="button" onClick={() => { setAdding(false); setError(''); }}
              className="flex-1 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-white">
              Annuler
            </button>
            <button type="button" onClick={handleAdd} disabled={saving}
              className="flex-1 py-1.5 text-xs font-semibold text-white bg-ora-blue rounded-lg hover:bg-ora-blue/90 disabled:opacity-50">
              {saving ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </div>
      ) : (
        !disabled && (
          <button type="button" onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-ora-blue hover:underline">
            <Plus className="w-3.5 h-3.5" /> Ajouter un financeur
          </button>
        )
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION PROBLÉMATIQUES (dans le modal)
// ─────────────────────────────────────────────────────────────
function ProblematiquesSection({
  selected,
  onChange,
  disabled,
}: {
  selected: string[];
  onChange: (codes: string[]) => void;
  disabled: boolean;
}) {
  const toggle = (code: string) => {
    if (disabled) return;
    if (selected.includes(code)) {
      onChange(selected.filter(c => c !== code));
    } else if (selected.length < 3) {
      onChange([...selected, code]);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Problématiques
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">
          {selected.length}/3 sélectionnée{selected.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROBLEMATIQUES.map(({ code, label }) => {
          const isSelected = selected.includes(code);
          const isDisabledExtra = !isSelected && selected.length >= 3;
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              disabled={disabled || isDisabledExtra}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                isSelected
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : isDisabledExtra
                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {selected.length === 3 && !disabled && (
        <p className="text-[10px] text-amber-600">
          Maximum 3 problématiques. Désélectionnez-en une pour en choisir une autre.
        </p>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL EDIT MENTORAT
// ─────────────────────────────────────────────────────────────
function MentoratModal({
  mentorat, animateurs, mentors, poles, onClose, onSaved,
}: {
  mentorat: Mentorat;
  animateurs: Animateur[];
  mentors: MentorOption[];
  poles: PoleOption[];
  onClose: () => void;
  onSaved: (m: Mentorat) => void;
}) {
  const [status, setStatus]               = useState(mentorat.status);
  const [closureReason, setClosureReason] = useState(mentorat.closure_reason ?? '');
  const [apId, setApId]                   = useState<string>(mentorat.ap_responsable_id ? String(mentorat.ap_responsable_id) : '');
  const [mentorId, setMentorId]           = useState<string>(String(mentorat.mentor_id));
  const [assignedPoleId, setAssignedPoleId] = useState<string>(String(mentorat.pole_id));
  const [notesSuivi, setNotesSuivi]       = useState(mentorat.notes_suivi ?? '');
  const [alerteRouge, setAlerteRouge]     = useState(mentorat.alerte_rouge);
  const [dernierContact, setDernierContact] = useState(mentorat.dernier_contact ?? '');
  const [expectedEnd, setExpectedEnd]     = useState(mentorat.expected_end_date ?? '');
  const [problematiques, setProblematiques] = useState<string[]>(mentorat.problematiques ?? []);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const poleChanged   = assignedPoleId !== String(mentorat.pole_id);
  const mentorChanged = mentorId !== String(mentorat.mentor_id);

  const [jeuneSituation, setJeuneSituation] = useState(mentorat.jeune_situation ?? '');
  const [jeuneUrgency, setJeuneUrgency]     = useState<number>(mentorat.jeune_urgency_level ?? 1);
  const [jeuneEtabId, setJeuneEtabId]       = useState<number | null>(mentorat.jeune_etablissement_id ?? null);
  const [jeuneAutreNom, setJeuneAutreNom]   = useState(mentorat.jeune_etablissement_id ? '' : (mentorat.jeune_nom_etablissement ?? ''));
  const [etabs, setEtabs]                   = useState<EtabOption[]>([]);
  const [jeuneGender, setJeuneGender]         = useState(mentorat.jeune_gender ?? '');
  const [jeuneBirthDate, setJeuneBirthDate]   = useState(mentorat.jeune_birth_date ?? '');
  const [jeuneDiplome, setJeuneDiplome]       = useState(mentorat.jeune_diplome_prepare ?? '');

  // Inline "Ajouter établissement"
  const [showAddEtab, setShowAddEtab]       = useState(false);
  const [newEtabNom, setNewEtabNom]         = useState('');
  const [newEtabCp, setNewEtabCp]           = useState('');
  const [addingEtab, setAddingEtab]         = useState(false);

  useEffect(() => {
    api.get<{ etablissements: EtabOption[] }>('/pole/etablissements/')
      .then(r => setEtabs(r.data.etablissements))
      .catch(() => {});
  }, []);

  // Transitions autorisées — l'ACP a le contrôle total sur le statut
  const allowedNext: Record<string, string[]> = {
    PENDING: ['ACTIVE', 'ABORTED'],
    ACTIVE:  ['CLOSED', 'ABORTED'],
    CLOSED:  ['ACTIVE', 'ABORTED'],
    ABORTED: ['ACTIVE', 'CLOSED'],
  };
  const nextOptions = allowedNext[mentorat.status] ?? [];
  const needClosure = status === 'CLOSED' || status === 'ABORTED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needClosure && !closureReason.trim()) {
      setError('Une raison de clôture est requise');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        notes_suivi:      notesSuivi,
        alerte_rouge:     alerteRouge,
        dernier_contact:  dernierContact || null,
        expected_end_date: expectedEnd || null,
        ap_responsable_id: apId ? Number(apId) : null,
        problematiques,
      };
      if (status !== mentorat.status) {
        payload.status = status;
        if (needClosure) payload.closure_reason = closureReason.trim();
      }
      if (mentorChanged) payload.mentor_id = Number(mentorId);
      if (poleChanged)   payload.pole_id   = Number(assignedPoleId);
      payload.gender          = jeuneGender;
      payload.birth_date      = jeuneBirthDate || null;
      payload.diplome_prepare = jeuneDiplome;
      payload.situation       = jeuneSituation;
      payload.urgency_level   = jeuneUrgency;
      if (jeuneEtabId) {
        payload.etablissement_id = jeuneEtabId;
      } else {
        payload.etablissement_id = null;
        payload.nom_etablissement = jeuneAutreNom.trim();
      }
      const res = await api.patch(`/pole/mentorats/${mentorat.id}/`, payload);
      onSaved(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Suivi du mentorat</h2>
            <p className="text-xs text-slate-400 mt-0.5">{mentorat.mentor_name} → {mentorat.jeune_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {/* ── Statut ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</h3>
            <div className="flex items-center gap-3">
              <StatusBadge status={mentorat.status} label={mentorat.status_label} />
              {nextOptions.length > 0 && (
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as Mentorat['status'])}
                  className={INPUT}
                >
                  <option value={mentorat.status}>{mentorat.status_label} (inchangé)</option>
                  {nextOptions.map(s => (
                    <option key={s} value={s}>
                      {s === 'ACTIVE' ? 'Actif' : s === 'CLOSED' ? 'Clôturé' : 'Abandonné'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {needClosure && (
              <Field label="Raison de clôture *">
                <textarea
                  required
                  value={closureReason}
                  onChange={e => setClosureReason(e.target.value)}
                  rows={2}
                  placeholder="Décrivez la raison de la clôture…"
                  className={`${INPUT} resize-none`}
                />
              </Field>
            )}
          </section>

          {/* ── Réassigner le mentor ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Mentor assigné
            </h3>
            <select value={mentorId} onChange={e => setMentorId(e.target.value)} className={INPUT}>
              {mentors.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.association}){m.disponibilite === 0 ? ' — saturé' : ''}
                </option>
              ))}
            </select>
            {mentorChanged && (
              <p className="text-[10px] text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Le mentor sera réassigné. Les disponibilités seront ajustées si le mentorat est actif.
              </p>
            )}
          </section>

          {/* ── Transférer vers un autre pôle ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Pôle responsable
            </h3>
            <select value={assignedPoleId} onChange={e => setAssignedPoleId(e.target.value)} className={INPUT}>
              {poles.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
            {poleChanged && (
              <p className="text-[10px] text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Ce mentorat sera transféré à un autre pôle et disparaîtra de votre liste.
              </p>
            )}
          </section>

          {/* ── AP responsable ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> AP responsable
            </h3>
            <select value={apId} onChange={e => setApId(e.target.value)} className={INPUT}>
              <option value="">— Aucun AP —</option>
              {animateurs.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.association})</option>
              ))}
            </select>
          </section>

          {/* ── Notes de suivi ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Notes de suivi
            </h3>
            <textarea
              value={notesSuivi}
              onChange={e => setNotesSuivi(e.target.value)}
              rows={3}
              placeholder="Observations, points importants…"
              className={`${INPUT} resize-none`}
            />
          </section>

          {/* ── Problématiques ── */}
          <ProblematiquesSection
            selected={problematiques}
            onChange={setProblematiques}
            disabled={false}
          />

          {/* ── Dates & Alerte ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Dates & Alertes
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dernier contact">
                <input
                  type="date"
                  value={dernierContact}
                  onChange={e => setDernierContact(e.target.value)}
                  className={INPUT}
                />
              </Field>
              <Field label="Fin prévue">
                <input
                  type="date"
                  value={expectedEnd}
                  onChange={e => setExpectedEnd(e.target.value)}
                  className={INPUT}
                />
              </Field>
            </div>

            <button
              type="button"
              onClick={() => setAlerteRouge(v => !v)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold w-full transition-all cursor-pointer ${
                alerteRouge
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 ${alerteRouge ? 'text-red-500' : 'text-slate-400'}`} />
              {alerteRouge ? 'Alerte rouge activée — cliquer pour désactiver' : 'Activer une alerte rouge'}
            </button>
          </section>

          {/* ── Infos & Situation du jeune ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Informations du jeune
            </h3>

            {/* Genre */}
            <Field label="Genre">
              <div className="flex gap-2">
                {([['M', 'Garçon'], ['F', 'Fille'], ['O', 'Autre']] as [string, string][]).map(([val, lbl]) => (
                  <label key={val} className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${
                    jeuneGender === val
                      ? 'bg-ora-blue/8 border-ora-blue text-ora-blue'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                    <input type="radio" name="jeune_gender" value={val}
                      checked={jeuneGender === val}
                      onChange={() => setJeuneGender(val)}
                      className="sr-only"
                    />
                    <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      jeuneGender === val ? 'border-ora-blue' : 'border-slate-300'
                    }`}>
                      {jeuneGender === val && <span className="w-1.5 h-1.5 rounded-full bg-ora-blue" />}
                    </span>
                    {lbl}
                  </label>
                ))}
              </div>
            </Field>

            {/* Date de naissance */}
            <Field label="Date de naissance">
              <input
                type="date"
                value={jeuneBirthDate}
                onChange={e => setJeuneBirthDate(e.target.value)}
                className={INPUT}
              />
            </Field>

            {/* Diplôme préparé */}
            <Field label="Diplôme préparé">
              <select
                value={jeuneDiplome}
                onChange={e => setJeuneDiplome(e.target.value)}
                className={INPUT}
              >
                <option value="">— Sélectionner un diplôme —</option>
                <optgroup label="Niveau 3">
                  <option value="CAP">CAP</option>
                  <option value="BEP">BEP</option>
                </optgroup>
                <optgroup label="Niveau 4">
                  <option value="BAC_PRO">Bac Pro</option>
                  <option value="BAC_AUTRE">Bac autres</option>
                  <option value="BP">BP</option>
                </optgroup>
                <optgroup label="Niveau 5">
                  <option value="BTS">BTS</option>
                  <option value="DUT">DUT</option>
                </optgroup>
                <optgroup label="Niveau 6">
                  <option value="LIC_PRO">Licence Pro</option>
                  <option value="BUT">BUT</option>
                </optgroup>
                <optgroup label="Niveau 7">
                  <option value="MASTER">Master</option>
                  <option value="DEA">DEA</option>
                  <option value="DES">Diplôme d'études spécialisées</option>
                  <option value="ING">Ingénieur</option>
                </optgroup>
              </select>
            </Field>

            {/* Situation */}
            <Field label="Situation">
              <div className="flex gap-3">
                {([
                  ['apprentissage', 'Déjà en apprentissage'],
                  ['recherche',     "En recherche d'apprentissage"],
                ] as [string, string][]).map(([val, lbl]) => (
                  <label key={val} className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${
                    jeuneSituation === val
                      ? 'bg-ora-blue/8 border-ora-blue text-ora-blue'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="jeune_situation"
                      value={val}
                      checked={jeuneSituation === val}
                      onChange={() => setJeuneSituation(val)}
                      className="sr-only"
                    />
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      jeuneSituation === val ? 'border-ora-blue' : 'border-slate-300'
                    }`}>
                      {jeuneSituation === val && <span className="w-2 h-2 rounded-full bg-ora-blue" />}
                    </span>
                    {lbl}
                  </label>
                ))}
              </div>
            </Field>
            {/* Niveau d'urgence */}
            <Field label="Niveau d'urgence">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setJeuneUrgency(lvl)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      jeuneUrgency === lvl
                        ? lvl >= 4
                          ? 'bg-red-500 border-red-500 text-white'
                          : lvl === 3
                            ? 'bg-amber-400 border-amber-400 text-white'
                            : 'bg-green-500 border-green-500 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {jeuneUrgency <= 2 ? 'Faible urgence' : jeuneUrgency === 3 ? 'Urgence modérée' : jeuneUrgency === 4 ? 'Urgence élevée' : 'Urgence critique'}
              </p>
            </Field>

            <Field label="Établissement / CFA">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={jeuneEtabId ? String(jeuneEtabId) : (jeuneAutreNom ? 'autre' : '')}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'autre') { setJeuneEtabId(null); }
                      else if (val === '') { setJeuneEtabId(null); setJeuneAutreNom(''); }
                      else { setJeuneEtabId(Number(val)); setJeuneAutreNom(''); }
                    }}
                    className={INPUT}
                  >
                    <option value="">— Sélectionner un établissement —</option>
                    {etabs.map(e => (
                      <option key={e.id} value={String(e.id)}>
                        {e.nom}{e.code_postal ? ` (${e.code_postal})` : ''}
                      </option>
                    ))}
                    <option value="autre">Autre…</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddEtab(v => !v)}
                    className="shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-semibold text-ora-blue border border-ora-blue/30 rounded-lg hover:bg-ora-blue/5 transition-colors"
                    title="Ajouter un établissement"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter
                  </button>
                </div>
                {(jeuneEtabId ? String(jeuneEtabId) : (jeuneAutreNom ? 'autre' : '')) === 'autre' && (
                  <input
                    type="text"
                    value={jeuneAutreNom}
                    onChange={e => setJeuneAutreNom(e.target.value)}
                    placeholder="Nom de l'établissement…"
                    className={INPUT}
                  />
                )}
                {showAddEtab && (
                  <div className="flex gap-2 p-3 bg-ora-blue/5 border border-ora-blue/20 rounded-xl">
                    <input
                      type="text"
                      value={newEtabNom}
                      onChange={e => setNewEtabNom(e.target.value)}
                      placeholder="Nom de l'établissement *"
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40 focus:border-ora-blue"
                    />
                    <input
                      type="text"
                      value={newEtabCp}
                      onChange={e => setNewEtabCp(e.target.value)}
                      placeholder="CP"
                      className="w-20 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40 focus:border-ora-blue"
                    />
                    <button
                      type="button"
                      disabled={addingEtab || !newEtabNom.trim()}
                      onClick={async () => {
                        setAddingEtab(true);
                        try {
                          const res = await api.post<EtabOption>('/pole/etablissements/', {
                            nom: newEtabNom.trim(),
                            code_postal: newEtabCp.trim(),
                          });
                          setEtabs(prev => [...prev, res.data]);
                          setJeuneEtabId(res.data.id);
                          setJeuneAutreNom('');
                          setNewEtabNom('');
                          setNewEtabCp('');
                          setShowAddEtab(false);
                        } catch { /* ignore */ } finally { setAddingEtab(false); }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-ora-blue rounded-lg hover:bg-ora-blue/90 disabled:opacity-50 transition-colors"
                    >
                      {addingEtab ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Créer
                    </button>
                  </div>
                )}
              </div>
            </Field>
          </section>

          {/* ── Financements ── */}
          <FinancementsSection mentoratId={mentorat.id} disabled={false} />

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
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
const TABS: { key: TabFilter; label: string }[] = [
  { key: 'all',     label: 'Tous'       },
  { key: 'ACTIVE',  label: 'Actifs'     },
  { key: 'PENDING', label: 'En attente' },
  { key: 'CLOSED',  label: 'Clôturés'  },
  { key: 'ABORTED', label: 'Abandonnés' },
];

export function GestionMentorats() {
  const [mentorats, setMentorats]     = useState<Mentorat[]>([]);
  const [animateurs, setAnimateurs]   = useState<Animateur[]>([]);
  const [mentors, setMentors]         = useState<MentorOption[]>([]);
  const [poles, setPoles]             = useState<PoleOption[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [tab, setTab]                 = useState<TabFilter>('all');
  const [editing, setEditing]         = useState<Mentorat | null>(null);
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, aRes, mentRes, polesRes] = await Promise.all([
        api.get('/pole/mentorats/'),
        api.get('/pole/animateurs/'),
        api.get('/pole/mentors/'),
        api.get('/poles/'),
      ]);
      setMentorats(mRes.data.mentorats ?? []);
      // Normalise les APs
      const aps = (aRes.data.animateurs ?? []).map((a: {
        id: number; name?: string; first_name?: string; last_name?: string; association: string;
      }) => ({
        id: a.id,
        name: a.name ?? `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim(),
        association: a.association,
      }));
      setAnimateurs(aps);
      setMentors((mentRes.data.mentors ?? []).map((m: {
        id: number; name: string; association: string; disponibilite: number;
      }) => ({ id: m.id, name: m.name, association: m.association, disponibilite: m.disponibilite })));
      const poleList: PoleOption[] = (polesRes.data.results ?? polesRes.data).map((p: {
        id: number; name: string; code: string;
      }) => ({ id: p.id, name: p.name, code: p.code }));
      setPoles(poleList);
    } catch {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const counts = useMemo(() => ({
    all:     mentorats.length,
    ACTIVE:  mentorats.filter(m => m.status === 'ACTIVE').length,
    PENDING: mentorats.filter(m => m.status === 'PENDING').length,
    CLOSED:  mentorats.filter(m => m.status === 'CLOSED').length,
    ABORTED: mentorats.filter(m => m.status === 'ABORTED').length,
  }), [mentorats]);

  const filtered = useMemo(() => mentorats.filter(m => {
    const matchTab = tab === 'all' || m.status === tab;
    const matchSearch = !search.trim()
      || `${m.mentor_name} ${m.jeune_name} ${m.mentor_assoc} ${m.ap_responsable_name ?? ''}`.toLowerCase()
          .includes(search.toLowerCase());
    return matchTab && matchSearch;
  }), [mentorats, tab, search]);

  const handleSaved = (saved: Mentorat) => {
    const originalPoleId = editing?.pole_id;
    if (originalPoleId && saved.pole_id !== originalPoleId) {
      // Mentorat transferred — remove from list
      setMentorats(prev => prev.filter(m => m.id !== saved.id));
      setSuccessMsg('Mentorat transféré vers un autre pôle.');
    } else {
      setMentorats(prev => prev.map(m => m.id === saved.id ? saved : m));
      setSuccessMsg('Mentorat mis à jour.');
    }
    setEditing(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Suivi des mentorats</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {counts.ACTIVE} actifs · {counts.PENDING} en attente · {counts.CLOSED + counts.ABORTED} clôturés
        </p>
      </div>

      {/* Succès */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />{successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs + Recherche */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              <span className={`ml-1 text-[9px] font-black ${tab === t.key ? 'text-ora-blue' : 'text-slate-400'}`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Mentor, jeune, association, AP…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue"
          />
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
          <HandHeart className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">Aucun mentorat trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mentor</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jeune</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">AP responsable</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Assigné le</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {m.alerte_rouge && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" title="Alerte rouge" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{m.mentor_name}</p>
                          <p className="text-[11px] text-slate-400">{m.mentor_assoc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{m.jeune_name}</p>
                      {m.jeune_ville && <p className="text-[11px] text-slate-400">{m.jeune_ville}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {m.ap_responsable_name ? (
                        <div>
                          <p className="text-sm text-slate-600">{m.ap_responsable_name}</p>
                          <p className="text-[11px] text-slate-400">{m.ap_responsable_assoc}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={m.status} label={m.status_label} />
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className="text-xs text-slate-400">
                        {m.assigned_at ? new Date(m.assigned_at).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setEditing(m)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                        title={m.status === 'CLOSED' || m.status === 'ABORTED' ? 'Consulter' : 'Modifier'}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {editing && (
        <MentoratModal
          mentorat={editing}
          animateurs={animateurs}
          mentors={mentors}
          poles={poles}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
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
