// src/components/acp/ACPDemandesPanel.tsx
import { useState, useEffect } from 'react';
import {
  ClipboardList, MapPin, Flame, GraduationCap, ArrowRightLeft,
  School, X, CheckCircle, MessageSquare, Plus, Loader2,
} from 'lucide-react';
import api from '../../services/api';
import type { ACPDemande } from '../../pages/member/acp/ACPDashboard.types';

interface Props {
  /** Passer les demandes via prop (ACP) OU laisser vide pour auto-fetch (AP) */
  demandes?: ACPDemande[];
  poleId: number;
  onRefresh?: () => void;
}

interface PoleOption { id: number; name: string; code: string }
interface EtabOption  { id: number; nom: string; code_postal: string }
interface DeptOption  { id: number; code: string; name: string; label: string }

// ── Urgency badge ────────────────────────────────────────────────────────────
const URGENCY: Record<number, { label: string; cls: string }> = {
  5: { label: 'Très urgent', cls: 'text-red-700 bg-red-100 border-red-200'         },
  4: { label: 'Urgent',      cls: 'text-orange-700 bg-orange-100 border-orange-200' },
  3: { label: 'Modéré',      cls: 'text-amber-700 bg-amber-100 border-amber-200'    },
  2: { label: 'Faible',      cls: 'text-slate-600 bg-slate-100 border-slate-200'   },
  1: { label: 'Très faible', cls: 'text-slate-500 bg-slate-50 border-slate-100'    },
};

