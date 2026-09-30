// src/pages/member/pole/CandidaturesMentors.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck, XCircle, CheckCircle, Loader2, Mail, Phone, MapPin,
  Briefcase, MessageSquare, Calendar, Building2, X, AlertCircle, Users,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import type { CandidatureMentor, AssociationOption } from './CandidaturesMentors.types';

type TabFilter = 'PENDING' | 'VALIDATED' | 'REJECTED';

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'PENDING',   label: 'En attente' },
  { key: 'VALIDATED', label: 'Validées' },
  { key: 'REJECTED',  label: 'Rejetées' },
];

const STATUT_STYLE: Record<string, string> = {
  PENDING:   'bg-amber-50   text-amber-700   border-amber-200',
  VALIDATED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED:  'bg-red-50     text-red-700     border-red-200',
};

function StatutBadge({ candidature }: { candidature: CandidatureMentor }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUT_STYLE[candidature.statut] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {candidature.statut_label}
    </span>
  );
}

// ── Valider Modal ─────────────────────────────────────────────────────────────
function ValiderModal({ candidature, isACP, onClose, onSuccess }: {
  candidature: CandidatureMentor;
  isACP: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const needsAssociation = !candidature.association_id;
  const [associations, setAssociations]   = useState<AssociationOption[]>([]);
  const [associationId, setAssociationId] = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  useEffect(() => {
    if (needsAssociation && isACP) {
      api.get('/pole/associations/').then(r => setAssociations(r.data.associations ?? []));
    }
  }, [needsAssociation, isACP]);

  const submit = async () => {
    if (needsAssociation && isACP && !associationId) {
      setError("Merci de sélectionner l'association du candidat.");
      return;
    }
    setLoading(true); setError('');
    try {
      const payload = needsAssociation && associationId ? { association_id: Number(associationId) } : {};
      await api.post(`/pole/candidatures-mentors/${candidature.id}/valider/`, payload);
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail ?? 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Valider la candidature
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          <span className="font-semibold text-slate-700">{candidature.first_name} {candidature.last_name}</span> sera créé(e) en tant que mentor actif.
        </p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {needsAssociation && (
          isACP ? (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Association du candidat *</label>
              <select value={associationId} onChange={e => setAssociationId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500">
                <option value="">— Choisir —</option>
                {associations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          ) : (
            <p className="flex items-start gap-2 text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Cette candidature n'a pas encore d'association attribuée : elle sera rattachée à la vôtre.
            </p>
          )
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Annuler
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'Validation…' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Rejeter Modal ──────────────────────────────────────────────────────────────
function RejeterModal({ candidature, onClose, onSuccess }: {
  candidature: CandidatureMentor;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async () => {
    setLoading(true); setError('');
    try {
      await api.post(`/pole/candidatures-mentors/${candidature.id}/rejeter/`, { notes_rejet: notes.trim() });
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail ?? 'Erreur lors du rejet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            Rejeter la candidature
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          <span className="font-semibold text-slate-700">{candidature.first_name} {candidature.last_name}</span>
        </p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Motif du rejet (optionnel)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Expliquez pourquoi cette candidature est rejetée…"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 resize-none" />
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Annuler
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Rejet…' : 'Rejeter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Candidature card ──────────────────────────────────────────────────────────
function CandidatureCard({ candidature, onValider, onRejeter }: {
  candidature: CandidatureMentor;
  onValider: (c: CandidatureMentor) => void;
  onRejeter: (c: CandidatureMentor) => void;
}) {
  const c = candidature;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-base font-bold text-slate-900">{c.first_name} {c.last_name}</p>
        <StatutBadge candidature={c} />
      </div>

      <div className="space-y-1 mb-2.5">
        {c.email && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Mail className="w-4 h-4 shrink-0 text-slate-300" /><span className="truncate">{c.email}</span>
          </div>
        )}
        {c.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Phone className="w-4 h-4 shrink-0 text-slate-300" /><span>{c.phone}</span>
          </div>
        )}
      </div>

      {(c.commune || c.code_postal) && (
        <div className="flex items-center gap-1.5 mb-2 text-sm text-slate-500">
          <MapPin className="w-4 h-4 shrink-0 text-slate-300" />
          <span>{c.code_postal && `${c.code_postal} `}{c.commune}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
          <Building2 className="w-3 h-3" />{c.pole_name ?? 'Pôle non détecté'}
        </span>
        {c.association_name ? (
          <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full font-medium">
            <Users className="w-3 h-3" />{c.association_name}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-medium">
            <AlertCircle className="w-3 h-3" />Association non attribuée
          </span>
        )}
      </div>

      {c.experience_pro && (
        <div className="flex items-start gap-1.5 mb-2 text-sm text-slate-500">
          <Briefcase className="w-4 h-4 shrink-0 text-slate-300 mt-0.5" />
          <span className="leading-relaxed">{c.experience_pro}</span>
        </div>
      )}

      {c.motivation && (
        <div className="flex items-start gap-2 mb-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg">
          <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-snug">{c.motivation}</p>
        </div>
      )}

      {c.statut === 'REJECTED' && c.notes_rejet && (
        <div className="flex items-start gap-2 mb-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-snug">{c.notes_rejet}</p>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
        <Calendar className="w-3.5 h-3.5" />
        {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      {c.statut === 'PENDING' && (
        <div className="flex gap-2 mt-3">
          <button onClick={() => onRejeter(c)}
            className="flex-1 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
            <XCircle className="w-4 h-4" />Rejeter
          </button>
          <button onClick={() => onValider(c)}
            className="flex-1 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4" />Valider
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function CandidaturesMentors() {
  const { activeRole } = useAuth();
  const isACP = activeRole === 'ACP';

  const [candidatures, setCandidatures] = useState<CandidatureMentor[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<TabFilter>('PENDING');
  const [validerTarget, setValiderTarget] = useState<CandidatureMentor | null>(null);
  const [rejeterTarget, setRejeterTarget] = useState<CandidatureMentor | null>(null);
  const [successMsg, setSuccessMsg]       = useState<string | null>(null);

  const fetchCandidatures = useCallback(async (statut: TabFilter) => {
    setLoading(true);
    try {
      const res = await api.get('/pole/candidatures-mentors/', { params: { statut } });
      setCandidatures(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCandidatures(tab); }, [tab, fetchCandidatures]);

  const handleActionSuccess = (message: string) => {
    setValiderTarget(null);
    setRejeterTarget(null);
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(null), 4000);
    fetchCandidatures(tab);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Candidatures mentors</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Candidatures soumises via le formulaire public d'inscription mentor.
        </p>
      </div>

      {/* Succès */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />{successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
              tab === t.key
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        </div>
      ) : candidatures.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center bg-white rounded-2xl border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-slate-400">Aucune candidature</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidatures.map(c => (
            <CandidatureCard key={c.id} candidature={c} onValider={setValiderTarget} onRejeter={setRejeterTarget} />
          ))}
        </div>
      )}

      {validerTarget && (
        <ValiderModal
          candidature={validerTarget}
          isACP={isACP}
          onClose={() => setValiderTarget(null)}
          onSuccess={() => handleActionSuccess(`${validerTarget.first_name} ${validerTarget.last_name} a été créé(e) comme mentor.`)}
        />
      )}
      {rejeterTarget && (
        <RejeterModal
          candidature={rejeterTarget}
          onClose={() => setRejeterTarget(null)}
          onSuccess={() => handleActionSuccess(`Candidature de ${rejeterTarget.first_name} ${rejeterTarget.last_name} rejetée.`)}
        />
      )}
    </div>
  );
}
