import React, { useEffect, useState } from 'react';
import { fetchPoleKPIs } from '../../services/kpiService';
import {
  PieChart,
  Pie,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type{ PoleKPI } from '../../types/kpi';

const PoleDashboard: React.FC = () => {
  const [data, setData] = useState<PoleKPI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getKPIs = async () => {
      try {
        const result = await fetchPoleKPIs();
        setData(result);
      } catch (error) {
        console.error('Erreur KPIs Pôle', error);
      } finally {
        setLoading(false);
      }
    };
    getKPIs();
  }, []);

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (!data) return <p className="text-center mt-10">Pas de données disponibles</p>;

  /* Données avec couleurs intégrées */
  const sexData = [
    { name: 'Filles', value: data.filles, fill: '#ec4899' },
    { name: 'Garçons', value: data.garcons, fill: '#3b82f6' },
  ];

  const mentoratsData = [
    { name: 'Actifs', value: data.mentorats_actifs, fill: '#22c55e' },
    { name: 'Clos', value: data.mentorats_closes, fill: '#60a5fa' },
    {
      name: 'Alertes rouges',
      value: data.mentorats_alertes_rouges,
      fill: '#ef4444',
    },
  ];

  return (
    <div className="p-6 bg-white shadow rounded-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">KPIs Pôle</h1>

      {/* Section Demandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-gray-50 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2">Demandes</h2>
          <p>Total : {data.total_demandes}</p>
          <p>Filles : {data.filles} ({data.filles_pct}%)</p>
          <p>Garçons : {data.garcons} ({data.garcons_pct}%)</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2">
            Répartition filles / garçons
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={sexData}
                dataKey="value"
                nameKey="name"
                outerRadius={70}
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section Mentorats */}
      <div className="p-4 bg-gray-50 rounded-lg shadow">
        <h2 className="font-semibold text-lg mb-2">Mentorats</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mentoratsData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Section Mentors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-gray-50 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2">Mentors</h2>
          <p>Total : {data.mentors_total}</p>
          <p>Disponibles : {data.mentors_disponibles}</p>

          {data.mentors_par_association && (
            <ul className="mt-2">
              {data.mentors_par_association.map((m) => (
                <li key={m.association__name}>
                  {m.association__name} : {m.count}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoleDashboard;
