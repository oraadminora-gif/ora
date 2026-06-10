// src/pages/member/ap/APDashboard.tsx
import { useState, useEffect } from 'react';
import {
  Loader2, AlertCircle, AlertTriangle,
  Clock, CheckCircle, XCircle, Mail,
} from 'lucide-react';
import api from '../../../services/api';
import type { APDashboardData, APMesMenutorat } from './APDashboard.types';
import { APStatsBar } from '../../../components/ap/APStatsBar';
import { ACPDemandesPanel } from '../../../components/acp/ACPDemandesPanel';

interface ApiError { response?: { data?: { error?: string } } }

// ── Carte clôture en attente ───────────────────────────────────────────────────
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

// ── Page AP (sans rôle ACP) ────────────────────────────────────────────────────
export function APDashboard() {
  const [data, setData]             = useState<APDashboardData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [busyCloture, setBusyCloture] = useState<number | null>(null);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get<APDashboardData>('/ap/dashboard/');
      setData(res.data);
    } catch (err) {
      setError((err as ApiError).response?.data?.error ?? 'Erreur lors du chargement');
    } finally { setLoading(false); }
  };

  const handleClotureAction = async (mentoratId: number, action: 'confirm' | 'reject', message?: string) => {
    setBusyCloture(mentoratId);
    try {
      await api.post(`/ap/mentorats/${mentoratId}/confirmer-cloture/`, {
        action,
        ...(message !== undefined ? { message } : {}),
      });
    } catch { /* silencieux */ }
    finally { setBusyCloture(null); fetchDashboard(); }
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Pôle {animateur.pole.name ?? animateur.pole.code}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-slate-500">{animateur.first_name} {animateur.last_name}</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm font-semibold text-ora-blue">{animateur.association.name}</span>
          </div>
        </div>
        <span className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border uppercase tracking-wider bg-sky-50 text-sky-700 border-sky-200">
          AP
        </span>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <APStatsBar stats={stats} />

      {/* ── Bannière d'alerte ────────────────────────────────────────────────── */}
      {(stats.alertes_rouges > 0 || stats.mentors_inactifs > 0) && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          stats.alertes_rouges > 0
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-orange-50 border-orange-200 text-orange-800'
        }`}>
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {stats.alertes_rouges > 0 && (
              <><strong>{stats.alertes_rouges} alerte{stats.alertes_rouges > 1 ? 's' : ''} rouge{stats.alertes_rouges > 1 ? 's' : ''}</strong> nécessite{stats.alertes_rouges > 1 ? 'nt' : ''} votre attention. </>
            )}
            {stats.mentors_inactifs > 0 && (
              <><strong>{stats.mentors_inactifs} mentor{stats.mentors_inactifs > 1 ? 's' : ''}</strong> sans contact depuis plus de 30 jours.</>
            )}
          </span>
        </div>
      )}

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

      {/* ── Demandes en attente du pôle ──────────────────────────────────────── */}
      {animateur.pole.id !== null && (
        <ACPDemandesPanel poleId={animateur.pole.id} />
      )}
    </div>
  );
}
