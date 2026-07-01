import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ComposableMap,
  createCoordinates,
  Geographies,
  Geography,
} from '@vnedyalk0v/react19-simple-maps';
import api from '../services/api';
import {
  Loader2, AlertCircle, MapPin, Mail, Phone, X, ChevronRight, HandHeart,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface PolePublic {
  id: number;
  code: string;
  name: string;
  etat_activite: string;
  villes: string[];
  contact_email: string;
  contact_phone: string;
  departments: { code: string; name: string }[];
}

interface ImplantationsPublicData {
  poles: PolePublic[];
  department_pole_map: Record<string, { pole_id: number; etat_activite: string }>;
  stats: { total_poles: number; total_departments_covered: number };
}

// ─────────────────────────────────────────────────────────────
// COULEURS (identiques à la carte CN, sans les labels)
// ─────────────────────────────────────────────────────────────
const ETATS: Record<string, { fill: string; fillHover: string; stroke: string; dot: string }> = {
  a_letude:    { fill: '#bae6fd', fillHover: '#7dd3fc', stroke: '#0284c7', dot: 'bg-sky-400'     },
  demarre:     { fill: '#bbf7d0', fillHover: '#86efac', stroke: '#16a34a', dot: 'bg-emerald-500' },
  fragile:     { fill: '#fde68a', fillHover: '#fcd34d', stroke: '#d97706', dot: 'bg-amber-400'   },
  experimente: { fill: '#ddd6fe', fillHover: '#c4b5fd', stroke: '#7c3aed', dot: 'bg-violet-500'  },
  arrete:      { fill: '#fecaca', fillHover: '#fca5a5', stroke: '#dc2626', dot: 'bg-red-400'     },
  '':          { fill: '#bfdbfe', fillHover: '#93c5fd', stroke: '#3b82f6', dot: 'bg-blue-400'    },
};
const FILL_NONE   = '#e2e8f0';
const STROKE_NONE = '#cbd5e1';

let _geoCache: unknown = null;

// ─────────────────────────────────────────────────────────────
// TOOLTIP
// ─────────────────────────────────────────────────────────────
function Tooltip({ x, y, pole, deptName }: {
  x: number; y: number; pole: PolePublic | null; deptName: string;
}) {
  if (!pole) return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-lg border border-slate-200 px-3 py-2 pointer-events-none text-xs"
      style={{ left: x + 14, top: y - 10, transform: 'translateY(-100%)' }}
    >
      <p className="text-slate-500 font-medium">{deptName}</p>
      <p className="text-slate-400 text-[10px]">Aucun pôle</p>
    </div>
  );

  return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-3 pointer-events-none min-w-[180px]"
      style={{ left: x + 14, top: y - 10, transform: 'translateY(-100%)' }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${(ETATS[pole.etat_activite] ?? ETATS['']).dot}`} />
        <p className="font-bold text-slate-900 text-xs">{pole.name}</p>
        <span className="ml-auto font-mono text-[9px] text-slate-400">{pole.code}</span>
      </div>
      <p className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full w-fit">{deptName}</p>
      {pole.villes.length > 0 && (
        <p className="text-[10px] text-slate-500 mt-1.5">
          <MapPin className="w-2.5 h-2.5 inline mr-0.5 text-blue-400" />
          {pole.villes.slice(0, 2).join(', ')}{pole.villes.length > 2 ? '…' : ''}
        </p>
      )}
      <p className="text-[9px] text-slate-300 mt-1.5">Cliquer pour les détails</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PANEL DÉTAIL
// ─────────────────────────────────────────────────────────────
function PoleDetailPanel({ pole, onClose }: { pole: PolePublic; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
        <div>
          <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{pole.code}</span>
          <h3 className="text-base font-bold text-slate-900 mt-1">{pole.name}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {pole.villes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Villes</p>
            <div className="flex flex-wrap gap-1.5">
              {pole.villes.map(v => (
                <span key={v} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                  <MapPin className="w-3 h-3 text-blue-400" />{v}
                </span>
              ))}
            </div>
          </div>
        )}

        {pole.departments.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Départements couverts ({pole.departments.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {pole.departments.map(d => (
                <span key={d.code} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded font-mono font-bold">
                  {d.code}
                  <span className="font-sans font-normal text-slate-400">{d.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {(pole.contact_email || pole.contact_phone) && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contact</p>
            <div className="space-y-1.5">
              {pole.contact_email && (
                <a href={`mailto:${pole.contact_email}`}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{pole.contact_email}</span>
                </a>
              )}
              {pole.contact_phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{pole.contact_phone}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── CTA mentor ── */}
      <div className="p-4 border-t border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <p className="text-[11px] text-slate-500 mb-2">
          Ce pôle couvre votre zone — un mentor est disponible près de chez vous.
        </p>
        <Link
          to="/apprentis/inscription"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-ora-blue hover:bg-ora-dark text-white rounded-xl text-xs font-bold transition-colors"
        >
          <HandHeart className="w-3.5 h-3.5" />
          Pour trouver un mentor, clic ici
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LISTE ITEM
// ─────────────────────────────────────────────────────────────
function PoleListItem({ pole, selected, onClick }: {
  pole: PolePublic; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 transition-all border-b border-slate-50 last:border-0 flex items-start gap-3 hover:bg-slate-50/60 ${selected ? 'bg-blue-50/50' : ''}`}
    >
      <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${(ETATS[pole.etat_activite] ?? ETATS['']).dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900 truncate">{pole.name}</p>
          <span className="font-mono text-[9px] text-slate-400 shrink-0">{pole.code}</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {pole.departments.length} dépt{pole.departments.length > 1 ? 's' : ''}
          {pole.villes.length > 0 && ` · ${pole.villes.slice(0, 2).join(', ')}`}
        </p>
      </div>
      <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-colors ${selected ? 'text-blue-500' : 'text-slate-200'}`} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export function Implantations() {
  const [data, setData]           = useState<ImplantationsPublicData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [geoData, setGeoData]     = useState<unknown>(_geoCache);
  const [tooltip, setTooltip]     = useState<{ x: number; y: number; deptCode: string; deptName: string } | null>(null);
  const [selectedPole, setSelectedPole] = useState<PolePublic | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get<ImplantationsPublicData>('/public/implantations/');
      setData(res.data);
    } catch {
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (_geoCache) { setGeoData(_geoCache); return; }
    fetch('/departements.geojson')
      .then(r => r.json())
      .then(d => { _geoCache = d; setGeoData(d); })
      .catch(() => {});
  }, []);

  const poleById = useMemo(() => {
    const m: Record<number, PolePublic> = {};
    data?.poles?.forEach(p => { m[p.id] = p; });
    return m;
  }, [data]);

  const hoveredPole = useMemo(() => {
    if (!tooltip || !data?.department_pole_map) return null;
    const entry = data.department_pole_map[tooltip.deptCode];
    return entry ? (poleById[entry.pole_id] ?? null) : null;
  }, [tooltip, data, poleById]);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-slate-900 text-white pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2 text-blue-300 text-sm font-medium tracking-widest uppercase mb-5">
            <MapPin className="w-4 h-4" />
            Présence nationale
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            Nos implantations
          </h1>
          <p className="text-lg text-white/70 max-w-xl mb-8">
            ORA accompagne les jeunes en apprentissage partout en France, grâce à un réseau de pôles locaux.
          </p>
          {data && (
            <div className="flex flex-wrap gap-4">
              <StatPill value={data.stats.total_poles} label="pôles actifs" />
              <StatPill value={data.stats.total_departments_covered} label="départements couverts" />
              <StatPill
                value={`${Math.round((data.stats.total_departments_covered / 96) * 100)} %`}
                label="du territoire"
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Corps ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={load} className="mt-3 px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
              Réessayer
            </button>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">

            {/* ── Carte ──────────────────────────────────────────── */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative min-h-[420px]">
              {/* Légende */}
              <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm px-3 py-2.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Légende</p>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm shrink-0 border"
                    style={{ background: FILL_NONE, borderColor: STROKE_NONE }} />
                  <span className="text-[10px] text-slate-400">Non couvert</span>
                </div>
              </div>

              <ComposableMap
                projection="geoConicConformal"
                projectionConfig={{ center: createCoordinates(2.5, 46.5), scale: 2800 }}
                width={800}
                height={580}
                className="w-full"
                style={{ display: 'block' }}
              >
                {geoData && (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <Geographies geography={geoData as any}>
                    {({ geographies }) =>
                      geographies.map((geo, i) => {
                        const deptCode = (geo.properties?.code as string | undefined) ?? String(i);
                        const deptName = (geo.properties?.nom  as string | undefined) ?? deptCode;
                        const entry   = data.department_pole_map[deptCode];
                        const pole    = entry ? poleById[entry.pole_id] : null;
                        const isActive = !!entry;
                        const isSelected = selectedPole && pole?.id === selectedPole.id;
                        const cfg = isActive ? (ETATS[entry.etat_activite] ?? ETATS['']) : null;

                        return (
                          <Geography
                            key={deptCode}
                            geography={geo}
                            fill={cfg ? cfg.fill : FILL_NONE}
                            stroke={isSelected ? '#1e3a8a' : cfg ? cfg.stroke : STROKE_NONE}
                            strokeWidth={isSelected ? 2 : 0.6}
                            style={{
                              default: { outline: 'none' },
                              hover:   { fill: cfg ? cfg.fillHover : FILL_NONE, outline: 'none', cursor: isActive ? 'pointer' : 'default' },
                              pressed: { outline: 'none' },
                            }}
                            onMouseMove={(e: React.MouseEvent) =>
                              setTooltip({ x: e.clientX, y: e.clientY, deptCode, deptName })
                            }
                            onMouseLeave={() => setTooltip(null)}
                            onClick={() => {
                              if (pole) setSelectedPole(prev => prev?.id === pole.id ? null : pole);
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                )}
              </ComposableMap>
            </div>

            {/* ── Panneau droit ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
              style={{ maxHeight: '640px' }}>
              {selectedPole ? (
                <PoleDetailPanel pole={selectedPole} onClose={() => setSelectedPole(null)} />
              ) : (
                <>
                  <div className="px-4 py-3 border-b border-slate-50">
                    <h3 className="text-sm font-bold text-slate-900">
                      Pôles ({data.poles.length})
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cliquer sur un pôle ou un département
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {data.poles.map(pole => (
                      <PoleListItem
                        key={pole.id}
                        pole={pole}
                        selected={selectedPole?.id === pole.id}
                        onClick={() => setSelectedPole(prev => prev?.id === pole.id ? null : pole)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl px-7 py-8 flex flex-col gap-4">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">Ton département est couvert</p>
            <h2 className="text-lg font-bold text-white mb-1">Un mentor t'attend</h2>
            <p className="text-blue-100 text-sm">
              Clique sur ta zone sur la carte ou inscris-toi directement.
            </p>
          </div>
          <Link
            to="/apprentis/inscription"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm self-start"
          >
            <HandHeart className="w-4 h-4" />
            Pour trouver un mentor, clic ici
          </Link>
        </div>
      </section>

      {/* ── Tooltip ────────────────────────────────────────────────── */}
      {tooltip && (
        <Tooltip
          x={tooltip.x}
          y={tooltip.y}
          pole={hoveredPole}
          deptName={tooltip.deptName}
        />
      )}
    </div>
  );
}

function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
      <p className="text-2xl font-extrabold text-white tabular-nums">{value}</p>
      <p className="text-xs text-blue-200 mt-0.5">{label}</p>
    </div>
  );
}