function UrgencyBadge({ level }: { level: number }) {
  const c = URGENCY[level] ?? URGENCY[1];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.cls}`}>
      <Flame className="w-2.5 h-2.5" />{c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: ACPDemande['status'] }) {
  return status === 'NEW' ? (
    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
      Nouveau
    </span>
  ) : (
    <span className="text-[9px] font-bold text-sky-600 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
      En attente
    </span>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const DIPLOME_OPTIONS = [
  { group: 'Niveau 3', options: [{ value: 'CAP', label: 'CAP' }, { value: 'BEP', label: 'BEP' }] },
  { group: 'Niveau 4', options: [{ value: 'BAC_PRO', label: 'Bac Professionnel' }, { value: 'BAC_AUTRE', label: 'Bac (autre)' }, { value: 'BP', label: 'Brevet Professionnel (BP)' }] },
  { group: 'Niveau 5', options: [{ value: 'BTS', label: 'BTS' }, { value: 'DUT', label: 'DUT' }] },
  { group: 'Niveau 6', options: [{ value: 'LIC_PRO', label: 'Licence Professionnelle' }, { value: 'BUT', label: 'BUT' }] },
  { group: 'Niveau 7', options: [{ value: 'MASTER', label: 'Master' }, { value: 'DEA', label: 'DEA' }, { value: 'DES', label: "Diplôme d'études spécialisées" }, { value: 'ING', label: 'Ingénieur' }] },
];


// ── Nouvelle Demande Modal ────────────────────────────────────────────────────
function NouvelleDemandeModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    birth_date: '', gender: '',
    commune: '', code_postal: '',
    diplome_prepare: '', situation: '', nom_etablissement: '',
    demande: '',
    urgency_level: '1',
  });

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const submit = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Prénom et Nom sont obligatoires.'); return;
    }
    if (!form.commune.trim() || !form.code_postal.trim()) {
      setError('Commune et code postal sont obligatoires.'); return;
    }
    if (!form.situation) {
      setError('Veuillez indiquer la situation du jeune.'); return;
    }
    if (!form.demande.trim()) {
      setError('Veuillez décrire la demande du jeune.'); return;
    }
    setLoading(true); setError('');
    try {
      await api.post('/pole/requests/', {
        first_name:        form.first_name,
        last_name:         form.last_name,
        email:             form.email,
        phone:             form.phone,
        birth_date:        form.birth_date || undefined,
        gender:            form.gender || undefined,
        commune:           form.commune,
        code_postal:       form.code_postal,
        diplome_prepare:   form.diplome_prepare || undefined,
        situation:         form.situation,
        nom_etablissement: form.situation === 'apprentissage' ? form.nom_etablissement : '',
        needs_description: form.demande.trim(),
        urgency_level:     Number(form.urgency_level),
      });
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error ?? 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none bg-slate-50';
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';
  const sectionCls = 'text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-1.5 border-b border-slate-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-600" />
            Nouvelle demande
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {/* ── Identité ────────────────────────────────────── */}
          <section>
            <p className={sectionCls}>Identité</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Prénom <span className="text-red-500">*</span></label>
                <input type="text" value={form.first_name} onChange={set('first_name')} className={inputCls} placeholder="Prénom" />
              </div>
              <div>
                <label className={labelCls}>Nom <span className="text-red-500">*</span></label>
                <input type="text" value={form.last_name} onChange={set('last_name')} className={inputCls} placeholder="Nom de famille" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="email@exemple.fr" />
              </div>
              <div>
                <label className={labelCls}>Téléphone</label>
                <input type="tel" value={form.phone} onChange={set('phone')} className={inputCls} placeholder="06 xx xx xx xx" />
              </div>
              <div>
                <label className={labelCls}>Date de naissance</label>
                <input type="date" value={form.birth_date} onChange={set('birth_date')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Genre</label>
                <select value={form.gender} onChange={set('gender')} className={inputCls}>
                  <option value="">— Non précisé —</option>
                  <option value="M">Garçon</option>
                  <option value="F">Fille</option>
                  <option value="O">Autre</option>
                </select>
              </div>
            </div>
          </section>

          {/* ── Localisation ─────────────────────────────────── */}
          <section>
            <p className={sectionCls}>Localisation</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Code postal <span className="text-red-500">*</span></label>
                <input type="text" maxLength={5} value={form.code_postal} onChange={set('code_postal')} className={inputCls} placeholder="Ex : 69001" />
              </div>
              <div>
                <label className={labelCls}>Commune <span className="text-red-500">*</span></label>
                <input type="text" value={form.commune} onChange={set('commune')} className={inputCls} placeholder="Ex : Lyon" />
              </div>
            </div>
          </section>

          {/* ── Scolarité ────────────────────────────────────── */}
          <section>
            <p className={sectionCls}>Scolarité</p>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Diplôme préparé</label>
                <select value={form.diplome_prepare} onChange={set('diplome_prepare')} className={inputCls}>
                  <option value="">— Choisir —</option>
                  {DIPLOME_OPTIONS.map(g => (
                    <optgroup key={g.group} label={g.group}>
                      {g.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Situation <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {([
                    { value: 'apprentissage', label: 'Déjà en apprentissage' },
                    { value: 'recherche',     label: "En recherche d'apprentissage" },
                  ]).map(opt => (
                    <label key={opt.value} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      form.situation === opt.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}>
                      <input type="radio" name="situation" value={opt.value}
                        checked={form.situation === opt.value} onChange={set('situation')}
                        className="accent-violet-600" />
                      <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {form.situation === 'apprentissage' && (
                <div>
                  <label className={labelCls}>Établissement / CFA</label>
                  <input type="text" value={form.nom_etablissement} onChange={set('nom_etablissement')}
                    className={inputCls} placeholder="Nom de l'école ou du CFA" />
                </div>
              )}
            </div>
          </section>

          {/* ── Demande ──────────────────────────────────────── */}
          <section>
            <p className={sectionCls}>Demande <span className="text-red-500">*</span></p>
            <label className={labelCls}>Décris ce sur quoi le jeune souhaite être accompagné(e)</label>
            <textarea rows={4} value={form.demande} onChange={set('demande')}
              placeholder="Ex : difficultés avec l'employeur, organisation entre CFA et entreprise, recherche d'une nouvelle entreprise…"
              className={`${inputCls} resize-none`} />
          </section>

          {/* ── Urgence ──────────────────────────────────────── */}
          <section>
            <p className={sectionCls}>Urgence</p>
            <div className="w-1/2">
              <select value={form.urgency_level} onChange={set('urgency_level')} className={inputCls}>
                <option value="1">1 — Très faible</option>
                <option value="2">2 — Faible</option>
                <option value="3">3 — Modéré</option>
                <option value="4">4 — Urgent</option>
                <option value="5">5 — Très urgent</option>
              </select>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium">
            Annuler
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Création…</>
              : <><Plus className="w-4 h-4" />Créer la demande</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Rerouter Modal ────────────────────────────────────────────────────────────
function RerouterModal({ demande, currentPoleId, onClose, onSuccess }: {
  demande: ACPDemande;
  currentPoleId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [poles, setPoles]     = useState<PoleOption[]>([]);
  const [poleId, setPoleId]   = useState('');
  const [raison, setRaison]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/poles/').then(r => {
      const list: PoleOption[] = r.data.results ?? r.data;
      setPoles(list.filter((p: PoleOption) => p.id !== currentPoleId));
    });
  }, [currentPoleId]);

  const submit = async () => {
    if (!poleId) { setError('Veuillez sélectionner un pôle'); return; }
    setLoading(true); setError('');
    try {
      await api.post(`/pole/requests/${demande.id}/rerouter/`, { pole_id: Number(poleId), raison });
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error ?? 'Erreur lors du transfert');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-violet-600" />
            Transférer la demande
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          <span className="font-semibold text-slate-700">{demande.nom}</span> sera transférée vers le pôle sélectionné.
        </p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Pôle de destination *</label>
            <select value={poleId} onChange={e => setPoleId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500">
              <option value="">— Choisir un pôle —</option>
              {poles.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Raison (optionnel)</label>
            <textarea rows={2} value={raison} onChange={e => setRaison(e.target.value)}
              placeholder="Manque de mentors disponibles…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Annuler
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50">
            {loading ? 'Transfert…' : 'Transférer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Etablissement Modal ───────────────────────────────────────────────────────
function EtablissementModal({ demande, onClose, onSuccess }: {
  demande: ACPDemande;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [etabs, setEtabs]         = useState<EtabOption[]>([]);
  const [etabId, setEtabId]       = useState('');
  const [nomManuel, setNomManuel] = useState(demande.nom_etablissement ?? '');
  const [useManuel, setUseManuel] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    api.get('/pole/etablissements/').then(r => setEtabs(r.data.etablissements ?? []));
  }, []);

  const submit = async () => {
    setLoading(true); setError('');
    try {
      if (useManuel) {
        if (!nomManuel.trim()) { setError('Veuillez saisir un nom'); setLoading(false); return; }
        await api.patch(`/pole/requests/${demande.id}/etablissement/`, { nom_manuel: nomManuel.trim() });
      } else {
        if (!etabId) { setError('Veuillez choisir un établissement'); setLoading(false); return; }
        await api.patch(`/pole/requests/${demande.id}/etablissement/`, { etablissement_id: Number(etabId) });
      }
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error ?? 'Erreur lors de la mise à jour');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <School className="w-4 h-4 text-violet-600" />
            Modifier l'établissement
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-1">
          Demande de <span className="font-semibold text-slate-700">{demande.nom}</span>
        </p>
        {demande.nom_etablissement && (
          <p className="text-xs text-slate-400 mb-4">Saisi par le jeune : {demande.nom_etablissement}</p>
        )}

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="space-y-3">
          {!useManuel ? (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Sélectionner un établissement du pôle
              </label>
              <select value={etabId} onChange={e => {
                const v = e.target.value;
                if (v === '__autre__') { setUseManuel(true); setEtabId(''); }
                else setEtabId(v);
              }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500">
                <option value="">— Choisir —</option>
                {etabs.map(e => (
                  <option key={e.id} value={e.id}>{e.nom} ({e.code_postal})</option>
                ))}
                <option value="__autre__">Autre (saisie libre)</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nom de l'établissement
              </label>
              <input type="text" value={nomManuel} onChange={e => setNomManuel(e.target.value)}
                placeholder="Nom exact de l'école / CFA"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500" />
              <button onClick={() => setUseManuel(false)}
                className="text-xs text-violet-600 mt-1 hover:underline">
                ← Revenir à la liste
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Annuler
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50">
            {loading ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Demand list ───────────────────────────────────────────────────────────────
function DemandesList({
  demandes, poleId, onRefresh,
}: {
  demandes: ACPDemande[];
  poleId: number;
  onRefresh: () => void;
}) {
  const [rerouterTarget, setRerouterTarget]           = useState<ACPDemande | null>(null);
  const [etablissementTarget, setEtablissementTarget] = useState<ACPDemande | null>(null);
  const [flashId, setFlashId]                         = useState<number | null>(null);

  const handleSuccess = (id: number) => {
    setRerouterTarget(null);
    setEtablissementTarget(null);
    setFlashId(id);
    setTimeout(() => { setFlashId(null); onRefresh(); }, 1200);
  };

  if (demandes.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-center px-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-slate-400">Aucune demande en attente</p>
        <p className="text-xs text-slate-300">Toutes les demandes ont été traitées</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
        {demandes.map(d => (
          <div key={d.id}
            className={`px-4 py-3.5 transition-colors ${flashId === d.id ? 'bg-emerald-50' : 'hover:bg-slate-50/60'}`}>

            {flashId === d.id && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mb-2">
                <CheckCircle className="w-3.5 h-3.5" /> Mis à jour
              </div>
            )}

            {/* Nom + statut */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-sm font-bold text-slate-900 truncate">{d.nom}</p>
              <StatusBadge status={d.status} />
            </div>

            {/* Urgence + ville */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <UrgencyBadge level={d.urgency_level} />
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="w-3 h-3" />{d.city}
              </div>
            </div>

            {/* Diplôme + Situation */}
            {(d.diplome_label || d.situation_label) && (
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                {d.diplome_label && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full font-medium">
                    <GraduationCap className="w-2.5 h-2.5" />{d.diplome_label}
                  </span>
                )}
                {d.situation_label && (
                  <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-full">
                    {d.situation_label}
                  </span>
                )}
              </div>
            )}

            {/* Établissement */}
            {d.nom_etablissement && (
              <div className="flex items-center gap-1 mb-1.5 text-[11px] text-slate-400">
                <School className="w-3 h-3 shrink-0" />
                <span className="truncate">{d.nom_etablissement}</span>
              </div>
            )}

            {/* Raison de transfert */}
            {d.raison_transfert && (
              <div className="flex items-start gap-1.5 mb-1.5 px-2.5 py-1.5 bg-violet-50 border border-violet-100 rounded-lg">
                <MessageSquare className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-violet-700 leading-snug">
                  <span className="font-semibold">Transférée :</span> {d.raison_transfert}
                </p>
              </div>
            )}

            {/* Description */}
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {d.needs_description}
            </p>

            {/* Date */}
            <p className="text-[10px] text-slate-300 mt-1">
              {new Date(d.request_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            {/* Actions */}
            <div className="flex gap-2 mt-2.5">
              <button onClick={() => setEtablissementTarget(d)}
                className="flex-1 py-1.5 text-[11px] font-semibold text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors flex items-center justify-center gap-1">
                <School className="w-3 h-3" />Établissement
              </button>
              <button onClick={() => setRerouterTarget(d)}
                className="flex-1 py-1.5 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
                <ArrowRightLeft className="w-3 h-3" />Transférer
              </button>
            </div>
          </div>
        ))}
      </div>

      {rerouterTarget && (
        <RerouterModal
          demande={rerouterTarget}
          currentPoleId={poleId}
          onClose={() => setRerouterTarget(null)}
          onSuccess={() => handleSuccess(rerouterTarget.id)}
        />
      )}
      {etablissementTarget && (
        <EtablissementModal
          demande={etablissementTarget}
          onClose={() => setEtablissementTarget(null)}
          onSuccess={() => handleSuccess(etablissementTarget.id)}
        />
      )}
    </>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function ACPDemandesPanel({ demandes: demandesProp, poleId, onRefresh }: Props) {
  // Self-fetch mode when demandes prop is not provided (e.g. AP dashboard)
  const [selfDemandes, setSelfDemandes] = useState<ACPDemande[]>([]);
  const [selfLoading, setSelfLoading]   = useState(demandesProp === undefined);
  const isSelfFetch = demandesProp === undefined;

  const [showNouvelleModal, setShowNouvelleModal] = useState(false);

  const fetchSelf = async () => {
    setSelfLoading(true);
    try {
      const r = await api.get('/pole/requests/pending/');
      setSelfDemandes(r.data.demandes ?? []);
    } finally {
      setSelfLoading(false);
    }
  };

  useEffect(() => {
    if (isSelfFetch) fetchSelf();
  }, [isSelfFetch]);

  const demandes = isSelfFetch ? selfDemandes : (demandesProp ?? []);

  const handleRefresh = () => {
    if (isSelfFetch) fetchSelf();
    onRefresh?.();
  };

  const handleNouvelleSuccess = () => {
    setShowNouvelleModal(false);
    handleRefresh();
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Demandes en attente</h2>
              <p className="text-xs text-slate-400">Affectation à effectuer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!selfLoading && demandes.length > 0 && (
              <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                {demandes.length}
              </span>
            )}
            <button
              onClick={() => setShowNouvelleModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[11px] font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouvelle
            </button>
          </div>
        </div>

        {/* Content */}
        {selfLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : (
          <DemandesList demandes={demandes} poleId={poleId} onRefresh={handleRefresh} />
        )}
      </div>

      {showNouvelleModal && (
        <NouvelleDemandeModal
          onClose={() => setShowNouvelleModal(false)}
          onSuccess={handleNouvelleSuccess}
        />
      )}
    </>
  );
}
