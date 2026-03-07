// src/pages/member/cn/CNMentors.tsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Search,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Users,
  UserCheck,
  GraduationCap,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface Association {
  id: number;
  code: string;
  name: string;
}

interface Mentor {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  city?: string;
  pole_name?: string;
  association?: Association;
  is_active: boolean;
  is_trained: boolean;
  disponibilite_reelle: number;
  max_capacity: number;
}

type FilterType = 'all' | 'actifs' | 'inactifs';

export function CNMentors() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const res = await api.get('/mentors/');
      // Handle DRF paginated response
      const data = res.data.results ?? res.data;
      setMentors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (mentor: Mentor) => {
    setTogglingId(mentor.id);
    try {
      await api.patch(`/mentors/${mentor.id}/`, { is_active: !mentor.is_active });
      setMentors(prev =>
        prev.map(m => m.id === mentor.id ? { ...m, is_active: !m.is_active } : m)
      );
    } catch (error) {
      console.error('Error toggling mentor status:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredMentors = mentors
    .filter(m => {
      if (filter === 'actifs') return m.is_active;
      if (filter === 'inactifs') return !m.is_active;
      return true;
    })
    .filter(m =>
      (m.first_name + ' ' + m.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.city ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.pole_name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  const stats = {
    total: mentors.length,
    actifs: mentors.filter(m => m.is_active).length,
    formes: mentors.filter(m => m.is_trained).length,
    disponibles: mentors.filter(m => m.disponibilite_reelle > 0 && m.is_active).length,
  };

  const FILTER_LABELS: Record<FilterType, string> = {
    all: 'Tous',
    actifs: 'Actifs',
    inactifs: 'Inactifs',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ora-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestion des Mentors</h1>
        <p className="text-slate-600">Consulter et gérer les mentors de l'organisation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total" value={stats.total} color="blue" />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Actifs" value={stats.actifs} color="green" />
        <StatCard icon={<GraduationCap className="w-5 h-5" />} label="Formés" value={stats.formes} color="purple" />
        <StatCard icon={<UserCheck className="w-5 h-5" />} label="Disponibles" value={stats.disponibles} color="orange" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, ville ou pôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'actifs', 'inactifs'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-ora-blue text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Mentors Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mentor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pôle / Association</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Capacité</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Formé</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Actif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredMentors.map((mentor) => (
              <MentorRow
                key={mentor.id}
                mentor={mentor}
                toggling={togglingId === mentor.id}
                onToggle={() => handleToggleActive(mentor)}
              />
            ))}
          </tbody>
        </table>

        {filteredMentors.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Aucun mentor ne correspond à vos critères
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  };
  return (
    <div className={`${colors[color]} rounded-xl p-4 border text-center`}>
      <div className="flex items-center justify-center gap-2 mb-1">
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}

function MentorRow({ mentor, toggling, onToggle }: {
  mentor: Mentor;
  toggling: boolean;
  onToggle: () => void;
}) {
  const occupied = mentor.max_capacity - mentor.disponibilite_reelle;
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${mentor.is_active ? 'bg-ora-blue' : 'bg-slate-400'}`}>
            {mentor.first_name.charAt(0)}{mentor.last_name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900">{mentor.first_name} {mentor.last_name}</p>
            {mentor.city && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />
                {mentor.city}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            {mentor.email}
          </div>
          {mentor.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              {mentor.phone}
            </div>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="text-sm">
          {mentor.pole_name && (
            <p className="font-medium text-slate-800">{mentor.pole_name}</p>
          )}
          {mentor.association && (
            <p className="text-slate-500">{mentor.association.name}</p>
          )}
        </div>
      </td>

      <td className="px-6 py-4 text-center">
        <div className="flex flex-col items-center">
          <span className="font-medium text-slate-900">{occupied}/{mentor.max_capacity}</span>
          <span className="text-xs text-slate-500">{mentor.disponibilite_reelle} dispo</span>
        </div>
      </td>

      <td className="px-6 py-4 text-center">
        {mentor.is_trained ? (
          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
        ) : (
          <XCircle className="w-5 h-5 text-slate-300 mx-auto" />
        )}
      </td>

      <td className="px-6 py-4 text-center">
        <button
          onClick={onToggle}
          disabled={toggling}
          className="flex items-center gap-1 mx-auto text-sm font-medium transition-colors disabled:opacity-50"
          title={mentor.is_active ? 'Désactiver' : 'Activer'}
        >
          {mentor.is_active ? (
            <ToggleRight className="w-7 h-7 text-green-500" />
          ) : (
            <ToggleLeft className="w-7 h-7 text-slate-400" />
          )}
        </button>
      </td>
    </tr>
  );
}
