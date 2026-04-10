// src/pages/member/acp/GestionMentorats.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../services/api';
import {
  Search, Loader2, AlertCircle, Pencil, X, CheckCircle,
  HandHeart, AlertTriangle, Calendar, User, FileText,
  UserCheck, Building2, Download, ClipboardList, Lock,
} from 'lucide-react';
import {
  APMentoratSuiviModal,
  APSuiviPanelModal,
  CloturerDirectModal,
} from '../../../components/shared/MentoratAPWidgets';

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

interface Animateur { id: number; name: string; association: string; }

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
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const poleChanged   = assignedPoleId !== String(mentorat.pole_id);
  const mentorChanged = mentorId !== String(mentorat.mentor_id);

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
        notes_suivi:       notesSuivi,
        ap_responsable_id: apId ? Number(apId) : null,
      };
      if (status !== mentorat.status) {
        payload.status = status;
        if (needClosure) payload.closure_reason = closureReason.trim();
      }
      if (mentorChanged) payload.mentor_id = Number(mentorId);
      if (poleChanged)   payload.pole_id   = Number(assignedPoleId);
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

// ─────────────────────────────────────────────────────────────
// MODAL EXPORT
// ─────────────────────────────────────────────────────────────
function ExportModal({ onClose }: { onClose: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin,   setDateFin]   = useState(today);
  const [fmt,       setFmt]       = useState<'csv' | 'xlsx'>('xlsx');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleExport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ file_format: fmt });
      if (dateDebut) params.append('date_debut', dateDebut);
      if (dateFin)   params.append('date_fin',   dateFin);

      const res = await api.get(`/pole/mentorats/export-csv/?${params}`, {
        responseType: 'blob',
      });

      const disposition = res.headers['content-disposition'] ?? '';
      const match = disposition.match(/filename="(.+?)"/);
      const filename = match ? match[1] : `mentorats_export.${fmt}`;

      const mimeType = fmt === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv;charset=utf-8;';

      const url  = URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      setError("Erreur lors de l'export. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const INPUT = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-ora-blue" />
            <h2 className="text-base font-bold text-slate-900">Exporter les mentorats</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Format */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Format</label>
            <div className="flex gap-2">
              {(['xlsx', 'csv'] as const).map(f => (
                <button key={f} onClick={() => setFmt(f)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                    fmt === f
                      ? 'border-ora-blue bg-ora-blue/5 text-ora-blue'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  {f === 'xlsx' ? 'Excel (.xlsx)' : 'CSV (.csv)'}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-500">
            Filtrez par <span className="font-semibold">date de début</span> des mentorats.
            Laissez vide pour tout exporter.
          </p>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Date de début</label>
              <input type="date" value={dateDebut}
                onChange={e => setDateDebut(e.target.value)}
                className={INPUT} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Date de fin</label>
              <input type="date" value={dateFin}
                max={today}
                onChange={e => setDateFin(e.target.value)}
                className={INPUT} />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-600">Colonnes exportées :</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Jeune (identité, diplôme, situation, établissement)</li>
              <li>Mentor (coordonnées, association, formation)</li>
              <li>AP responsable</li>
              <li>Mentorat (statut, dates, notes, problématiques)</li>
              <li>Financeurs associés</li>
              <li>Activité de suivi (nb rencontres, durée, types)</li>
            </ul>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
            Annuler
          </button>
          <button onClick={handleExport} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-ora-blue text-white text-sm font-bold rounded-xl hover:bg-ora-blue/90 disabled:opacity-60 transition-all">
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />
            }
            {loading ? 'Téléchargement…' : `Télécharger ${fmt.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [showExport, setShowExport]   = useState(false);
  const [showSuiviModal, setShowSuiviModal]       = useState<number | null>(null);
  const [showRencontresModal, setShowRencontresModal] = useState<number | null>(null);
  const [showClotureModal, setShowClotureModal]   = useState<number | null>(null);

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suivi des mentorats</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {counts.ACTIVE} actifs · {counts.PENDING} en attente · {counts.CLOSED + counts.ABORTED} clôturés
          </p>
        </div>
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm shrink-0"
        >
          <Download className="w-4 h-4" />
          Exporter
        </button>
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
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => setEditing(m)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                          title={m.status === 'CLOSED' || m.status === 'ABORTED' ? 'Consulter' : 'Modifier'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {m.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => setShowSuiviModal(m.id)}
                              className="p-1.5 hover:bg-violet-50 rounded-lg text-slate-400 hover:text-violet-600 transition-colors"
                              title="Modifier le suivi"
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setShowRencontresModal(m.id)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-ora-blue transition-colors"
                              title="Rencontres"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setShowClotureModal(m.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                              title="Clôturer / Arrêter"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {showExport && (
        <ExportModal onClose={() => setShowExport(false)} />
      )}

      {/* Modals AP/ACP partagés */}
      {showSuiviModal !== null && (
        <APMentoratSuiviModal
          mentoratId={showSuiviModal}
          jeuneName={mentorats.find(m => m.id === showSuiviModal)?.jeune_name ?? '—'}
          onClose={() => setShowSuiviModal(null)}
        />
      )}

      {showRencontresModal !== null && (
        <APSuiviPanelModal
          mentoratId={showRencontresModal}
          jeuneName={mentorats.find(m => m.id === showRencontresModal)?.jeune_name ?? '—'}
          onClose={() => setShowRencontresModal(null)}
        />
      )}

      {showClotureModal !== null && (
        <CloturerDirectModal
          id={showClotureModal}
          jeuneName={mentorats.find(m => m.id === showClotureModal)?.jeune_name ?? '—'}
          onClose={() => setShowClotureModal(null)}
          onDone={() => { setShowClotureModal(null); loadData(); setSuccessMsg('Mentorat clôturé.'); setTimeout(() => setSuccessMsg(null), 4000); }}
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
