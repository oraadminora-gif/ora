// src/components/mentor/MentorSuiviModal.tsx
import { useState, useEffect } from 'react';
import {
  X, Loader2, Save, Calendar, User, Mail, Phone, MapPin,
  GraduationCap, AlertTriangle, Clock, CheckCircle, Pencil,
  Target, BookOpen, Lock,
} from 'lucide-react';
import api from '../../services/api';
import type { MentoratActif } from '../../pages/member/mentor/MentorDashboard';

interface ApiError { response?: { data?: { error?: string } } }
interface EtabOption { id: number; nom: string; code_postal: string }

interface Props {
  mentorat: MentoratActif;
  onClose: () => void;
  onSaved: () => void;
}

const INPUT = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ora-blue/30 focus:border-ora-blue transition-all';

const DIPLOME_CHOICES = [
  { value: 'CAP',       label: 'Niveau 3 — CAP' },
  { value: 'BEP',       label: 'Niveau 3 — BEP' },
  { value: 'BAC_PRO',   label: 'Niveau 4 — Bac Pro' },
  { value: 'BAC_AUTRE', label: 'Niveau 4 — Bac autres' },
  { value: 'BP',        label: 'Niveau 4 — BP' },
  { value: 'BTS',       label: 'Niveau 5 — BTS' },
  { value: 'DUT',       label: 'Niveau 5 — DUT' },
  { value: 'LIC_PRO',   label: 'Niveau 6 — Licence Pro' },
  { value: 'BUT',       label: 'Niveau 6 — BUT' },
  { value: 'MASTER',    label: 'Niveau 7 — Master' },
  { value: 'DEA',       label: 'Niveau 7 — DEA' },
  { value: 'DES',       label: "Niveau 7 — Diplôme d'études spécialisées" },
  { value: 'ING',       label: 'Niveau 7 — Ingénieur' },
];

