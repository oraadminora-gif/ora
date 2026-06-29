// src/components/mentor/MentorProfileCard.tsx
import { useState } from 'react';
import { Pencil, X, Loader2, CheckCircle, MapPin, Mail, Phone, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import type { MentorInfo, Department } from '../../pages/member/mentor/MentorDashboard';

interface ApiError { response?: { data?: { error?: string } } }
interface MentorProfileCardProps { mentor: MentorInfo; onUpdate: (updated: Partial<MentorInfo>) => void }
interface FormState { first_name: string; last_name: string; email: string; phone: string; city: string; code_postal: string; department_id: number | ''; observations: string }

export function MentorProfileCard({ mentor, onUpdate }: MentorProfileCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  const [form, setForm] = useState<FormState>({
    first_name: mentor.first_name, last_name: mentor.last_name,
    email: mentor.email, phone: mentor.phone, city: mentor.city,
    code_postal: mentor.code_postal ?? '',
    department_id: mentor.department?.id ?? '',
    observations: mentor.observations ?? '',
  });

  const openModal = async () => {
    setForm({ first_name: mentor.first_name, last_name: mentor.last_name, email: mentor.email, phone: mentor.phone, city: mentor.city, code_postal: mentor.code_postal ?? '', department_id: mentor.department?.id ?? '', observations: mentor.observations ?? '' });
    setError(null); setSuccess(false); setIsOpen(true);
    if (departments.length === 0) {
      setLoadingDepts(true);
      try { const res = await api.get<Department[]>('/mentor/departments/'); setDepartments(res.data); }
      catch { /* silently fail */ } finally { setLoadingDepts(false); }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'department_id' ? (value === '' ? '' : parseInt(value, 10)) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      const res = await api.patch<Partial<MentorInfo>>('/mentor/update-profile/', form);
      onUpdate(res.data); setSuccess(true); setTimeout(() => setIsOpen(false), 1000);
    } catch (err) { setError((err as ApiError).response?.data?.error ?? 'Erreur'); }
    finally { setSaving(false); }
  };

  const deptLabel = mentor.department ? `${mentor.department.code} – ${mentor.department.name}` : '—';
  const initials = `${mentor.first_name.charAt(0)}${mentor.last_name.charAt(0)}`.toUpperCase();

  const infoRows = [
    { icon: Mail,     label: 'Email',        value: mentor.email || '—' },
    { icon: Phone,    label: 'Téléphone',    value: mentor.phone || '—' },
    { icon: MapPin,   label: 'Ville',        value: mentor.city || '—' },
    { icon: MapPin,   label: 'Code postal',  value: mentor.code_postal || '—' },
    { icon: MapPin,   label: 'Département',  value: deptLabel },
    { icon: Building2,label: 'Pôle',         value: mentor.pole ?? '—' },
    { icon: Building2,label: 'Association',  value: mentor.association ?? '—' },
    ...(mentor.observations ? [{ icon: Building2, label: 'Particularité', value: mentor.observations }] : []),
  ];

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
        {/* Header card */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-ora-blue/5 to-transparent border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-ora-blue flex items-center justify-center shadow-lg shadow-ora-blue/20 shrink-0">
                <span className="text-white font-bold text-lg tracking-wide">{initials}</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {mentor.first_name} {mentor.last_name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {mentor.is_trained && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-2.5 h-2.5" /> Formé
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Mentor</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={openModal}
                className="p-2 rounded-xl hover:bg-ora-blue/10 text-slate-400 hover:text-ora-blue transition-all"
                title="Modifier le profil"
              >
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

        {/* Infos + CTA — collapsibles */}
        {!isCollapsed && (
          <>
            <div className="px-6 py-4 space-y-1">
              {infoRows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 group">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 text-right max-w-[55%] truncate">{value}</span>
                </div>
              ))}
            </div>

            <div className="px-6 pb-5">
              <button onClick={openModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 hover:bg-ora-blue/8 border border-slate-100 hover:border-ora-blue/20 text-slate-600 hover:text-ora-blue text-sm font-medium transition-all duration-150"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier mes informations
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Modifier mon profil</h3>
                <p className="text-xs text-slate-400 mt-0.5">Informations personnelles et localisation</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'first_name', label: 'Prénom', type: 'text', value: form.first_name, required: true },
                  { name: 'last_name',  label: 'Nom',    type: 'text', value: form.last_name,  required: true },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                    <input type={f.type} name={f.name} value={f.value} onChange={handleChange} required={f.required}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue transition-all"
                    />
                  </div>
                ))}
              </div>

              {[
                { name: 'email',       label: 'Email',        type: 'email', value: form.email,       placeholder: '' },
                { name: 'phone',       label: 'Téléphone',    type: 'tel',   value: form.phone,       placeholder: '06 XX XX XX XX' },
                { name: 'city',        label: 'Ville',        type: 'text',  value: form.city,        placeholder: 'Paris, Lyon...' },
                { name: 'code_postal', label: 'Code postal',  type: 'text',  value: form.code_postal, placeholder: '75001' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                  <input type={f.type} name={f.name} value={f.value} onChange={handleChange} placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue transition-all"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Particularité pour l'affectation</label>
                <textarea name="observations" value={form.observations}
                  onChange={e => setForm(prev => ({ ...prev, observations: e.target.value }))}
                  rows={3} placeholder="Contraintes géographiques, disponibilités particulières…"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Département</label>
                {loadingDepts ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                  </div>
                ) : (
                  <select name="department_id" value={form.department_id} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue bg-white transition-all"
                  >
                    <option value="">— Sélectionner —</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code} – {d.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
              {success && (
                <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" /> Profil mis à jour avec succès
                </p>
              )}

              <div className="flex gap-3 pt-1">
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
