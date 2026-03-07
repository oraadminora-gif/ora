// src/pages/member/acp/ACPDashboard.tsx
import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, AlertTriangle, Building2 } from 'lucide-react';
import api from '../../../services/api';
import type { ACPDashboardData } from './ACPDashboard.types';
import { ACPStatsBar } from '../../../components/acp/ACPStatsBar';
import { ACPAssociationCard } from '../../../components/acp/ACPAssociationCard';
import { ACPDemandesPanel } from '../../../components/acp/ACPDemandesPanel';

interface ApiError { response?: { data?: { error?: string } } }

export function ACPDashboard() {
  const [data, setData] = useState<ACPDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<ACPDashboardData>('/acp/dashboard/');
      setData(res.data);
    } catch (err) {
      setError((err as ApiError).response?.data?.error ?? 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
    </div>
  );

  // ── Erreur ───────────────────────────────────────────────────────────────────
  if (error || !data) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">Erreur</h3>
      <p className="text-red-700 mb-4">{error}</p>
      <button
        onClick={fetchDashboard}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
      >
        Réessayer
      </button>
    </div>
  );

  const { coordinateur, stats, associations, demandes_en_attente } = data;

  return (
    <div className="space-y-6">

      {/* ── En-tête ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Espace Coordinateur</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-slate-500">
              {coordinateur.first_name} {coordinateur.last_name}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-sm font-semibold text-violet-600">
              Pôle {coordinateur.pole.name}
            </span>
            {coordinateur.pole.villes?.length > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-400">{coordinateur.pole.villes.join(', ')}</span>
              </>
            )}
          </div>
        </div>
        {/* Badge pôle */}
        <div className="shrink-0 text-right">
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold border uppercase tracking-wider bg-violet-50 text-violet-700 border-violet-200">
            ACP
          </span>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            {coordinateur.pole.code}
          </p>
        </div>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <ACPStatsBar stats={stats} />

      {/* ── Bannière alerte si urgences ─────────────────────────────────────── */}
      {(stats.alertes_rouges > 0 || stats.demandes_en_attente > 0) && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          stats.alertes_rouges > 0
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {stats.alertes_rouges > 0 && (
              <>
                <strong>
                  {stats.alertes_rouges} alerte{stats.alertes_rouges > 1 ? 's' : ''} rouge{stats.alertes_rouges > 1 ? 's' : ''}
                </strong>{' '}
                nécessite{stats.alertes_rouges > 1 ? 'nt' : ''} votre attention.{' '}
              </>
            )}
            {stats.demandes_en_attente > 0 && (
              <>
                <strong>
                  {stats.demandes_en_attente} demande{stats.demandes_en_attente > 1 ? 's' : ''}
                </strong>{' '}
                en attente de matching.
              </>
            )}
          </span>
        </div>
      )}

      {/* ── Contenu principal : 2 colonnes ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Colonne gauche : Associations (2/3) */}
        <div className="xl:col-span-2 space-y-4">
          {/* Header section */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Associations du pôle</h2>
              <p className="text-xs text-slate-400">
                {associations.length} association{associations.length > 1 ? 's' : ''} — {stats.total_ap} AP actif{stats.total_ap > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Grille associations */}
          {associations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
              <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">Aucune association dans ce pôle</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {associations.map(asso => (
                <ACPAssociationCard key={asso.id} association={asso} />
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite : Demandes (1/3) */}
        <div className="xl:col-span-1">
          <ACPDemandesPanel
            demandes={demandes_en_attente}
            poleId={coordinateur.pole.id}
            onRefresh={fetchDashboard}
          />
        </div>
      </div>
    </div>
  );
}
