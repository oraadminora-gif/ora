import React, { useEffect, useState } from 'react';
import { fetchNationalKPIs } from '../../services/kpiService';
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
import type{ NationalKPI } from '../../types/kpi';

const NationalDashboard: React.FC = () => {
  const [data, setData] = useState<NationalKPI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getKPIs = async () => {
      try {
        const result = await fetchNationalKPIs();
        setData(result);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    getKPIs();
  }, []);

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (!data) return <p className="text-center mt-10">Pas de données disponibles</p>;

  const sexData = [
    {
      name: 'Filles',
      value: Math.round((data.total_jeunes * data.filles_pct) / 100),
      fill: '#ec4899',
    },
    {
      name: 'Garçons',
      value: Math.round((data.total_jeunes * data.garcons_pct) / 100),
      fill: '#3b82f6',
    },
  ];

  const mentoratsData = [
    { name: 'Actifs', value: data.mentorats_actifs, fill: '#22c55e' },
    { name: 'Clos', value: data.mentorats_closes, fill: '#60a5fa' },
  ];

  return (
    <div className="p-6 bg-white shadow rounded-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">KPIs Nationaux</h1>

      <div className="p-4 bg-gray-50 rounded-lg shadow">
        <p>Total pôles : {data.poles_total}</p>
        <p>Pôles actifs : {data.poles_actifs}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-gray-50 rounded-lg shadow">
          <p>Total jeunes : {data.total_jeunes}</p>
          <p>Filles : {data.filles_pct}%</p>
          <p>Garçons : {data.garcons_pct}%</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg shadow">
          <h2 className="font-semibold mb-2">
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

      <div className="p-4 bg-gray-50 rounded-lg shadow">
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

      <div className="p-4 bg-gray-50 rounded-lg shadow">
        <h2 className="font-semibold mb-2">Mentors par pôle</h2>
        <ul>
          {data.mentors_par_pole.map((m) => (
            <li key={m.pole__name}>
              {m.pole__name} : {m.count}
            </li>
          ))}
        </ul>
      </div>

      {data.mentors_par_association && (
        <div className="p-4 bg-gray-50 rounded-lg shadow">
          <h2 className="font-semibold mb-2">
            Mentors par association
          </h2>
          <ul>
            {data.mentors_par_association.map((m) => (
              <li key={m.association__name}>
                {m.association__name} : {m.count}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NationalDashboard;
