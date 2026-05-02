// src/components/mentor/ActiveMentorshipsCard.tsx
import { useState, useEffect } from 'react';
import {
  Users, X, Loader2, CheckCircle, AlertTriangle, Mail,
  Calendar, MapPin, FileText, ClipboardList, Plus,
  Phone, UserCheck, Trash2, Pencil, Clock, Video,
  PhoneCall, MessageSquare, ChevronDown, ChevronUp, StickyNote
} from 'lucide-react';
import api from '../../services/api';
import type { MentoratActif, SuiviRencontre, SuiviStats } from '../../pages/member/mentor/MentorDashboard';

interface ApiError { response?: { data?: { error?: string } } }
interface Props { mentorats: MentoratActif[]; mentorName: string; onClosed: () => void }
interface ClotureMeta { mentorat: MentoratActif; action: 'CLOSED' | 'ABORTED' }

const PROBLEMATIQUES_MAP: Record<string, string> = {
  aide_informatique:  'Aide informatique',
  fle:                'Apprentissage du français (FLE)',
  changer_employeur:  "Changer d'employeur",
  handicap:           'Handicap',
  logement:           'Logement',
  orientation:        'Orientation',
  prob_administratif: 'Problème administratif',
  prob_financier:     'Problème financier — Gérer Budget',
  fragilite_mentale:  'Fragilité mentale',
  prep_dossier:       'Prép dossier professionnel',
  relation_employeur: "Relation avec l'employeur",
  recherche_contrat:  'Recherche contrat apprentissage',
  salaire:            'Salaire / Respect de convention',
  soutien_moral:      'Soutien moral',
  soutien_scolaire:   'Soutien scolaire',
  autre:              'Autre',
};

