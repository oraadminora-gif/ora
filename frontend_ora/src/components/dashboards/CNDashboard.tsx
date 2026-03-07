// src/components/dashboard/CNDashboard.tsx
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import api from '../../services/api';

interface CNDashboardData {
  poles_total: number;
  poles_actifs: number;
  total_jeunes: number;
  filles_pct: number;
  garcons_pct: number;
  mentorats_actifs: number;
  mentorats_closes: number;
  alertes_rouges: number;
  mentors_total: number;
  mentors_dispo: number;
  mentors_par_pole: { pole__name: string; count: number }[];
  mentors_par_association: { association__name: string; count: number }[];
}

const COLORS = ['#4ade80', '#60a5fa', '#f87171'];

const CNDashboard: React.FC = () => {
  const [data, setData] = useState<CNDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await api.get('/kpi/national/');
        setData(res.data);
      } catch (e) {
        console.error('Erreur KPIs CN', e);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, []);

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (!data) return <p className="text-center mt-10">Pas de données disponibles</p>;

  const sexData = [
    { name: 'Filles', value: Math.round(data.total_jeunes * data.filles_pct / 100) },
    { name: 'Garçons', value: Math.round(data.total_jeunes * data.garcons_pct / 100) },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard National ORA</h1>

      {/* Pôles et jeunes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Pôles totaux / actifs</p>
          <p className="text-2xl font-bold">{data.poles_total} / {data.poles_actifs}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Jeunes accompagnés</p>
          <p className="text-2xl font-bold">{data.total_jeunes}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Alertes rouges</p>
          <p className="text-2xl font-bold text-red-600">{data.alertes_rouges}</p>
        </div>
      </div>

      {/* Répartition filles/garçons */}
      <div className="p-4 bg-white rounded shadow">
        <h2 className="font-semibold mb-2">Répartition filles/garçons</h2>
        <PieChart width={200} height={200}>
          <Pie data={sexData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
            {sexData.map((entry, index) => (
              <cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>

      {/* Mentorats */}
      <div className="p-4 bg-white rounded shadow">
        <h2 className="font-semibold mb-2">Mentorats</h2>
        <BarChart width={500} height={300} data={[
          { name: 'Actifs', value: data.mentorats_actifs },
          { name: 'Clos', value: data.mentorats_closes },
          { name: 'Alertes rouges', value: data.alertes_rouges },
        ]}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#60a5fa" />
        </BarChart>
      </div>

      {/* Mentors par pôle */}
      <div className="p-4 bg-white rounded shadow">
        <h2 className="font-semibold mb-2">Mentors par pôle</h2>
        <ul>
          {data.mentors_par_pole.map((m) => (
            <li key={m.pole__name}>{m.pole__name}: {m.count}</li>
          ))}
        </ul>
      </div>

      {/* Mentors par association */}
      <div className="p-4 bg-white rounded shadow">
        <h2 className="font-semibold mb-2">Mentors par association</h2>
        <ul>
          {data.mentors_par_association?.map((m) => (
            <li key={m.association__name}>{m.association__name}: {m.count}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CNDashboard;
