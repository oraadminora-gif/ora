// src/pages/member/cn/CNPoles.tsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  MapPin,
  Users,
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  X,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Pole {
  id: number;
  code: string;
  name: string;
  status: string;
  villes: string[];
  etat_activite: string;
  etat_activite_label: string;
  contact_email?: string;
  contact_phone?: string;
  associations_count: number;
  animateurs_count: number;
  mentors_count: number;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const ETATS_ACTIVITE = [
  { value: '',            label: '— Non défini —' },
  { value: 'a_letude',   label: "À l'étude" },
  { value: 'demarre',    label: 'Démarre' },
  { value: 'fragile',    label: 'Fragile' },
  { value: 'experimente',label: 'Expérimenté' },
  { value: 'arrete',     label: 'Arrêté' },
];

const ETAT_BADGE: Record<string, string> = {
  a_letude:    'bg-sky-50 text-sky-700 border-sky-200',
  demarre:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  fragile:     'bg-amber-50 text-amber-700 border-amber-200',
  experimente: 'bg-violet-50 text-violet-700 border-violet-200',
  arrete:      'bg-red-50 text-red-700 border-red-200',
};

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export function CNPoles() {
  const [poles, setPoles] = useState<Pole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPole, setEditingPole] = useState<Pole | null>(null);

  useEffect(() => { fetchPoles(); }, []);

  const fetchPoles = async () => {
    try {
      const res = await api.get('/poles/');
      const data = res.data.results ?? res.data;
      setPoles(Array.isArray(data) ? data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pôle ?')) return;
    try {
      await api.delete(`/poles/${id}/`);
      fetchPoles();
    } catch {
    }
  };

  const filteredPoles = poles.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.villes ?? []).some(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: poles.length,
    active: poles.filter(p => p.status === 'ACTIVE').length,
    totalMentors: poles.reduce((sum, p) => sum + p.mentors_count, 0),
    totalAnimateurs: poles.reduce((sum, p) => sum + p.animateurs_count, 0),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Pôles</h1>
          <p className="text-slate-600">Gérer les pôles régionaux et leurs coordinateurs</p>
        </div>
        <button
          onClick={() => { setEditingPole(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-ora-blue text-white rounded-lg hover:bg-ora-dark"
        >
          <Plus className="w-4 h-4" />
          Nouveau pôle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<MapPin className="w-6 h-6" />} label="Total pôles" value={stats.total} />
        <StatCard icon={<MapPin className="w-6 h-6" />} label="Actifs" value={stats.active} color="green" />
        <StatCard icon={<UserCheck className="w-6 h-6" />} label="Mentors" value={stats.totalMentors} color="blue" />
        <StatCard icon={<Users className="w-6 h-6" />} label="Animateurs" value={stats.totalAnimateurs} color="purple" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher un pôle par nom, code ou ville..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-ora-blue focus:border-transparent"
        />
      </div>

      {/* Poles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPoles.map((pole) => (
          <PoleCard
            key={pole.id}
            pole={pole}
            onEdit={() => { setEditingPole(pole); setShowModal(true); }}
            onDelete={() => handleDelete(pole.id)}
          />
        ))}
      </div>

      {filteredPoles.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">Aucun pôle ne correspond à votre recherche</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PoleModal
          pole={editingPole}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchPoles(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = 'slate' }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}) {
  const colors: Record<string, string> = {
    slate:  'bg-slate-50 text-slate-700',
    green:  'bg-green-50 text-green-700',
    blue:   'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`${colors[color]} rounded-xl p-4 border border-${color}-200`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-white rounded-lg">{icon}</div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// POLE CARD
// ─────────────────────────────────────────────────────────────
function PoleCard({ pole, onEdit, onDelete }: {
  pole: Pole;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isActive = pole.status === 'ACTIVE';
  const villes = pole.villes ?? [];

  return (
    <div className={`bg-white rounded-xl border ${isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'} p-5 hover:shadow-lg transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 text-lg">{pole.name}</h3>
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{pole.code}</span>
          </div>
          {/* Etat activité */}
          {pole.etat_activite && (
            <span className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ETAT_BADGE[pole.etat_activite] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
              {pole.etat_activite_label || pole.etat_activite}
            </span>
          )}
          {/* Villes */}
          {villes.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500">{villes.join(', ')}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-2 text-slate-400 hover:text-ora-blue hover:bg-blue-50 rounded-lg">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 mb-4 text-sm">
        {pole.contact_email && (
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            {pole.contact_email}
          </div>
        )}
        {pole.contact_phone && (
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            {pole.contact_phone}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{pole.associations_count}</p>
          <p className="text-xs text-slate-500">Assos</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{pole.mentors_count}</p>
          <p className="text-xs text-slate-500">Mentors</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{pole.animateurs_count}</p>
          <p className="text-xs text-slate-500">Animateurs</p>
        </div>
      </div>

      {!isActive && (
        <div className="mt-4 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs text-center font-medium">
          Inactif
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// POLE MODAL
// ─────────────────────────────────────────────────────────────
function PoleModal({ pole, onClose, onSave }: {
  pole: Pole | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name:          pole?.name          || '',
    code:          pole?.code          || '',
    contact_email: pole?.contact_email || '',
    contact_phone: pole?.contact_phone || '',
    status:        pole?.status        || 'ACTIVE',
    etat_activite: pole?.etat_activite || '',
  });
  // Villes : liste mutable, max 5
  const [villes, setVilles] = useState<string[]>(
    pole?.villes?.length ? [...pole.villes] : ['']
  );
  const [error, setError] = useState('');

  const addVille = () => {
    if (villes.length < 5) setVilles([...villes, '']);
  };

  const removeVille = (idx: number) => {
    setVilles(villes.filter((_, i) => i !== idx));
  };

  const updateVille = (idx: number, value: string) => {
    const next = [...villes];
    next[idx] = value;
    setVilles(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...formData,
      villes: villes.map(v => v.trim()).filter(Boolean),
    };
    try {
      if (pole) {
        await api.patch(`/poles/${pole.id}/`, payload);
      } else {
        await api.post('/poles/', payload);
      }
      onSave();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const data = e.response?.data;
      if (data) {
        const msgs = Object.entries(data)
          .map(([field, val]) => `${field}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        setError(msgs);
      } else {
        setError('Erreur lors de la sauvegarde');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          {pole ? 'Modifier le pôle' : 'Nouveau pôle'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom + Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom du pôle</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue font-mono"
                required
                placeholder="Ex: IDF"
              />
            </div>
          </div>

          {/* Villes (max 5) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">
                Villes <span className="text-slate-400 font-normal">(max 5)</span>
              </label>
              {villes.length < 5 && (
                <button
                  type="button"
                  onClick={addVille}
                  className="text-xs text-ora-blue hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              )}
            </div>
            <div className="space-y-2">
              {villes.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={v}
                    onChange={(e) => updateVille(idx, e.target.value)}
                    placeholder={`Ville ${idx + 1}`}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-ora-blue"
                  />
                  {villes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVille(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Etat d'activité */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{"État d'activité"}</label>
            <select
              value={formData.etat_activite}
              onChange={(e) => setFormData({ ...formData, etat_activite: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue"
            >
              {ETATS_ACTIVITE.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email de contact</label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue"
              placeholder="optionnel"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone de contact</label>
            <input
              type="text"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue"
              placeholder="optionnel"
            />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue"
            >
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-ora-blue text-white rounded-lg hover:bg-ora-dark">
              {pole ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