const TYPE_OPTIONS = [
  { value: 'PRESENTIEL', label: 'Présentiel',      icon: Users },
  { value: 'VISIO',      label: 'Visioconférence', icon: Video },
  { value: 'TELEPHONE',  label: 'Téléphone',       icon: PhoneCall },
  { value: 'EMAIL',      label: 'Email / Message', icon: MessageSquare },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  PRESENTIEL: Users, VISIO: Video, TELEPHONE: PhoneCall, EMAIL: MessageSquare,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

function buildMessage(meta: ClotureMeta, mentorName: string, stats: SuiviStats): string {
  const prenom = meta.mentorat.jeune.name.split(' ')[0];
  const duree  = meta.mentorat.duree_mois;
  const nb     = stats.nb_rencontres;
  const heures = stats.total_heures;

  const rencontresPhrase = nb > 0
    ? `Au cours de nos ${nb} rencontre${nb > 1 ? 's' : ''} (soit ${heures}h d'accompagnement), `
    : '';

  if (meta.action === 'CLOSED') {
    return `Bonjour ${prenom},\n\nJe me permets de vous écrire pour vous informer que votre mentorat avec ${mentorName} est officiellement clôturé avec succès.\n\n${rencontresPhrase}nous espérons que cette expérience vous a apporté les outils et la confiance nécessaires pour la suite de votre parcours.\n\nCe fut un plaisir de vous accompagner pendant ${duree > 0 ? `ces ${duree} mois` : 'cette période'}.\n\nBien cordialement,\n${mentorName}`;
  }
  return `Bonjour ${prenom},\n\nJe me permets de vous informer que votre mentorat avec ${mentorName} prend fin à compter d'aujourd'hui.\n\nNous espérons que cet accompagnement vous aura été utile. Une équipe reste disponible pour assurer la suite de votre suivi.\n\nBien cordialement,\n${mentorName}`;
}

// ── UrgencyBadge ──────────────────────────────────────────────────────────────
function UrgencyBadge({ level, label }: { level: number; label: string }) {
  const cfg =
    level >= 5 ? 'bg-red-100 text-red-700 border-red-200' :
    level >= 4 ? 'bg-orange-100 text-orange-700 border-orange-200' :
    level >= 3 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
    'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg}`}>
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < level ? 'bg-current' : 'bg-slate-200'}`} />
        ))}
      </span>
      {label}
    </span>
  );
}

// ── SuiviStats mini ───────────────────────────────────────────────────────────
function SuiviStatsBadges({ stats }: { stats: SuiviStats }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ora-blue bg-ora-blue/8 border border-ora-blue/15 px-2 py-1 rounded-full">
        <Calendar className="w-2.5 h-2.5" />
        {stats.nb_rencontres} rencontre{stats.nb_rencontres > 1 ? 's' : ''}
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

// ── Formulaire d'ajout / édition suivi ────────────────────────────────────────
interface SuiviFormData {
  date_rencontre: string;
  duree_minutes: number;
  type_rencontre: string;
  objectifs_atteints: boolean;
  notes: string;
}

const EMPTY_FORM: SuiviFormData = {
  date_rencontre: new Date().toISOString().slice(0, 10),
  duree_minutes: 60,
  type_rencontre: 'PRESENTIEL',
  objectifs_atteints: false,
  notes: '',
};

function SuiviForm({
  mentoratId,
  initial,
  suiId,
  onSaved,
  onCancel,
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
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = suiId
        ? await api.patch<SuiviRencontre>(`/mentor/mentorats/${mentoratId}/suivis/${suiId}/`, form)
        : await api.post<SuiviRencontre>(`/mentor/mentorats/${mentoratId}/suivis/`, form);
      onSaved(res.data);
    } catch (err) {
      setError((err as ApiError).response?.data?.error ?? 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
          <input type="date" value={form.date_rencontre}
            onChange={e => setForm({ ...form, date_rencontre: e.target.value })} required
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue bg-white transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Durée (min)</label>
          <input type="number" value={form.duree_minutes} min={5} max={480}
            onChange={e => setForm({ ...form, duree_minutes: parseInt(e.target.value) || 30 })} required
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue bg-white transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Type de rencontre</label>
        <div className="grid grid-cols-2 gap-2">
          {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button"
              onClick={() => setForm({ ...form, type_rencontre: value })}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                form.type_rencontre === value
                  ? 'bg-ora-blue text-white border-ora-blue shadow-sm shadow-ora-blue/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Notes de la rencontre</label>
        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={3} placeholder="Objectifs abordés, points clés, prochaines étapes..."
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue resize-none bg-white transition-all"
        />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer group">
        <div
          onClick={() => setForm({ ...form, objectifs_atteints: !form.objectifs_atteints })}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            form.objectifs_atteints ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-slate-400'
          }`}
        >
          {form.objectifs_atteints && <CheckCircle className="w-3 h-3 text-white" />}
        </div>
        <span className="text-sm font-medium text-slate-700">Objectifs de la rencontre atteints</span>
      </label>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-all">
          Annuler
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2 bg-ora-blue hover:bg-ora-dark text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm shadow-ora-blue/20">
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          {suiId ? 'Modifier' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

// ── Onglet Suivi ──────────────────────────────────────────────────────────────
function SuiviTab({ mentorat, onStatsChange }: { mentorat: MentoratActif; onStatsChange: (stats: SuiviStats) => void }) {
  const [suivis, setSuivis] = useState<SuiviRencontre[]>(mentorat.suivis);
  const [stats, setStats]   = useState<SuiviStats>(mentorat.suivi_stats);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const refreshStats = (updatedSuivis: SuiviRencontre[]) => {
    const nb    = updatedSuivis.length;
    const total = updatedSuivis.reduce((a, s) => a + s.duree_minutes, 0);
    const newStats = { nb_rencontres: nb, total_minutes: total, total_heures: Math.round(total / 60 * 10) / 10 };
    setStats(newStats);
    onStatsChange(newStats);
  };

  const handleSaved = (saved: SuiviRencontre) => {
    const updated = editId
      ? suivis.map(s => s.id === editId ? saved : s)
      : [saved, ...suivis];
    setSuivis(updated);
    refreshStats(updated);
    setShowForm(false);
    setEditId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette rencontre ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/mentor/mentorats/${mentorat.id}/suivis/${id}/`);
      const updated = suivis.filter(s => s.id !== id);
      setSuivis(updated);
      refreshStats(updated);
    } catch { /* silently fail */ }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-3">
      {/* Stats */}
      <SuiviStatsBadges stats={stats} />

      {/* Bouton ajouter */}
      {!showForm && !editId && (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-ora-blue/30 hover:border-ora-blue text-ora-blue hover:bg-ora-blue/3 rounded-xl text-xs font-semibold transition-all">
          <Plus className="w-3.5 h-3.5" /> Ajouter une rencontre
        </button>
      )}

      {/* Formulaire ajout */}
      {showForm && !editId && (
        <SuiviForm
          mentoratId={mentorat.id}
          onSaved={handleSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Liste des suivis */}
      {suivis.length === 0 && !showForm && (
        <div className="text-center py-6 text-slate-400">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Aucune rencontre enregistrée</p>
        </div>
      )}

      <div className="space-y-2">
        {suivis.map(s => {
          const TypeIcon = TYPE_ICONS[s.type_rencontre] ?? Users;
          const isExpanded = expanded === s.id;
          const isEditing  = editId === s.id;

          return (
            <div key={s.id} className="border border-slate-100 rounded-xl overflow-hidden">
              {/* Row header */}
              <div className="flex items-center gap-3 px-3 py-2.5 bg-white">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  s.objectifs_atteints ? 'bg-emerald-100' : 'bg-slate-100'
                }`}>
                  <TypeIcon className={`w-3.5 h-3.5 ${s.objectifs_atteints ? 'text-emerald-600' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {new Date(s.date_rencontre).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDuree(s.duree_minutes)}</span>
                    {s.objectifs_atteints && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">✓ Objectifs</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{s.type_rencontre_label}{s.notes ? ` · ${s.notes.slice(0, 40)}${s.notes.length > 40 ? '…' : ''}` : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditId(s.id); setShowForm(false); }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Modifier">
                    <Pencil className="w-3 h-3 text-slate-400" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                    {deleting === s.id ? <Loader2 className="w-3 h-3 animate-spin text-red-400" /> : <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />}
                  </button>
                  {s.notes && (
                    <button onClick={() => setExpanded(isExpanded ? null : s.id)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Notes dépliées */}
              {isExpanded && s.notes && (
                <div className="px-3 pb-3 pt-1 bg-slate-50 border-t border-slate-100">
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{s.notes}</p>
                </div>
              )}

              {/* Formulaire édition */}
              {isEditing && (
                <div className="p-3 border-t border-slate-100 bg-slate-50">
                  <SuiviForm
                    mentoratId={mentorat.id}
                    suiId={s.id}
                    initial={{
                      date_rencontre: s.date_rencontre,
                      duree_minutes: s.duree_minutes,
                      type_rencontre: s.type_rencontre,
                      objectifs_atteints: s.objectifs_atteints,
                      notes: s.notes,
                    }}
                    onSaved={handleSaved}
                    onCancel={() => setEditId(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── JeuneEditSection ──────────────────────────────────────────────────────────
interface EtabOption { id: number; nom: string; code_postal: string; }

function JeuneEditSection({ mentoratId, initial }: {
  mentoratId: number;
  initial: { situation: string; situation_label: string; etablissement_id: number | null; nom_etablissement: string };
}) {
  const [editing, setEditing]             = useState(false);
  const [situation, setSituation]         = useState(initial.situation);
  const [situationLabel, setSituationLabel] = useState(initial.situation_label);
  const [etabId, setEtabId]               = useState<number | null>(initial.etablissement_id);
  const [displayNom, setDisplayNom]       = useState(initial.nom_etablissement);
  const [autreNom, setAutreNom]           = useState(initial.etablissement_id ? '' : initial.nom_etablissement);
  const [etabs, setEtabs]                 = useState<EtabOption[]>([]);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');

  useEffect(() => {
    if (!editing) return;
    api.get<EtabOption[]>('/mentor/etablissements/').then(r => setEtabs(r.data)).catch(() => {});
  }, [editing]);

  const selectValue = etabId ? String(etabId) : (displayNom ? 'autre' : '');

  const handleSelectChange = (val: string) => {
    if (val === 'autre') { setEtabId(null); }
    else if (val === '') { setEtabId(null); setAutreNom(''); }
    else { setEtabId(Number(val)); setAutreNom(''); }
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    const payload: Record<string, unknown> = { situation };
    if (etabId) {
      payload.etablissement_id = etabId;
    } else {
      payload.etablissement_id = null;
      payload.nom_etablissement = autreNom.trim();
    }
    try {
      const res = await api.patch<{
        situation: string; situation_label: string;
        etablissement_id: number | null; nom_etablissement: string;
      }>(`/mentor/mentorats/${mentoratId}/jeune/`, payload);
      setSituationLabel(res.data.situation_label);
      setEtabId(res.data.etablissement_id);
      setDisplayNom(res.data.nom_etablissement);
      setAutreNom(res.data.etablissement_id ? '' : res.data.nom_etablissement);
      setEditing(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error ?? 'Erreur');
    } finally { setSaving(false); }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          {situationLabel
            ? <span className="font-semibold text-ora-blue">{situationLabel}</span>
            : <span className="text-slate-400 italic">Situation non renseignée</span>
          }
          {displayNom && (
            <><span className="text-slate-300">·</span><span>{displayNom}</span></>
          )}
        </div>
        <button onClick={() => setEditing(true)}
          className="shrink-0 p-1 hover:bg-white rounded-lg text-slate-300 hover:text-ora-blue transition-colors" title="Modifier">
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
      {error && <p className="text-[10px] text-red-600">{error}</p>}
      <div className="flex gap-2">
        {([
          ['apprentissage', 'En apprentissage'],
          ['recherche',     'En recherche'],
        ] as [string, string][]).map(([val, lbl]) => (
          <button key={val} type="button" onClick={() => setSituation(val)}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
              situation === val
                ? 'bg-ora-blue text-white border-ora-blue'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >{lbl}</button>
        ))}
      </div>
      {situation === 'apprentissage' && (
        <>
          <select
            value={selectValue}
            onChange={e => handleSelectChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40 focus:border-ora-blue"
          >
            <option value="">— Établissement / CFA —</option>
            {etabs.map(e => (
              <option key={e.id} value={String(e.id)}>{e.nom}{e.code_postal ? ` (${e.code_postal})` : ''}</option>
            ))}
            <option value="autre">Autre…</option>
          </select>
          {selectValue === 'autre' && (
            <input type="text" value={autreNom} onChange={e => setAutreNom(e.target.value)}
              placeholder="Nom de l'établissement…"
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40 focus:border-ora-blue"
            />
          )}
        </>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => setEditing(false)}
          className="flex-1 py-1.5 text-[11px] text-slate-500 border border-slate-200 rounded-lg hover:bg-white">
          Annuler
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex-1 py-1.5 text-[11px] font-semibold text-white bg-ora-blue rounded-lg hover:bg-ora-blue/90 disabled:opacity-50">
          {saving ? '…' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

// ── MentoratCard ──────────────────────────────────────────────────────────────
function MentoratCard({ mentorat, onCloture }: {
  mentorat: MentoratActif; onCloture: (m: ClotureMeta & { stats: SuiviStats }) => void
}) {
  const [tab, setTab] = useState<'info' | 'demande' | 'suivi'>('info');
  const [currentStats, setCurrentStats] = useState<SuiviStats>(mentorat.suivi_stats);

  const tabs = [
    { key: 'info',    label: 'Informations', icon: Users },
    { key: 'demande', label: 'Demande',       icon: FileText },
    { key: 'suivi',   label: 'Suivi',         icon: ClipboardList },
  ] as const;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md ${
      mentorat.alerte_rouge ? 'border-red-200 shadow-sm shadow-red-100' : 'border-slate-100 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between ${mentorat.alerte_rouge ? 'bg-red-50/50' : 'bg-slate-50/60'}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-ora-blue flex items-center justify-center text-white font-black text-base shadow-sm shadow-ora-blue/20 shrink-0">
            {mentorat.jeune.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{mentorat.jeune.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-400">{mentorat.jeune.email}</p>
              {currentStats.nb_rencontres > 0 && (
                <SuiviStatsBadges stats={currentStats} />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mentorat.alerte_rouge && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 border border-red-200 px-2 py-1 rounded-full uppercase tracking-wider">
              <AlertTriangle className="w-2.5 h-2.5" /> Alerte
            </span>
          )}
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full uppercase tracking-wider">Actif</span>
        </div>
      </div>

      {/* Notes AP */}
      {mentorat.notes_suivi && (
        <div className="mx-4 my-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3">
          <StickyNote className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Message de votre AP</p>
            <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-wrap">{mentorat.notes_suivi}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white border-b border-slate-100">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2 ${
              tab === key ? 'text-ora-blue border-ora-blue bg-ora-blue/3' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 py-4 bg-white">
        {tab === 'info' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: MapPin,    v: `${mentorat.jeune.ville || '—'}${mentorat.jeune.department ? ` · ${mentorat.jeune.department}` : ''}` },
                { icon: Phone,     v: mentorat.jeune.phone || '—' },
                { icon: Calendar,  v: mentorat.date_debut ? new Date(mentorat.date_debut).toLocaleDateString('fr-FR') : '—' },
                { icon: Calendar,  v: mentorat.duree_mois > 0 ? `${mentorat.duree_mois} mois` : 'Récent' },
              ].map(({ icon: Icon, v }, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <Icon className="w-3 h-3 text-slate-300 shrink-0" />
                  <span className="text-xs font-medium text-slate-600 truncate">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <UserCheck className="w-3 h-3 text-slate-300 shrink-0" />
              <span className="text-xs text-slate-500">Référent AP :</span>
              <span className="text-xs font-semibold text-slate-700">{mentorat.ap_referent}</span>
            </div>
            <JeuneEditSection
              mentoratId={mentorat.id}
              initial={{
                situation:         mentorat.jeune.situation,
                situation_label:   mentorat.jeune.situation_label,
                etablissement_id:  mentorat.jeune.etablissement_id,
                nom_etablissement: mentorat.jeune.nom_etablissement,
              }}
            />
          </div>
        )}

        {tab === 'demande' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Urgence</span>
              <UrgencyBadge level={mentorat.jeune.urgency_level} label={mentorat.jeune.urgency_label} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description des besoins</p>
              <div className="bg-ora-blue/3 border border-ora-blue/10 rounded-xl p-4">
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {mentorat.jeune.needs_description || 'Aucune description renseignée.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              Demande déposée le {mentorat.jeune.request_date ? new Date(mentorat.jeune.request_date).toLocaleDateString('fr-FR') : '—'}
            </div>
            {mentorat.problematiques.length > 0 && (
              <div className="px-3 py-2.5 bg-violet-50 rounded-xl border border-violet-100">
                <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-2">Axes de travail</p>
                <div className="flex flex-wrap gap-1.5">
                  {mentorat.problematiques.map(code => (
                    <span key={code} className="inline-flex items-center text-[10px] font-semibold text-violet-700 bg-white border border-violet-200 px-2 py-1 rounded-full">
                      {PROBLEMATIQUES_MAP[code] ?? code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'suivi' && (
          <SuiviTab mentorat={mentorat} onStatsChange={setCurrentStats} />
        )}
      </div>

      {/* Actions clôture */}
      {mentorat.cloture_en_attente ? (
        <div className="mx-5 mb-5 mt-3 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-700">
              {mentorat.cloture_action_demandee === 'ABORTED' ? 'Arrêt' : 'Clôture'} en attente de confirmation AP
            </p>
            <p className="text-[10px] text-amber-600 mt-0.5">Votre AP doit valider cette demande</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 px-5 pb-5 pt-3 border-t border-slate-50">
          <button onClick={() => onCloture({ mentorat, action: 'CLOSED', stats: currentStats })}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all border border-emerald-100 uppercase tracking-wide">
            <CheckCircle className="w-3.5 h-3.5" /> Clôturer
          </button>
          <button onClick={() => onCloture({ mentorat, action: 'ABORTED', stats: currentStats })}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-100 uppercase tracking-wide">
            <X className="w-3.5 h-3.5" /> Arrêter
          </button>
        </div>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export function ActiveMentorshipsCard({ mentorats, mentorName, onClosed }: Props) {
  const [clotureMeta, setClotureMeta] = useState<(ClotureMeta & { stats: SuiviStats }) | null>(null);
  const [message, setMessage] = useState('');
  const [reason,  setReason]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const openCloture = (meta: ClotureMeta & { stats: SuiviStats }) => {
    setClotureMeta(meta);
    setMessage(buildMessage(meta, mentorName, meta.stats));
    setReason(''); setError(null);
  };
  const closeCloture = () => { setClotureMeta(null); setError(null); };

  const handleConfirm = async () => {
    if (!clotureMeta) return;
    setSaving(true); setError(null);
    try {
      await api.post(`/mentor/mentorats/${clotureMeta.mentorat.id}/cloturer/`, {
        action: clotureMeta.action, message, reason,
      });
      // La clôture n'est pas immédiate : elle attend la confirmation AP.
      // On ferme le modal et on rafraîchit le dashboard pour afficher l'état "en attente".
      closeCloture(); onClosed();
    } catch (err) { setError((err as ApiError).response?.data?.error ?? 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div id="mentorats-en-cours" className="scroll-mt-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-ora-blue/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-ora-blue" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mentorats en cours</h2>
              <p className="text-xs text-slate-400">{mentorats.length} actif{mentorats.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {mentorats.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Aucun mentorat en cours</p>
            <p className="text-xs text-slate-300 mt-1">Vos mentorats actifs apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {mentorats.map(m => (
              <MentoratCard key={m.id} mentorat={m} onCloture={openCloture} />
            ))}
          </div>
        )}
      </div>

      {/* Modal clôture */}
      {clotureMeta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className={`px-6 py-4 border-b ${clotureMeta.action === 'CLOSED' ? 'border-emerald-100 bg-emerald-50/40' : 'border-red-100 bg-red-50/40'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-bold flex items-center gap-2 ${clotureMeta.action === 'CLOSED' ? 'text-emerald-800' : 'text-red-800'}`}>
                  {clotureMeta.action === 'CLOSED'
                    ? <><CheckCircle className="w-5 h-5" /> Clôturer le mentorat</>
                    : <><AlertTriangle className="w-5 h-5" /> Arrêter le mentorat</>}
                </h3>
                <button onClick={closeCloture} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Mentorat avec <strong>{clotureMeta.mentorat.jeune.name}</strong>
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Résumé rencontres */}
              {clotureMeta.stats.nb_rencontres > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Résumé de l'accompagnement</p>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-black text-ora-blue">{clotureMeta.stats.nb_rencontres}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">rencontre{clotureMeta.stats.nb_rencontres > 1 ? 's' : ''}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-2xl font-black text-slate-700">{formatDuree(clotureMeta.stats.total_minutes)}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">d'accompagnement</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Raison interne <span className="text-slate-300 font-normal normal-case">(pour votre dossier)</span>
                </label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Objectifs atteints, insertion professionnelle..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Message au jeune
                  <span className="text-slate-300 font-normal normal-case">(modifiable)</span>
                </label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={9}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue font-mono resize-y transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">Ce message sera transmis au jeune après confirmation de votre AP (destinataire : {clotureMeta.mentorat.jeune.email})</p>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Votre demande sera transmise à votre AP pour confirmation avant d'être effective.
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeCloture}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">
                  Annuler
                </button>
                <button onClick={handleConfirm} disabled={saving}
                  className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm ${
                    clotureMeta.action === 'CLOSED' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                  }`}>
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? 'En cours...' : clotureMeta.action === 'CLOSED' ? 'Demander la clôture' : "Demander l'arrêt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
