// src/pages/member/cn/CNDashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchNationalKPIsDetailed } from '../../../services/kpiService';
import type { NationalKPIDetailed, PoleSummaryKPI } from '../../../types/kpi';
import { useAuth } from '../../../contexts/AuthContext';
import {
  MapPin,
  Users,
  AlertTriangle,
  UserCheck,
  ArrowRight,
  BarChart2,
} from 'lucide-react';

export function CNDashboard() {
  const { user } = useAuth();
  const fullAccess = user?.cn_acces_complet ?? false;
  const [kpis, setKpis] = useState<NationalKPIDetailed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNationalKPIsDetailed('year')
      .then(data => setKpis(data))
      .catch(err => console.error('Error fetching CN data:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ora-blue"></div>
      </div>
    );
  }

  const poles = kpis.par_pole ?? [];
  const totalAlerts = kpis.alertes_rouges_actives ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Coordination Nationale</h1>
        <p className="text-slate-600">Vue d'ensemble de l'organisation</p>
      </div>

      {/* National Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MapPin className="w-6 h-6 text-blue-600" />}
          label="Pôles"
          value={kpis.poles_total}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-6 h-6 text-green-600" />}
          label="Jeunes accompagnés"
          value={kpis.total_jeunes}
          color="green"
        />
        <StatCard
          icon={<UserCheck className="w-6 h-6 text-purple-600" />}
          label="Mentorats en cours"
          value={kpis.mentorats_actifs}
          color="purple"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          label="Alertes nationales"
          value={totalAlerts}
          color="red"
          highlight={totalAlerts > 0}
        />
      </div>

      {/* Gender Balance */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Équilibre genre national</h2>
        <div className="flex items-center gap-8">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-pink-600 font-medium">Filles {kpis.filles_pct}%</span>
              <span className="text-blue-600 font-medium">Garçons {kpis.garcons_pct}%</span>
            </div>
            <div className="h-4 bg-slate-200 rounded-full overflow-hidden flex">
              <div className="h-full bg-pink-500" style={{ width: `${kpis.filles_pct}%` }} />
              <div className="h-full bg-blue-500" style={{ width: `${kpis.garcons_pct}%` }} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">{kpis.total_jeunes}</p>
            <p className="text-sm text-slate-500">total</p>
          </div>
        </div>
      </div>

      {/* Poles List */}
      {poles.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Aperçu des pôles</h2>
            {fullAccess && (
              <Link
                to="/member/cn/poles"
                className="text-sm text-ora-blue hover:text-ora-dark font-medium flex items-center gap-1"
              >
                Gérer les pôles <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="divide-y divide-slate-200">
            {poles.slice(0, 5).map((pole) => (
              <PoleRow key={pole.id} pole={pole} />
            ))}
          </div>

          {poles.length > 5 && fullAccess && (
            <div className="px-6 py-3 border-t border-slate-200 text-center">
              <Link to="/member/cn/poles" className="text-sm text-slate-600 hover:text-ora-blue">
                Voir les {poles.length - 5} autres pôles
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fullAccess && (
          <>
            <QuickLinkCard
              to="/member/cn/mentors"
              icon={<UserCheck className="w-6 h-6" />}
              title="Gestion mentors"
              description="Consulter et gérer les mentors de l'organisation"
            />
            <QuickLinkCard
              to="/member/cn/poles"
              icon={<MapPin className="w-6 h-6" />}
              title="Gestion pôles"
              description="Créer et configurer les pôles régionaux"
            />
          </>
        )}
        <QuickLinkCard
          to="/member/cn/kpis"
          icon={<BarChart2 className="w-6 h-6" />}
          title="KPIs Nationaux"
          description="Statistiques détaillées et rapports nationaux"
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, highlight }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl p-5 border ${highlight ? 'border-red-300 bg-red-50' : 'border-slate-200'} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 bg-${color}-100 rounded-lg`}>{icon}</div>
        {highlight && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-600">{label}</p>
      </div>
    </div>
  );
}

function PoleRow({ pole }: { pole: PoleSummaryKPI }) {
  return (
    <div className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-2 h-12 rounded-full bg-green-500" />
        <div>
          <h3 className="font-medium text-slate-900">{pole.name}</h3>
          <p className="text-sm text-slate-500">Code : {pole.code}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{pole.total_demandes}</p>
          <p className="text-xs text-slate-500">demandes</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{pole.mentorats_actifs}</p>
          <p className="text-xs text-slate-500">mentorats</p>
        </div>
        {pole.alertes_rouges > 0 && (
          <div className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            {pole.alertes_rouges} alertes
          </div>
        )}
      </div>
    </div>
  );
}

function QuickLinkCard({ to, icon, title, description }: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:border-ora-blue hover:shadow-md transition-all"
    >
      <div className="p-3 bg-ora-blue/10 text-ora-blue rounded-lg">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      </div>
    </Link>
  );
}
