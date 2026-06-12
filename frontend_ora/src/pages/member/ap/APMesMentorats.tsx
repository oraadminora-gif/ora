// src/pages/member/ap/APMesMentorats.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Loader2, AlertCircle, Search,
  Clock, BookOpen, MapPin, GraduationCap, Users,
  CheckCircle, XCircle, Mail, ChevronDown, ClipboardList, Download,
} from 'lucide-react';
import api from '../../../services/api';
import type { APDashboardData, APMesMenutorat, APMesMentoratPage } from './APDashboard.types';
import { APSuiviMentoratModal } from '../../../components/ap/APSuiviMentoratModal';

interface ApiError { response?: { data?: { error?: string } } }

// ── Statut badge ───────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIVE:  { label: 'Actif',      cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  PENDING: { label: 'En attente', cls: 'text-amber-700 bg-amber-50 border-amber-200'      },
  CLOSED:  { label: 'Clôturé',   cls: 'text-slate-500 bg-slate-50 border-slate-200'      },
  ABORTED: { label: 'Abandonné', cls: 'text-red-600 bg-red-50 border-red-200'            },
};

function StatusBadge({ status }: { status: APMesMenutorat['status'] }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.ACTIVE;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Inline edit situation/établissement du jeune ─────────────────────────────
interface EtabOption { id: number; nom: string; code_postal: string; }

function JeuneEditSection({ mentoratId, initial }: {
  mentoratId: number;
  initial: { situation: string; situation_label: string; etablissement_id: number | null; nom_etablissement: string };
}) {
  const [editing, setEditing]               = useState(false);
  const [situation, setSituation]           = useState(initial.situation);
  const [situationLabel, setSituationLabel] = useState(initial.situation_label);
  const [etabId, setEtabId]                 = useState<number | null>(initial.etablissement_id);
  const [displayNom, setDisplayNom]         = useState(initial.nom_etablissement);
  const [autreNom, setAutreNom]             = useState(initial.etablissement_id ? '' : initial.nom_etablissement);
  const [etabs, setEtabs]                   = useState<EtabOption[]>([]);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState('');

  useEffect(() => {
    if (!editing) return;
    api.get<EtabOption[]>('/ap/etablissements/').then(r => setEtabs(r.data)).catch(() => {});
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
      }>(`/ap/mentorats/${mentoratId}/jeune/`, payload);
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
      <div className="flex flex-wrap gap-1.5 text-[11px] mt-1.5">
        {situationLabel
          ? <span className="font-semibold text-ora-blue">{situationLabel}</span>
          : <span className="text-slate-300 italic">Situation non renseignée</span>
        }
        {displayNom && (
          <><span className="text-slate-300">·</span><span className="text-slate-500">{displayNom}</span></>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200" onClick={e => e.stopPropagation()}>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
      <div className="flex gap-1.5">
        {([['apprentissage', 'En apprentissage'], ['recherche', 'En recherche']] as [string, string][]).map(([val, lbl]) => (
          <button key={val} type="button" onClick={() => setSituation(val)}
            className={`flex-1 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
              situation === val
                ? 'bg-ora-blue text-white border-ora-blue'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}>{lbl}</button>
        ))}
      </div>
      <select
        value={selectValue}
        onChange={e => handleSelectChange(e.target.value)}
        className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40 focus:border-ora-blue"
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
          className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40 focus:border-ora-blue"
        />
      )}
      <div className="flex gap-1.5">
        <button type="button" onClick={() => setEditing(false)}
          className="flex-1 py-1 text-[10px] text-slate-500 border border-slate-200 rounded-lg hover:bg-white">Annuler</button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex-1 py-1 text-[10px] font-semibold text-white bg-ora-blue rounded-lg hover:bg-ora-blue/90 disabled:opacity-50">
          {saving ? '…' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

// ── Carte mentorat ─────────────────────────────────────────────────────────────
function MentoratCard({ mentorat, onSuivi }: {
  mentorat: APMesMenutorat;
  onSuivi: () => void;
}) {
  const inactif = mentorat.status === 'ACTIVE' && mentorat.inactivite.level !== 'ok';
  const borderCls = mentorat.alerte_rouge
    ? 'border-red-300 bg-red-50/30'
    : (inactif && mentorat.inactivite.level === 'alert')
    ? 'border-orange-200 bg-orange-50/20'
    : 'border-slate-200 bg-white';

  const avatarInitials = mentorat.mentor.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`relative rounded-xl border-2 p-4 ${borderCls}`}>
      <button
        onClick={onSuivi}
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-ora-blue/10 hover:bg-ora-blue text-ora-blue hover:text-white rounded-lg text-xs font-semibold border border-ora-blue/20 hover:border-ora-blue transition-all"
      >
        <ClipboardList className="w-3.5 h-3.5" />
        Suivi
      </button>

      <div className="flex items-start gap-3 pr-20">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-ora-blue flex items-center justify-center text-white font-bold text-sm">
          {avatarInitials}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900 truncate">{mentorat.mentor.name}</p>
            <StatusBadge status={mentorat.status} />
            {mentorat.alerte_rouge && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600">
                <AlertTriangle className="w-3 h-3" />Alerte
              </span>
            )}
            {mentorat.mentor.is_trained && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                <GraduationCap className="w-2 h-2 inline mr-0.5" />Formé
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            <span className="font-medium text-slate-500">{mentorat.mentor.association}</span>
            {mentorat.mentor.city && (
              <span className="ml-1">· <MapPin className="w-3 h-3 inline" />{mentorat.mentor.city}</span>
            )}
          </div>
          {mentorat.jeune && (
            <div className="text-[11px] space-y-1 mt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-700 font-semibold">{mentorat.jeune.name}</span>
                {mentorat.jeune.phone && (
                  <span className="text-slate-400 flex items-center gap-0.5">
                    <Mail className="w-2.5 h-2.5" />{mentorat.jeune.phone}
                  </span>
                )}
                {mentorat.jeune.city && (
                  <span className="text-slate-400 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />{mentorat.jeune.city}
                  </span>
                )}
                {mentorat.jeune.diplome_label && (
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full">
                    {mentorat.jeune.diplome_label}
                  </span>
                )}
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
              {mentorat.jeune.needs_description && (
                <p className="text-slate-500 italic leading-relaxed line-clamp-2">
                  {mentorat.jeune.needs_description}
                </p>
              )}
              {mentorat.objectif_mentor && (
                <p className="text-ora-blue text-[10px] font-medium">
                  Objectif : {mentorat.objectif_mentor}
                </p>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap pt-1">
            {mentorat.status === 'ACTIVE' && mentorat.inactivite.jours !== null && (
              <span className={
                mentorat.inactivite.level === 'alert' ? 'text-red-500 font-semibold'
                : mentorat.inactivite.level === 'warn' ? 'text-orange-500 font-semibold'
                : ''
              }>
                {mentorat.inactivite.jours}j sans contact
              </span>
            )}
            {mentorat.assigned_at && (
              <span>depuis le {new Date(mentorat.assigned_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Carte clôture en attente ────────────────────────────────────────────────────
function ClotureEnAttenteCard({
  mentorat, onAction, busy,
}: {
  mentorat: APMesMenutorat;
  onAction: (id: number, action: 'confirm' | 'reject', message?: string) => void;
  busy: number | null;
}) {
  const isClose = mentorat.cloture_action_demandee === 'CLOSED';
  const [message, setMessage] = useState(mentorat.cloture_message_demandee ?? '');

  return (
    <div className={`rounded-xl border-2 p-4 space-y-3 ${
      isClose ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/20'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
              isClose ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : 'text-red-600 bg-red-100 border-red-200'
            }`}>
              {isClose ? 'Demande de clôture' : "Demande d'arrêt"}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-800 mt-1">{mentorat.mentor.name}</p>
          {mentorat.jeune && (
            <p className="text-xs text-slate-500">Jeune : <span className="font-semibold">{mentorat.jeune.name}</span></p>
          )}
        </div>
        <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      </div>
      {mentorat.cloture_reason_demandee && (
        <div className="bg-white/70 rounded-lg px-3 py-2 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Raison (mentor)</p>
          <p className="text-xs text-slate-700">{mentorat.cloture_reason_demandee}</p>
        </div>
      )}
      <div>
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
          <Mail className="w-3 h-3" /> Message au jeune
          <span className="font-normal normal-case text-slate-300">(modifiable)</span>
        </label>
        <textarea
          rows={5}
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue resize-y bg-white transition-all"
          placeholder="Ce message sera envoyé au jeune lors de la confirmation…"
        />
        <p className="text-[10px] text-slate-300 mt-1">Envoyé uniquement si vous confirmez la clôture.</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAction(mentorat.id, 'confirm', message)}
          disabled={busy === mentorat.id}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
        >
          {busy === mentorat.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          Confirmer
        </button>
        <button
          onClick={() => onAction(mentorat.id, 'reject', message)}
          disabled={busy === mentorat.id}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
          Rejeter
        </button>
      </div>
    </div>
  );
}

// ── Filtre status ──────────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'ACTIVE' | 'CLOSED' | 'ABORTED';

function FilterPill({ active, onClick, label, count, colorActive }: {
  active: boolean; onClick: () => void; label: string; count: number; colorActive: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        active ? `${colorActive} shadow-sm` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
      }`}
    >
      {label}
      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
        active ? 'bg-white/30' : 'bg-slate-100 text-slate-400'
      }`}>{count}</span>
    </button>
  );
}

const PAGE_SIZE = 15;

// ── Page principale ────────────────────────────────────────────────────────────
export function APMesMentorats() {
  const [data, setData]       = useState<APDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [busyCloture, setBusyCloture] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const [mentorats, setMentorats]       = useState<APMesMenutorat[]>([]);
  const [mentoratsMeta, setMentoratsMeta] = useState<Omit<APMesMentoratPage, 'results'> | null>(null);
  const [mentoratLoading, setMentoratLoading] = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [selectedSuiviId, setSelectedSuiviId] = useState<number | null>(null);
  const [exportDebut, setExportDebut]         = useState('');
  const [exportFin, setExportFin]             = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get<APDashboardData>('/ap/dashboard/');
      setData(res.data);
    } catch (err) {
      setError((err as ApiError).response?.data?.error ?? 'Erreur lors du chargement');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const fetchMentorats = useCallback(async (status: StatusFilter, q: string, page: number, append = false) => {
    if (page === 1) setMentoratLoading(true); else setLoadingMore(true);
    try {
      const params: Record<string, string | number> = { status, page, page_size: PAGE_SIZE };
      if (q) params.search = q;
      const res = await api.get<APMesMentoratPage>('/ap/mes-mentorats/', { params });
      const { results, ...meta } = res.data;
      setMentoratsMeta(meta);
      setMentorats(prev => append ? [...prev, ...results] : results);
    } catch { /* silencieux */ }
    finally { setMentoratLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => {
    fetchMentorats(statusFilter, search, 1, false);
  }, [statusFilter, search, fetchMentorats]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 350);
  };

  const handleLoadMore = () => {
    if (!mentoratsMeta?.has_next) return;
    fetchMentorats(statusFilter, search, mentoratsMeta.page + 1, true);
  };

  const handleClotureAction = async (mentoratId: number, action: 'confirm' | 'reject', message?: string) => {
    setBusyCloture(mentoratId);
    try {
      await api.post(`/ap/mentorats/${mentoratId}/confirmer-cloture/`, {
        action,
        ...(message !== undefined ? { message } : {}),
      });
      fetchDashboard();
      fetchMentorats(statusFilter, search, 1, false);
    } catch { fetchDashboard(); fetchMentorats(statusFilter, search, 1, false); }
    finally { setBusyCloture(null); }
  };

  const counts = {
    all:     data?.stats.mes_mentorats_total     ?? 0,
    ACTIVE:  data?.stats.mes_mentorats_actifs    ?? 0,
    CLOSED:  data?.stats.mes_mentorats_clotures  ?? 0,
    ABORTED: data?.stats.mes_mentorats_abandonnes ?? 0,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-ora-blue" />
    </div>
  );

  if (error || !data) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">Erreur</h3>
      <p className="text-red-700 mb-4">{error}</p>
      <button onClick={fetchDashboard} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold">
        Réessayer
      </button>
    </div>
  );

  const { animateur, stats } = data;

  return (
    <div className="space-y-6">

      {/* ── En-tête ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Pôle {animateur.pole.name ?? animateur.pole.code}
            {animateur.pole.villes?.length > 0 && (
              <span className="text-slate-400 font-normal"> · {animateur.pole.villes[0]}</span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Suivi des mentors assignés à{' '}
            <span className="font-semibold text-slate-700">{animateur.first_name} {animateur.last_name}</span>
            <span className="text-slate-300 mx-1.5">·</span>
            <span className="font-semibold text-ora-blue">{animateur.association.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={exportDebut} onChange={e => setExportDebut(e.target.value)}
            title="Date début (affectation)"
            className="px-2.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400" />
          <span className="text-slate-400 text-sm">→</span>
          <input type="date" value={exportFin} onChange={e => setExportFin(e.target.value)}
            title="Date fin (affectation)"
            className="px-2.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400" />
          <button
            onClick={async () => {
              try {
                const params: Record<string, string> = {};
                if (exportDebut) params.date_debut = exportDebut;
                if (exportFin)   params.date_fin   = exportFin;
                const res = await api.get<{ mentorats: Record<string, unknown>[]; count: number }>(
                  '/ap/mes-mentorats/export/', { params }
                );
                if (!res.data.mentorats.length) { alert('Aucun mentorat sur cette période.'); return; }
                const ws = XLSX.utils.json_to_sheet(res.data.mentorats);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Mes mentorats');
                const suffix = exportDebut || exportFin
                  ? `_${exportDebut || ''}_${exportFin || ''}`
                  : `_${new Date().toISOString().slice(0, 10)}`;
                XLSX.writeFile(wb, `MesMentorats_${animateur.last_name}${suffix}.xlsx`);
              } catch { alert("Erreur lors de l'export."); }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* ── Clôtures en attente ──────────────────────────────────────────────── */}
      {data.clotures_en_attente.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Clôtures en attente</h2>
              <p className="text-xs text-amber-600">
                {data.clotures_en_attente.length} demande{data.clotures_en_attente.length > 1 ? 's' : ''} à valider
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {data.clotures_en_attente.map(m => (
              <ClotureEnAttenteCard
                key={m.id}
                mentorat={m}
                onAction={handleClotureAction}
                busy={busyCloture}
              />
            ))}
          </div>
        </div>
      )}


      {/* ── Liste mentorats ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Liste des mentorats</h2>
              <p className="text-xs text-slate-400">
                {mentoratsMeta ? (
                  <>
                    {mentorats.length} affiché{mentorats.length !== 1 ? 's' : ''}
                    {mentoratsMeta.count > mentorats.length && ` sur ${mentoratsMeta.count}`}
                  </>
                ) : (
                  <>— sur {stats.mes_mentorats_total} au total</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <Users className="w-3.5 h-3.5" />
            <span>{stats.total_mentors} mentor{stats.total_mentors !== 1 ? 's' : ''} dans l'asso.</span>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Mentor, jeune, association, ville…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterPill active={statusFilter === 'all'}     onClick={() => setStatusFilter('all')}     label="Tous"       count={counts.all}     colorActive="bg-slate-800 text-white border-slate-800" />
            <FilterPill active={statusFilter === 'ACTIVE'}  onClick={() => setStatusFilter('ACTIVE')}  label="Actifs"     count={counts.ACTIVE}  colorActive="bg-emerald-600 text-white border-emerald-600" />
            <FilterPill active={statusFilter === 'CLOSED'}  onClick={() => setStatusFilter('CLOSED')}  label="Clôturés"   count={counts.CLOSED}  colorActive="bg-slate-600 text-white border-slate-600" />
            <FilterPill active={statusFilter === 'ABORTED'} onClick={() => setStatusFilter('ABORTED')} label="Abandonnés" count={counts.ABORTED} colorActive="bg-red-600 text-white border-red-600" />
          </div>
        </div>

        {mentoratLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-ora-blue" />
          </div>
        ) : mentorats.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
              {counts.all === 0
                ? <BookOpen className="w-6 h-6 text-slate-300" />
                : <Search className="w-6 h-6 text-slate-300" />
              }
            </div>
            <p className="text-sm font-semibold text-slate-400">
              {counts.all === 0 ? 'Aucun mentorat à suivre' : 'Aucun mentorat trouvé'}
            </p>
            <p className="text-xs text-slate-300 mt-1">
              {counts.all === 0
                ? 'Vous apparaîtrez ici dès que vous serez assigné comme AP sur un mentorat'
                : 'Essayez de modifier vos filtres ou votre recherche'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {mentorats.map(m => (
                <MentoratCard
                  key={m.id}
                  mentorat={m}
                  onSuivi={() => setSelectedSuiviId(m.id)}
                />
              ))}
            </div>
            {mentoratsMeta?.has_next && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all shadow-sm"
                >
                  {loadingMore
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Chargement…</>
                    : <><ChevronDown className="w-4 h-4" />Charger plus ({mentoratsMeta.count - mentorats.length} restant{mentoratsMeta.count - mentorats.length > 1 ? 's' : ''})</>
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedSuiviId !== null && (
        <APSuiviMentoratModal
          mentoratId={selectedSuiviId}
          onClose={() => setSelectedSuiviId(null)}
          onSaved={() => { fetchDashboard(); fetchMentorats(statusFilter, search, 1, false); }}
        />
      )}
    </div>
  );
}