// ── Section Jeune (lecture + édition diplôme / situation / établissement) ──────
function JeuneSection({ mentoratId, jeune }: {
  mentoratId: number;
  jeune: MentoratActif['jeune'];
}) {
  const [editing, setEditing]               = useState(false);
  const [diplome, setDiplome]               = useState(jeune.diplome_prepare);
  const [diplomeLabel, setDiplomeLabel]     = useState(jeune.diplome_label);
  const [situation, setSituation]           = useState(jeune.situation);
  const [situationLabel, setSituationLabel] = useState(jeune.situation_label);
  const [etabId, setEtabId]                 = useState<number | null>(jeune.etablissement_id);
  const [displayNom, setDisplayNom]         = useState(jeune.nom_etablissement);
  // etabSelectVal tracks what's selected in the dropdown independently of displayNom
  const [etabSelectVal, setEtabSelectVal]   = useState<string>(
    jeune.etablissement_id ? String(jeune.etablissement_id)
      : (jeune.nom_etablissement && !jeune.etablissement_id ? 'autre' : '')
  );
  const [autreNom, setAutreNom]             = useState(jeune.etablissement_id ? '' : jeune.nom_etablissement);
  const [etabs, setEtabs]                   = useState<EtabOption[]>([]);
  const [saving, setSaving]                 = useState(false);
  const [err, setErr]                       = useState('');

  useEffect(() => {
    if (!editing) return;
    api.get<EtabOption[]>('/mentor/etablissements/').then(r => setEtabs(r.data)).catch(() => {});
  }, [editing]);

  const handleSave = async () => {
    setSaving(true); setErr('');
    const payload: Record<string, unknown> = { diplome_prepare: diplome, situation };
    if (situation === 'apprentissage') {
      if (etabSelectVal === 'autre' || etabSelectVal === '') {
        payload.etablissement_id  = null;
        payload.nom_etablissement = autreNom.trim();
      } else {
        payload.etablissement_id = Number(etabSelectVal);
      }
    } else {
      // En recherche : effacer établissement
      payload.etablissement_id  = null;
      payload.nom_etablissement = '';
    }
    try {
      const res = await api.patch<{
        diplome_prepare: string; diplome_label: string;
        situation: string; situation_label: string;
        etablissement_id: number | null; nom_etablissement: string;
      }>(`/mentor/mentorats/${mentoratId}/jeune/`, payload);
      setDiplome(res.data.diplome_prepare);
      setDiplomeLabel(res.data.diplome_label);
      setSituationLabel(res.data.situation_label);
      setEtabId(res.data.etablissement_id);
      setDisplayNom(res.data.nom_etablissement);
      setAutreNom(res.data.etablissement_id ? '' : res.data.nom_etablissement);
      setEtabSelectVal(
        res.data.etablissement_id ? String(res.data.etablissement_id)
          : (res.data.nom_etablissement ? 'autre' : '')
      );
      setEditing(false);
    } catch (e: unknown) {
      const er = e as ApiError;
      setErr(er.response?.data?.error ?? 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      {/* Infos lecture */}
      <div className="space-y-1.5">
        {jeune.email && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />{jeune.email}
          </div>
        )}
        {jeune.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />{jeune.phone}
          </div>
        )}
        {(jeune.commune || jeune.ville) && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {jeune.code_postal && `${jeune.code_postal} `}{jeune.commune || jeune.ville}
          </div>
        )}
        {jeune.birth_date && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {new Date(jeune.birth_date).toLocaleDateString('fr-FR')}
            {jeune.gender_label ? ` · ${jeune.gender_label}` : ''}
          </div>
        )}
        {jeune.needs_description && (
          <p className="text-sm text-slate-500 italic leading-relaxed pt-1">{jeune.needs_description}</p>
        )}
      </div>

      {/* Bloc éditable : diplôme + situation + établissement */}
      {!editing ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {diplomeLabel && (
              <span className="flex items-center gap-1 text-slate-500">
                <GraduationCap className="w-3 h-3" />{diplomeLabel}
              </span>
            )}
            {diplomeLabel && situationLabel && <span className="text-slate-300">·</span>}
            {situationLabel
              ? <span className="font-semibold text-ora-blue">{situationLabel}</span>
              : <span className="text-slate-400 italic">Situation non renseignée</span>
            }
            {displayNom && (
              <><span className="text-slate-300">·</span><span>{displayNom}</span></>
            )}
          </div>
          <button onClick={() => setEditing(true)}
            className="shrink-0 p-1 hover:bg-white rounded-lg text-slate-300 hover:text-ora-blue transition-colors">
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
          {err && <p className="text-[10px] text-red-600">{err}</p>}

          {/* Diplôme */}
          <select value={diplome} onChange={e => setDiplome(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40">
            <option value="">— Niveau d'études —</option>
            {DIPLOME_CHOICES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>

          {/* Situation */}
          <div className="flex gap-2">
            {([['apprentissage', 'En apprentissage'], ['recherche', 'En recherche']] as [string, string][]).map(([val, lbl]) => (
              <button key={val} type="button" onClick={() => setSituation(val)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  situation === val ? 'bg-ora-blue text-white border-ora-blue' : 'bg-white text-slate-500 border-slate-200'
                }`}>{lbl}</button>
            ))}
          </div>

          {/* Établissement — uniquement en apprentissage */}
          {situation === 'apprentissage' && (
            <>
              <select value={etabSelectVal}
                onChange={e => {
                  const v = e.target.value;
                  setEtabSelectVal(v);
                  if (v === 'autre') { setEtabId(null); }
                  else if (v === '') { setEtabId(null); setAutreNom(''); }
                  else { setEtabId(Number(v)); setAutreNom(''); }
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40">
                <option value="">— Établissement / CFA —</option>
                {etabs.map(e => <option key={e.id} value={String(e.id)}>{e.nom}{e.code_postal ? ` (${e.code_postal})` : ''}</option>)}
                <option value="autre">Autre…</option>
              </select>
              {etabSelectVal === 'autre' && (
                <input type="text" value={autreNom} onChange={e => setAutreNom(e.target.value)}
                  placeholder="Nom de l'établissement…"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ora-blue/40" />
              )}
            </>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(false)}
              className="flex-1 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-white">
              Annuler
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex-1 py-1.5 text-xs font-semibold text-white bg-ora-blue rounded-lg disabled:opacity-50">
              {saving ? '…' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export function MentorSuiviModal({ mentorat, onClose, onSaved }: Props) {
  const j = mentorat.jeune;

  // Suivi form
  const [expectedEnd,   setExpectedEnd]   = useState(mentorat.expected_end_date ?? '');
  const [nbRencontres,  setNbRencontres]  = useState(String(mentorat.nb_rencontres));
  const [nbHeures,      setNbHeures]      = useState(String(mentorat.nb_heures));
  const [typeMentorat,  setTypeMentorat]  = useState(mentorat.type_mentorat);
  const [problematiques, setProblematiques] = useState<string[]>([...mentorat.problematiques]);
  const [objectif,      setObjectif]      = useState(mentorat.objectif_mentor);
  const [bilan,         setBilan]         = useState(mentorat.bilan_suivi);

  // Clôture
  const [closureCode,   setClosureCode]   = useState('');
  const [closedAt,      setClosedAt]      = useState('');

  // UI
  const [saving,   setSaving]   = useState(false);
  const [clotSaving, setClotSaving] = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [clotError, setClotError] = useState('');

  const toggleProb = (code: string) => {
    setProblematiques(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.patch(`/mentor/mentorats/${mentorat.id}/suivi/`, {
        nb_rencontres:   Number(nbRencontres) || 0,
        nb_heures:       parseFloat(nbHeures) || 0,
        type_mentorat:   typeMentorat,
        problematiques,
        objectif_mentor: objectif,
        bilan_suivi:     bilan,
        expected_end_date: expectedEnd || null,
      });
      setSuccess('Suivi enregistré.');
      onSaved();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError((e as ApiError).response?.data?.error ?? 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const handleCloture = async () => {
    if (!closureCode) { setClotError('Veuillez sélectionner une raison.'); return; }
    setClotSaving(true); setClotError('');
    try {
      await api.post(`/mentor/mentorats/${mentorat.id}/cloturer/`, {
        closure_reason_code: closureCode,
      });
      onSaved();
      onClose();
    } catch (e) {
      setClotError((e as ApiError).response?.data?.error ?? 'Erreur');
    } finally { setClotSaving(false); }
  };

  const isCloturePending = mentorat.cloture_en_attente;

  // Libellé de la raison de clôture demandée
  const cloturePendingLabel = mentorat.closure_reason_choices.find(
    c => c.value === mentorat.cloture_reason_demandee
  )?.label ?? mentorat.cloture_reason_demandee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Suivi du mentorat</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {j.first_name} {j.last_name}
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Actif</span>
              {mentorat.alerte_rouge && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">⚠ Alerte</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[80vh]">
          <div className="px-6 py-5 space-y-6">

            {/* ── Dates ─────────────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Dates
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {j.request_date && (
                  <div className="text-sm text-slate-600">
                    <span className="text-slate-400 block text-xs mb-0.5">Date de demande</span>
                    {new Date(j.request_date).toLocaleDateString('fr-FR')}
                  </div>
                )}
                {mentorat.date_debut && (
                  <div className="text-sm text-slate-600">
                    <span className="text-slate-400 block text-xs mb-0.5">Date d'affectation</span>
                    {new Date(mentorat.date_debut).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Date prévisionnelle de fin</label>
                <input type="date" value={expectedEnd} onChange={e => setExpectedEnd(e.target.value)} className={INPUT} />
              </div>
            </section>

            {/* ── Jeune ─────────────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Jeune
              </h3>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-semibold text-slate-900 mb-3">{j.first_name} {j.last_name}</p>
                <JeuneSection mentoratId={mentorat.id} jeune={j} />
              </div>
            </section>

            {/* ── Suivi ─────────────────────────────────────────── */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Suivi</h3>
              <div className="space-y-4">

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre de rencontres</label>
                    <input type="number" min="0" value={nbRencontres}
                      onChange={e => setNbRencontres(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre d'heures</label>
                    <input type="number" min="0" step="0.5" value={nbHeures}
                      onChange={e => setNbHeures(e.target.value)} className={INPUT} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Type de mentorat</label>
                  <div className="flex gap-2">
                    {([['', '— Non renseigné —'], ['presentiel', 'Présentiel'], ['distanciel', 'Distanciel']] as [string, string][]).map(([val, lbl]) => (
                      <button key={val} type="button" onClick={() => setTypeMentorat(val)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          typeMentorat === val
                            ? 'bg-ora-blue text-white border-ora-blue'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}>{lbl}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Problématiques</label>
                  <div className="flex flex-wrap gap-1.5">
                    {mentorat.problematiques_choices.map(c => (
                      <button key={c.value} type="button" onClick={() => toggleProb(c.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                          problematiques.includes(c.value)
                            ? 'bg-ora-blue text-white border-ora-blue'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}>{c.label}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    <Target className="w-3 h-3 inline mr-1 text-ora-blue" />Objectif du mentor
                  </label>
                  <textarea rows={3} value={objectif} onChange={e => setObjectif(e.target.value)}
                    placeholder="Objectif défini pour ce mentorat…"
                    className={`${INPUT} resize-none`} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    <BookOpen className="w-3 h-3 inline mr-1 text-violet-500" />Bilan sommaire du suivi
                  </label>
                  <textarea rows={4} value={bilan} onChange={e => setBilan(e.target.value)}
                    placeholder="Bilan global de ce mentorat…"
                    className={`${INPUT} resize-none`} />
                </div>
              </div>
            </section>

            {/* ── Clôture ───────────────────────────────────────── */}
            {!isCloturePending ? (
              <section className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Demande de clôture
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Raison de clôture *</label>
                    <select value={closureCode} onChange={e => setClosureCode(e.target.value)} className={INPUT}>
                      <option value="">— Choisir une raison —</option>
                      {mentorat.closure_reason_choices.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Date de clôture *
                      {closureCode && !closedAt && (
                        <span className="ml-1 text-amber-500 font-normal normal-case">(requise)</span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={closedAt}
                      onChange={e => setClosedAt(e.target.value)}
                      disabled={!closureCode}
                      className={`${INPUT} disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed`}
                    />
                  </div>
                </div>
                {closureCode && !closedAt && (
                  <p className="text-xs text-amber-600">Sélectionnez également une date de clôture.</p>
                )}
                {clotError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{clotError}</p>
                )}
              </section>
            ) : (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-700">Clôture en attente de confirmation AP</p>
                  {cloturePendingLabel && (
                    <p className="text-[10px] text-amber-600 mt-0.5">Raison : {cloturePendingLabel}</p>
                  )}
                </div>
              </div>
            )}

            {error   && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
            {success && <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" />{success}</p>}

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white sticky bottom-0 rounded-b-2xl flex items-center justify-between gap-3">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50">
              Fermer
            </button>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-ora-blue text-white text-sm font-bold rounded-xl hover:bg-ora-blue/90 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer le suivi
              </button>

              {!isCloturePending ? (
                <button onClick={handleCloture} disabled={clotSaving || !closureCode || !closedAt}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-all">
                  {clotSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Demande de clôture
                </button>
              ) : (
                <button disabled
                  className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 text-sm font-bold rounded-xl opacity-80 cursor-not-allowed border border-amber-200">
                  <Clock className="w-4 h-4" /> En attente de clôture
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
