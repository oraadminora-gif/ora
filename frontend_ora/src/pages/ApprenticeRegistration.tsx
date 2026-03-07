import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface PoleOption { id: number; name: string; code: string; }

const DIPLOME_OPTIONS = [
  { group: 'Niveau 3', options: [
    { value: 'CAP', label: 'CAP' },
    { value: 'BEP', label: 'BEP' },
  ]},
  { group: 'Niveau 4', options: [
    { value: 'BAC_PRO',   label: 'Bac Professionnel' },
    { value: 'BAC_AUTRE', label: 'Bac (autre)' },
    { value: 'BP',        label: 'Brevet Professionnel (BP)' },
  ]},
  { group: 'Niveau 5', options: [
    { value: 'BTS', label: 'BTS' },
    { value: 'DUT', label: 'DUT' },
  ]},
  { group: 'Niveau 6', options: [
    { value: 'LIC_PRO', label: 'Licence Professionnelle' },
    { value: 'BUT',     label: 'BUT' },
  ]},
  { group: 'Niveau 7', options: [
    { value: 'MASTER', label: 'Master' },
    { value: 'DEA',    label: 'DEA' },
    { value: 'DES',    label: "Diplôme d'études spécialisées" },
    { value: 'ING',    label: 'Ingénieur' },
  ]},
];

const NEEDS_OPTIONS = [
  { value: 'orientation',          label: 'Orientation professionnelle' },
  { value: 'confidence',           label: 'Confiance en soi' },
  { value: 'organization',         label: 'Organisation et méthode de travail' },
  { value: 'school_difficulties',  label: 'Difficultés scolaires' },
  { value: 'company_difficulties', label: 'Difficultés en entreprise' },
  { value: 'daily_life',           label: 'Gestion de la vie quotidienne' },
  { value: 'company_change',       label: "Changement d'entreprise" },
  { value: 'other',                label: 'Autre' },
];

