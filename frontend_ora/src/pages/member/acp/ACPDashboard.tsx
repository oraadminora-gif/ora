// src/pages/member/acp/ACPDashboard.tsx
import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Building2 } from 'lucide-react';
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
          <h1 className="text-2xl font-bold text-slate-900">
            Pôle {coordinateur.pole.name ?? coordinateur.pole.code}
            {coordinateur.pole.villes?.length > 0 && (
              <span className="text-slate-400 font-normal">
                {' · '}{coordinateur.pole.villes[0]}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {coordinateur.first_name} {coordinateur.last_name}
          </p>
        </div>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <ACPStatsBar stats={stats} />


      {/* ── Contenu principal ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Associations (3/5) */}
        <div className="xl:col-span-3 space-y-4">
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

        {/* Demandes (2/5) */}
        <div className="xl:col-span-2">
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
