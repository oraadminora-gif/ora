// src/components/mentor/MentorAvailabilityCard.tsx
import { useState } from 'react';
import { Clock, Pencil, X, Loader2, CheckCircle, Users, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import type { MentorInfo } from '../../pages/member/mentor/MentorDashboard';

interface ApiError { response?: { data?: { error?: string } } }
interface Props { capacite: MentorInfo['capacite']; onUpdate: (c: MentorInfo['capacite']) => void }

export function MentorAvailabilityCard({ capacite, onUpdate }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxCapacity, setMaxCapacity] = useState(capacite.max);

  const openModal = () => { setMaxCapacity(capacite.max); setError(null); setSuccess(false); setIsOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      const res = await api.patch<MentorInfo['capacite']>('/mentor/update-capacite/', { max_capacity: maxCapacity });
      onUpdate(res.data); setSuccess(true); setTimeout(() => setIsOpen(false), 1000);
    } catch (err) { setError((err as ApiError).response?.data?.error ?? 'Erreur'); }
    finally { setSaving(false); }
  };

  const { disponible, utilisee, max } = capacite;
  const taux = max > 0 ? Math.round((utilisee / max) * 100) : 0;

  // Config visuelle selon disponibilité
  const dispoConfig =
    disponible === 0 ? { label: 'Complet',            pulse: 'animate-pulse', color: 'text-red-500',   bg: 'bg-red-50',   ring: 'ring-red-200',   bar: 'bg-red-500',   badge: 'bg-red-100 text-red-600' } :
    disponible === 1 ? { label: '1 place libre',       pulse: 'animate-pulse', color: 'text-blue-500',  bg: 'bg-blue-50',  ring: 'ring-blue-200',  bar: 'bg-ora-blue',  badge: 'bg-blue-100 text-blue-600' } :
                       { label: `${disponible} places`, pulse: '',             color: 'text-emerald-500',bg: 'bg-emerald-50',ring: 'ring-emerald-200',bar: 'bg-emerald-500',badge: 'bg-emerald-100 text-emerald-700' };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-slate-50 to-transparent border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-ora-blue/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-ora-blue" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Disponibilités</h3>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${dispoConfig.badge} ring-1 ${dispoConfig.ring}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dispoConfig.color.replace('text-', 'bg-')} ${dispoConfig.pulse}`} />
                {dispoConfig.label}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={openModal} className="p-2 rounded-xl hover:bg-ora-blue/10 text-slate-400 hover:text-ora-blue transition-all" title="Modifier">
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCollapsed(v => !v)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                title={isCollapsed ? 'Développer' : 'Réduire'}
              >
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Stats + CTA — collapsibles */}
        {!isCollapsed && (
          <>
            <div className="px-6 py-5">
              {/* Jauge */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Taux d'occupation</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{taux}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${dispoConfig.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${taux}%` }}
                  />
                </div>
              </div>

              {/* 3 stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Capacité', value: max,        sub: 'maximum', color: 'text-slate-800' },
                  { label: 'En cours', value: utilisee,   sub: 'actifs',  color: 'text-ora-blue'  },
                  { label: 'Libre',    value: disponible, sub: 'dispo',   color: dispoConfig.color },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="text-center py-3 px-2 rounded-xl bg-slate-50 border border-slate-100">
                    <p className={`text-2xl font-black ${color} ${value === disponible ? dispoConfig.pulse : ''}`}>{value}</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 pb-5">
              <button onClick={openModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-ora-blue hover:bg-ora-dark text-white text-sm font-semibold transition-all shadow-sm shadow-ora-blue/20"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier ma capacité
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-ora-blue" /> Modifier ma capacité
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">La disponibilité est calculée automatiquement</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Aperçu live */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center py-3 bg-ora-blue/5 border border-ora-blue/10 rounded-xl">
                  <p className="text-xl font-black text-ora-blue">{utilisee}</p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">actifs</p>
                </div>
                <div className={`text-center py-3 rounded-xl border ${dispoConfig.bg} ${dispoConfig.ring} ring-1`}>
                  <p className={`text-xl font-black ${dispoConfig.color} ${dispoConfig.pulse}`}>
                    {Math.max(0, maxCapacity - utilisee)}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">après modif</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Capacité maximale <span className="text-slate-400 font-normal">(jeunes simultanés)</span>
                </label>
                <input
                  type="number" value={maxCapacity}
                  onChange={(e) => setMaxCapacity(parseInt(e.target.value, 10) || 1)}
                  min={Math.max(1, utilisee)} max={10} required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue transition-all text-center text-lg font-bold"
                />
                {utilisee > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center">Minimum : {utilisee} (mentorats actifs)</p>
                )}
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
              {success && (
                <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" /> Capacité mise à jour !
                </p>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-ora-blue hover:bg-ora-dark text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-ora-blue/20">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