export function ApprenticeRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const [poles, setPoles]         = useState<PoleOption[]>([]);

  useEffect(() => {
    api.get<PoleOption[]>('/public/poles/').then(r => setPoles(r.data)).catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    firstName:        '',
    lastName:         '',
    email:            '',
    phone:            '',
    birthDate:        '',
    gender:           '',
    poleId:           '',
    city:             '',
    departmentCode:   '',
    nomEtablissement: '',
    diplomePrepare:   '',
    situation:        '' as '' | 'apprentissage' | 'recherche',
    needs:            [] as string[],
    otherNeeds:       '',
    consentGiven:     false,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.consentGiven) {
      setError('Vous devez accepter la politique de confidentialité');
      setLoading(false);
      return;
    }

    const needsText = formData.needs
      .map(n => {
        if (n === 'other') return formData.otherNeeds || 'Autre';
        return NEEDS_OPTIONS.find(o => o.value === n)?.label ?? n;
      })
      .join(', ');

    try {
      const response = await api.post('/public/demande/', {
        first_name:        formData.firstName,
        last_name:         formData.lastName,
        email:             formData.email,
        phone:             formData.phone,
        birth_date:        formData.birthDate || undefined,
        gender:            formData.gender || undefined,
        pole_id:           formData.poleId ? Number(formData.poleId) : undefined,
        city:              formData.city,
        department_code:   formData.departmentCode || undefined,
        nom_etablissement: formData.nomEtablissement,
        diplome_prepare:   formData.diplomePrepare || undefined,
        situation:         formData.situation || undefined,
        needs_description: needsText || 'Non précisé',
        urgency_level:     1,
      });

      if (response.data && typeof response.data === 'object' && 'error' in response.data) {
        setError(response.data.error);
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/'), 3000);
      }
    } catch (err) {
      let msg = "Une erreur est survenue lors de l'envoi. Veuillez réessayer.";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.error || err.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleNeed = (need: string) => {
    setFormData(prev => ({
      ...prev,
      needs: prev.needs.includes(need)
        ? prev.needs.filter(n => n !== need)
        : [...prev.needs, need],
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Inscription réussie !</h2>
          <p className="text-slate-600 mb-6">
            Merci pour ton inscription. Nous allons étudier ta demande et te recontacter très
            prochainement pour te mettre en relation avec un mentor adapté à tes besoins.
          </p>
          <p className="text-sm text-slate-500">Redirection vers l'accueil…</p>
        </div>
      </div>
    );
  }

  const inputCls = 'w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent';

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Inscription apprenti(e)</h1>
          <p className="text-slate-600 mb-8">
            Remplis ce formulaire pour être mis(e) en relation avec un mentor
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Prénom / Nom */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Prénom *</label>
                <input type="text" required value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom *</label>
                <input type="text" required value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  className={inputCls} />
              </div>
            </div>

            {/* Email / Téléphone */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                <input type="email" required value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                <input type="tel" value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className={inputCls} />
              </div>
            </div>

            {/* Date de naissance / Genre */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date de naissance</label>
                <input type="date" value={formData.birthDate}
                  onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Genre</label>
                <select value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className={inputCls}>
                  <option value="">Non précisé</option>
                  <option value="M">Garçon</option>
                  <option value="F">Fille</option>
                  <option value="O">Autre</option>
                </select>
              </div>
            </div>

            {/* Pôle */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Pôle ORA de rattachement *
              </label>
              <select
                required
                value={formData.poleId}
                onChange={e => setFormData({ ...formData, poleId: e.target.value })}
                className={inputCls}
              >
                <option value="">— Sélectionne ton pôle —</option>
                {poles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Diplôme préparé */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Diplôme préparé
              </label>
              <select value={formData.diplomePrepare}
                onChange={e => setFormData({ ...formData, diplomePrepare: e.target.value })}
                className={inputCls}>
                <option value="">Sélectionne ton diplôme</option>
                {DIPLOME_OPTIONS.map(grp => (
                  <optgroup key={grp.group} label={grp.group}>
                    {grp.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Situation */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Ta situation actuelle *
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                {([
                  { value: 'apprentissage', label: 'Déjà en apprentissage' },
                  { value: 'recherche',     label: "En recherche d'apprentissage" },
                ] as const).map(sit => (
                  <label key={sit.value}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.situation === sit.value
                        ? 'border-ora-blue bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <input type="radio" name="situation" value={sit.value}
                      checked={formData.situation === sit.value}
                      onChange={() => setFormData({ ...formData, situation: sit.value })}
                      className="w-4 h-4 text-ora-blue" />
                    <span className="text-slate-700 font-medium">{sit.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ville / Département */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ville *</label>
                <input type="text" required value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Département (code)
                </label>
                <input type="text" placeholder="Ex : 75, 69, 13…" value={formData.departmentCode}
                  onChange={e => setFormData({ ...formData, departmentCode: e.target.value })}
                  className={inputCls} />
              </div>
            </div>

            {/* Nom établissement */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom de ton école / CFA
              </label>
              <input type="text" placeholder="Ex : CFA des Métiers, Lycée Professionnel…"
                value={formData.nomEtablissement}
                onChange={e => setFormData({ ...formData, nomEtablissement: e.target.value })}
                className={inputCls} />
            </div>

            {/* Besoins */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Sur quoi souhaites-tu être accompagné(e) ? *
              </label>
              <div className="space-y-2">
                {NEEDS_OPTIONS.map(need => (
                  <label key={need.value}
                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={formData.needs.includes(need.value)}
                      onChange={() => toggleNeed(need.value)}
                      className="w-4 h-4 text-ora-blue rounded focus:ring-2 focus:ring-ora-blue" />
                    <span className="text-slate-700">{need.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.needs.includes('other') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Précise tes autres besoins
                </label>
                <textarea rows={3} value={formData.otherNeeds}
                  onChange={e => setFormData({ ...formData, otherNeeds: e.target.value })}
                  className={inputCls} />
              </div>
            )}

            {/* Consentement */}
            <div className="bg-slate-50 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required checked={formData.consentGiven}
                  onChange={e => setFormData({ ...formData, consentGiven: e.target.checked })}
                  className="w-4 h-4 text-ora-blue rounded focus:ring-2 focus:ring-ora-blue mt-1" />
                <span className="text-sm text-slate-600">
                  J'accepte que mes données personnelles soient utilisées pour me mettre en
                  relation avec un mentor. Mes données resteront confidentielles et ne seront
                  pas partagées avec des tiers. *
                </span>
              </label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-ora-blue text-white rounded-lg font-semibold hover:bg-ora-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Envoi en cours…' : 'Envoyer ma demande'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
