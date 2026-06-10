// src/pages/member/cn/ImplantationsPoles.tsx
import { geoConicConformal } from 'd3-geo';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ComposableMap,
  createCoordinates,
  Geographies,
  Geography,
  Marker,
} from '@vnedyalk0v/react19-simple-maps';
import { useReactToPrint } from 'react-to-print';
import api from '../../../services/api';
import {
  Loader2, AlertCircle, MapPin, Users, HandHeart,
  Clock, Mail, Phone, X, Building2, ChevronRight, Download,
  ChevronDown, Archive,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface VilleGeo {
  name: string;
  lat: number | null;
  lon: number | null;
}

interface PoleData {
  id: number; code: string; name: string;
  status: string;
  etat_activite: string; etat_label: string;
  villes: VilleGeo[];
  contact_email: string; contact_phone: string;
  departments: { code: string; name: string }[];
  mentors_count: number; animateurs_count: number;
  mentorats_actifs: number; mentorats_clotures: number; jeunes_en_attente: number;
}

interface DeptPoleEntry {
  pole_id: number; etat_activite: string; etat_label: string;
}

interface ImplantationsData {
  poles: PoleData[];
  department_pole_map: Record<string, DeptPoleEntry>;
  stats: {
    total_poles: number;
    total_departments_covered: number;
    par_etat: Record<string, number>;
  };
}

// ─────────────────────────────────────────────────────────────
// CONFIG ÉTATS
// ─────────────────────────────────────────────────────────────
const ETATS: Record<string, {
  label: string; fill: string; fillHover: string; stroke: string;
  badge: string; dot: string;
}> = {
  a_letude:    { label: "À l'étude",   fill: '#bae6fd', fillHover: '#7dd3fc', stroke: '#0284c7', badge: 'bg-sky-100 text-sky-800 border-sky-300',           dot: 'bg-sky-400'     },
  demarre:     { label: 'Démarré',     fill: '#bbf7d0', fillHover: '#86efac', stroke: '#16a34a', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  fragile:     { label: 'Fragile',     fill: '#fde68a', fillHover: '#fcd34d', stroke: '#d97706', badge: 'bg-amber-100 text-amber-800 border-amber-300',       dot: 'bg-amber-400'   },
  experimente: { label: 'Expérimenté', fill: '#ddd6fe', fillHover: '#c4b5fd', stroke: '#7c3aed', badge: 'bg-violet-100 text-violet-800 border-violet-300',    dot: 'bg-violet-500'  },
  arrete:      { label: 'Arrêté',      fill: '#fecaca', fillHover: '#fca5a5', stroke: '#dc2626', badge: 'bg-red-100 text-red-800 border-red-300',             dot: 'bg-red-400'     },
  '':          { label: 'Non défini',  fill: '#e2e8f0', fillHover: '#cbd5e1', stroke: '#94a3b8', badge: 'bg-slate-100 text-slate-600 border-slate-300',       dot: 'bg-slate-400'   },
};

const ETAT_HEX: Record<string, string> = {
  a_letude:    '#0284c7',
  demarre:     '#16a34a',
  fragile:     '#d97706',
  experimente: '#7c3aed',
  arrete:      '#dc2626',
  '':          '#94a3b8',
};

const NO_POLE = { fill: '#e2e8f0', fillHover: '#cbd5e1', stroke: '#94a3b8' };

const PRINT_BASE = `
  @media print {
    body { font-size: 11px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    svg { overflow: visible; }
  }
`;

let _geoCache: unknown = null;

// ─────────────────────────────────────────────────────────────
// PLACEMENT DE LABELS SANS CHEVAUCHEMENT
// Projection exacte via d3-geo (identique à react-simple-maps)
// canvas 800 × 520, center (2.5, 46.5), scale 2800
// ─────────────────────────────────────────────────────────────
type Box    = [number, number, number, number]; // x, y, w, h
type Anchor = 'start' | 'end' | 'middle';
interface LabelPlacement { dx: number; dy: number; anchor: Anchor }

// Même projection que ComposableMap dans VillesMapCard
const _proj = geoConicConformal()
  .center([2.5, 46.5])
  .scale(2800)
  .translate([400, 260]);   // moitié de 800 × 520

function svgXY(lon: number, lat: number): [number, number] {
  return (_proj([lon, lat]) ?? [400, 260]) as [number, number];
}

const MR = 5;   // rayon marqueur
const CW = 6.0; // largeur approx par caractère (8.5px bold)
const LH = 11;  // hauteur ligne

function boxOverlap(a: Box, b: Box, pad = 2): boolean {
  return a[0] < b[0]+b[2]+pad && a[0]+a[2]+pad > b[0] &&
         a[1] < b[1]+b[3]+pad && a[1]+a[3]+pad > b[1];
}

function computePlacements(
  markers: Array<{ name: string; lon: number; lat: number; mentors: number }>
): LabelPlacement[] {
  // Priorité : pôles les plus actifs en premier (meilleures positions réservées)
  const order = markers
    .map((_, i) => i)
    .sort((a, b) => markers[b].mentors - markers[a].mentors);

  const occupied: Box[] = [];
  const results: LabelPlacement[] = new Array(markers.length);

  for (const i of order) {
    const m = markers[i];
    const [cx, cy] = svgXY(m.lon, m.lat);
    const w = m.name.length * CW + 6;

    // Réserver zone du marqueur
    occupied.push([cx - MR - 3, cy - MR - 3, (MR + 3) * 2, (MR + 3) * 2]);

    // 40 candidats : 8 directions × 5 distances croissantes
    type Cand = { dx: number; dy: number; anchor: Anchor; b: Box };
    let found: Cand | null = null;

    outer: for (const d of [10, 16, 23, 32, 44]) {
      const h = Math.round(d * 0.7); // composante diagonale

      const cands: Cand[] = [
        // droite
        { dx: d,    dy:  3,       anchor: 'start',  b: [cx+d,      cy+3-LH,    w, LH] },
        // gauche
        { dx: -d,   dy:  3,       anchor: 'end',    b: [cx-d-w,    cy+3-LH,    w, LH] },
        // dessus
        { dx:  0,   dy: -d,       anchor: 'middle', b: [cx-w/2,    cy-d-LH,    w, LH] },
        // dessous
        { dx:  0,   dy:  d+LH-2,  anchor: 'middle', b: [cx-w/2,    cy+d-2,     w, LH] },
        // diagonal droite-dessus
        { dx:  h,   dy: -(h+LH-3),anchor: 'start',  b: [cx+h,      cy-h-LH,    w, LH] },
        // diagonal droite-dessous
        { dx:  h,   dy:  h+LH-3,  anchor: 'start',  b: [cx+h,      cy+h,       w, LH] },
        // diagonal gauche-dessus
        { dx: -h,   dy: -(h+LH-3),anchor: 'end',    b: [cx-h-w,    cy-h-LH,    w, LH] },
        // diagonal gauche-dessous
        { dx: -h,   dy:  h+LH-3,  anchor: 'end',    b: [cx-h-w,    cy+h,       w, LH] },
      ];

      for (const c of cands) {
        if (!occupied.some(ob => boxOverlap(c.b, ob))) {
          found = c;
          occupied.push(c.b);
          break outer;
        }
      }
    }

    // Fallback : droite à d=10, on place quand même
    if (!found) {
      found = { dx: 10, dy: 3, anchor: 'start', b: [cx+10, cy+3-LH, w, LH] };
      occupied.push(found.b);
    }

    results[i] = { dx: found.dx, dy: found.dy, anchor: found.anchor };
  }
  return results;
}

// ─────────────────────────────────────────────────────────────
// TOOLTIP
// ─────────────────────────────────────────────────────────────
function DeptTooltip({ x, y, pole, deptName }: {
  x: number; y: number; pole: PoleData | null; deptName: string;
}) {
  if (!pole) return (
    <div className="no-print fixed z-50 bg-white rounded-xl shadow-lg border border-slate-200 px-3 py-2 pointer-events-none text-xs"
      style={{ left: x + 14, top: y - 10, transform: 'translateY(-100%)' }}>
      <p className="text-slate-500 font-medium">{deptName}</p>
      <p className="text-slate-400 text-[10px]">Aucun pôle</p>
    </div>
  );
  const etat = ETATS[pole.etat_activite] ?? ETATS[''];
  return (
    <div className="no-print fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-3 pointer-events-none min-w-[200px]"
      style={{ left: x + 14, top: y - 10, transform: 'translateY(-100%)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${etat.dot}`} />
        <p className="font-bold text-slate-900 text-xs">{pole.name}</p>
        <span className="ml-auto font-mono text-[9px] text-slate-400">{pole.code}</span>
      </div>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${etat.badge}`}>
        {etat.label}
      </span>
      <div className="grid grid-cols-2 gap-1 mt-2 text-[10px]">
        <div className="text-slate-500"><span className="font-bold text-slate-800">{pole.mentors_count}</span> mentors</div>
        <div className="text-slate-500"><span className="font-bold text-slate-800">{pole.mentorats_actifs}</span> mentorats</div>
        <div className="text-slate-500"><span className="font-bold text-slate-800">{pole.animateurs_count}</span> animateurs</div>
        <div className="text-slate-500"><span className="font-bold text-slate-800">{pole.jeunes_en_attente}</span> en attente</div>
      </div>
      <p className="text-[9px] text-slate-300 mt-1.5">Cliquer pour les détails</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PANEL DÉTAIL PÔLE
// ─────────────────────────────────────────────────────────────
function PoleDetailPanel({ pole, onClose }: { pole: PoleData; onClose: () => void }) {
  const etat = ETATS[pole.etat_activite] ?? ETATS[''];
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{pole.code}</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${etat.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${etat.dot}`} />
              {etat.label}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900">{pole.name}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Mentors',          value: pole.mentors_count,     icon: <Users className="w-4 h-4 text-violet-500" />,      bg: 'bg-violet-50' },
            { label: 'Mentorats actifs', value: pole.mentorats_actifs,  icon: <HandHeart className="w-4 h-4 text-emerald-500" />, bg: 'bg-emerald-50' },
            { label: 'Animateurs',       value: pole.animateurs_count,  icon: <Building2 className="w-4 h-4 text-sky-500" />,     bg: 'bg-sky-50' },
            { label: 'En attente',       value: pole.jeunes_en_attente, icon: <Clock className="w-4 h-4 text-amber-500" />,       bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-xl font-black text-slate-800">{s.value}</p>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
        {pole.villes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Villes</p>
            <div className="flex flex-wrap gap-1.5">
              {pole.villes.map(v => (
                <span key={v.name} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                  <MapPin className="w-3 h-3 text-slate-400" />{v.name}
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
                  {d.code}<span className="font-sans font-normal text-slate-400">{d.name}</span>
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
                <a href={`mailto:${pole.contact_email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-violet-600 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /><span className="truncate">{pole.contact_email}</span>
                </a>
              )}
              {pole.contact_phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /><span>{pole.contact_phone}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// POLE LIST ITEM
// ─────────────────────────────────────────────────────────────
function PoleListItem({ pole, selected, onClick }: {
  pole: PoleData; selected: boolean; onClick: () => void;
}) {
  const etat = ETATS[pole.etat_activite] ?? ETATS[''];
  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3 transition-all border-b border-slate-50 last:border-0 flex items-start gap-3 hover:bg-slate-50/60 ${selected ? 'bg-violet-50/50' : ''}`}>
      <span className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${etat.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900 truncate">{pole.name}</p>
          <span className="font-mono text-[9px] text-slate-400 shrink-0">{pole.code}</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {pole.departments.length} dépt · {pole.mentors_count} mentors · {pole.mentorats_actifs} actifs
        </p>
      </div>
      <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-colors ${selected ? 'text-violet-500' : 'text-slate-200'}`} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// CARTE POLITIQUE DES VILLES
// ─────────────────────────────────────────────────────────────
interface CityTip {
  x: number; y: number;
  name: string; poleName: string; etat: string;
  mentors: number; mentorats: number;
}

function VillesMapCard({ poles, geoData }: { poles: PoleData[]; geoData: unknown }) {
  const [cityTip, setCityTip] = useState<CityTip | null>(null);

  // Stats globales (overlay)
  const totalMentors  = poles.reduce((s, p) => s + p.mentors_count, 0);
  const totalClotures = poles.reduce((s, p) => s + p.mentorats_clotures, 0);
  const totalActifs   = poles.reduce((s, p) => s + p.mentorats_actifs, 0);

  // Départements couverts (fond blanc vs grille)
  const coveredDeptCodes = useMemo(() =>
    new Set(poles.flatMap(p => p.departments.map(d => d.code))),
  [poles]);

  // Marqueurs géocodés
  const markers = useMemo(() =>
    poles.flatMap(p =>
      p.villes
        .filter(v => v.lat !== null && v.lon !== null)
        .map(v => ({
          name:      v.name,
          lon:       v.lon!,
          lat:       v.lat!,
          color:     ETAT_HEX[p.etat_activite] ?? ETAT_HEX[''],
          etat:      p.etat_activite,
          poleName:  p.name,
          mentors:   p.mentors_count,
          mentorats: p.mentorats_actifs,
        }))
    ),
  [poles]);

  // Placement sans chevauchement
  const placements = useMemo(() => computePlacements(markers), [markers]);

  // Villes non géocodées + pôles sans villes
  const ungeocodedVilles = useMemo(() =>
    poles.flatMap(p => p.villes.filter(v => v.lat === null).map(v => ({ name: v.name, poleName: p.name }))),
  [poles]);
  const noVillesPoles = useMemo(() => poles.filter(p => p.villes.length === 0), [poles]);

  const totalVilles = markers.length + ungeocodedVilles.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-50">
        <h2 className="text-base font-bold text-slate-900">Présence territoriale — Villes</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {totalVilles} ville{totalVilles !== 1 ? 's' : ''} · {poles.filter(p => p.villes.length > 0).length} pôle{poles.filter(p => p.villes.length > 0).length !== 1 ? 's' : ''} actifs
        </p>
      </div>

      {/* Carte */}
      <div className="relative">
        <ComposableMap
          projection="geoConicConformal"
          projectionConfig={{ center: createCoordinates(2.5, 46.5), scale: 2800 }}
          width={800}
          height={520}
          className="w-full"
          style={{ display: 'block' }}
        >
          <defs>
            {/* Motif grille pour zones sans implantation */}
            <pattern id="ville-dot-grid" x="0" y="0" width="7" height="7" patternUnits="userSpaceOnUse">
              <circle cx="3.5" cy="3.5" r="0.85" fill="#cbd5e1" />
            </pattern>
          </defs>

          {/* Fond — blanc si couvert, grille sinon */}
          {geoData && (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <Geographies geography={geoData as any}>
              {({ geographies }) =>
                geographies.map((geo, i) => {
                  const deptCode = (geo.properties?.code as string | undefined) ?? String(i);
                  const covered  = coveredDeptCodes.has(deptCode);
                  return (
                    <Geography
                      key={i}
                      geography={geo}
                      fill={covered ? '#ffffff' : 'url(#ville-dot-grid)'}
                      stroke={covered ? '#d1d5db' : '#e2e8f0'}
                      strokeWidth={0.6}
                      style={{
                        default: { outline: 'none' },
                        hover:   { outline: 'none', fill: covered ? '#f8fafc' : 'url(#ville-dot-grid)' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          )}

          {/* Marqueurs avec labels placés sans chevauchement */}
          {markers.map((city, i) => {
            const lp = placements[i] ?? { dx: MR + MG, dy: 4, anchor: 'start' as Anchor };
            return (
              <Marker
                key={i}
                coordinates={createCoordinates(city.lon, city.lat)}
                onMouseEnter={(e: React.MouseEvent) => setCityTip({
                  x: e.clientX, y: e.clientY,
                  name: city.name, poleName: city.poleName,
                  etat: city.etat, mentors: city.mentors, mentorats: city.mentorats,
                })}
                onMouseLeave={() => setCityTip(null)}
              >
                <circle r={9}  fill={city.color} fillOpacity={0.12} />
                <circle r={MR} fill={city.color} stroke="white" strokeWidth={1.5} />
                <text
                  x={lp.dx}
                  y={lp.dy}
                  textAnchor={lp.anchor}
                  style={{
                    fontSize: '8.5px',
                    fontWeight: 700,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fill: '#0f172a',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {city.name}
                </text>
              </Marker>
            );
          })}
        </ComposableMap>

        {/* ── Overlay stats (bas gauche) ── */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/92 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm px-3 py-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Statistiques
          </p>
          <div className="space-y-1.5">
            {[
              { icon: <Users className="w-3.5 h-3.5 text-violet-500" />,   value: totalMentors,  label: 'mentors'   },
              { icon: <Archive className="w-3.5 h-3.5 text-emerald-500" />, value: totalClotures, label: 'mentorats clôturés' },
              { icon: <HandHeart className="w-3.5 h-3.5 text-sky-500" />,   value: totalActifs,   label: 'mentorats actifs'  },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                {s.icon}
                <span className="font-black text-slate-800 tabular-nums w-7 text-right">{s.value}</span>
                <span className="text-slate-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip ville */}
        {cityTip && (
          <div
            className="no-print fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-3 pointer-events-none min-w-[180px]"
            style={{ left: cityTip.x + 14, top: cityTip.y - 10, transform: 'translateY(-100%)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ETAT_HEX[cityTip.etat] ?? ETAT_HEX[''] }} />
              <p className="font-bold text-slate-900 text-sm">{cityTip.name}</p>
            </div>
            <p className="text-[10px] text-slate-500 mb-2">{cityTip.poleName}</p>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div className="text-slate-500"><span className="font-bold text-slate-800">{cityTip.mentors}</span> mentors</div>
              <div className="text-slate-500"><span className="font-bold text-slate-800">{cityTip.mentorats}</span> actifs</div>
            </div>
          </div>
        )}
      </div>

      {/* Villes non géocodées + pôles sans villes */}
      {(ungeocodedVilles.length > 0 || noVillesPoles.length > 0) && (
        <div className="px-5 pb-5 pt-4 border-t border-slate-100 space-y-3">
          {ungeocodedVilles.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Villes non localisées ({ungeocodedVilles.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ungeocodedVilles.map((v, i) => (
                  <span key={i} title={v.poleName}
                    className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg font-medium">
                    {v.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {noVillesPoles.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Pôles sans villes renseignées ({noVillesPoles.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {noVillesPoles.map(p => (
                  <span key={p.id}
                    className="text-xs px-2.5 py-1 bg-slate-50 border border-dashed border-slate-200 text-slate-400 rounded-lg font-medium">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export function ImplantationsPoles() {
  const [data, setData]                 = useState<ImplantationsData | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [geoData, setGeoData]           = useState<unknown>(_geoCache);
  const [tooltip, setTooltip]           = useState<{ x: number; y: number; deptCode: string } | null>(null);
  const [selectedPole, setSelectedPole] = useState<PoleData | null>(null);
  const [filterEtat, setFilterEtat]     = useState<string>('');
  const [showExportMenu, setShowExport] = useState(false);

  const allRef        = useRef<HTMLDivElement>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const cityRef       = useRef<HTMLDivElement>(null);
  const exportBtnRef  = useRef<HTMLDivElement>(null);

  const docDate = new Date().toISOString().slice(0, 10);

  const handlePrintAll = useReactToPrint({
    contentRef: allRef,
    documentTitle: `implantation-ora-${docDate}`,
    pageStyle: `@page { size: A4 landscape; margin: 10mm; } ${PRINT_BASE}`,
  });
  const handlePrintMap = useReactToPrint({
    contentRef: mapSectionRef,
    documentTitle: `carte-departements-ora-${docDate}`,
    pageStyle: `@page { size: A4 landscape; margin: 10mm; } ${PRINT_BASE}`,
  });
  const handlePrintCities = useReactToPrint({
    contentRef: cityRef,
    documentTitle: `carte-villes-ora-${docDate}`,
    pageStyle: `@page { size: A4 landscape; margin: 10mm; } ${PRINT_BASE}`,
  });

  useEffect(() => {
    if (!showExportMenu) return;
    const h = (e: MouseEvent) => {
      if (!exportBtnRef.current?.contains(e.target as Node)) setShowExport(false);
    };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [showExportMenu]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get<ImplantationsData>('/cn/implantations/');
      setData(res.data);
    } catch {
      setError('Erreur de chargement des données');
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
    if (!data) return {};
    const m: Record<number, PoleData> = {};
    data.poles.forEach(p => { m[p.id] = p; });
    return m;
  }, [data]);

  const hoveredPole = useMemo(() => {
    if (!tooltip || !data) return null;
    const entry = data.department_pole_map[tooltip.deptCode];
    return entry ? poleById[entry.pole_id] ?? null : null;
  }, [tooltip, data, poleById]);

  const filteredPoles = useMemo(() => {
    if (!data) return [];
    return filterEtat ? data.poles.filter(p => p.etat_activite === filterEtat) : data.poles;
  }, [data, filterEtat]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
    </div>
  );

  if (error || !data) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
      <p className="text-sm text-red-700">{error}</p>
      <button onClick={load} className="mt-3 px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
        Réessayer
      </button>
    </div>
  );

  const { stats } = data;
  const coveragePct = Math.round((stats.total_departments_covered / 96) * 100);

  const EXPORT_OPTIONS = [
    { label: 'Carte des pôles',  desc: 'Carte départementale',      fn: () => { handlePrintMap();    setShowExport(false); } },
    { label: 'Carte des villes', desc: 'Carte politique des villes', fn: () => { handlePrintCities(); setShowExport(false); } },
    { label: 'Les deux cartes',  desc: 'Document complet',           fn: () => { handlePrintAll();    setShowExport(false); } },
  ];

  return (
    <div ref={allRef} className="space-y-5">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Implantation des Pôles</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {stats.total_poles} pôle{stats.total_poles > 1 ? 's' : ''} actifs ·{' '}
            {stats.total_departments_covered} département{stats.total_departments_covered > 1 ? 's' : ''} couverts ·{' '}
            <span className="font-semibold text-violet-600">{coveragePct}% de la France</span>
          </p>
        </div>

        {/* Dropdown export */}
        <div ref={exportBtnRef} className="no-print relative">
          <button onClick={() => setShowExport(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors shrink-0">
            <Download className="w-4 h-4" />
            Exporter PDF
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 z-30 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden py-1">
              {EXPORT_OPTIONS.map(opt => (
                <button key={opt.label} onClick={opt.fn}
                  className="w-full flex flex-col items-start px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                  <span className="text-sm font-semibold text-slate-800">{opt.label}</span>
                  <span className="text-[11px] text-slate-400">{opt.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Filtres par état ───────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ETATS).filter(([k]) => k !== '').map(([key, cfg]) => {
          const count = stats.par_etat[key] ?? 0;
          if (count === 0) return null;
          return (
            <button key={key}
              onClick={() => setFilterEtat(filterEtat === key ? '' : key)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                filterEtat === key
                  ? `${cfg.badge} shadow-sm ring-2 ring-offset-1 ring-current`
                  : `${cfg.badge} opacity-70 hover:opacity-100`
              }`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
              <span className="font-black">{count}</span>
            </button>
          );
        })}
        {filterEtat && (
          <button onClick={() => setFilterEtat('')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-50">
            <X className="w-3 h-3" /> Tout
          </button>
        )}
      </div>

      {/* ── CARTE DÉPARTEMENTS ─────────────────────────────── */}
      <div ref={mapSectionRef} className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative min-h-[400px]">
          {/* Légende */}
          <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm px-3 py-2 space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Légende</p>
            {Object.entries(ETATS).filter(([k]) => k !== '').map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm shrink-0 border" style={{ background: cfg.fill, borderColor: cfg.stroke }} />
                <span className="text-[10px] text-slate-600 font-medium">{cfg.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-0.5 pt-0.5 border-t border-slate-100">
              <span className="w-3 h-3 rounded-sm shrink-0 border" style={{ background: NO_POLE.fill, borderColor: NO_POLE.stroke }} />
              <span className="text-[10px] text-slate-400">Non couvert</span>
            </div>
          </div>

          <ComposableMap
            projection="geoConicConformal"
            projectionConfig={{ center: createCoordinates(2.5, 46.5), scale: 2800 }}
            width={800} height={580}
            className="w-full" style={{ display: 'block' }}
          >
            {geoData && (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Geographies geography={geoData as any}>
                {({ geographies }) =>
                  geographies.map((geo, i) => {
                    const deptCode = (geo.properties?.code as string | undefined) ?? String(i);
                    const entry = data.department_pole_map[deptCode];
                    const pole  = entry ? poleById[entry.pole_id] : null;
                    const etat  = entry?.etat_activite ?? null;
                    const cfg   = etat ? (ETATS[etat] ?? ETATS['']) : null;
                    const dimmed     = filterEtat && etat !== filterEtat;
                    const isSelected = selectedPole && pole?.id === selectedPole.id;
                    return (
                      <Geography
                        key={deptCode} geography={geo}
                        fill={cfg ? (dimmed ? '#f1f5f9' : cfg.fill) : NO_POLE.fill}
                        stroke={isSelected ? '#4f46e5' : cfg ? cfg.stroke : NO_POLE.stroke}
                        strokeWidth={isSelected ? 2 : 0.6}
                        style={{
                          default: { outline: 'none' },
                          hover:   { fill: cfg ? cfg.fillHover : NO_POLE.fillHover, outline: 'none', cursor: pole ? 'pointer' : 'default' },
                          pressed: { outline: 'none' },
                        }}
                        onMouseMove={(e: React.MouseEvent) => setTooltip({ x: e.clientX, y: e.clientY, deptCode })}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={() => { if (pole) setSelectedPole(prev => prev?.id === pole.id ? null : pole); }}
                      />
                    );
                  })
                }
              </Geographies>
            )}
          </ComposableMap>
        </div>

        {/* Liste pôles */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: '640px' }}>
          {selectedPole ? (
            <PoleDetailPanel pole={selectedPole} onClose={() => setSelectedPole(null)} />
          ) : (
            <>
              <div className="px-4 py-3 border-b border-slate-50">
                <h3 className="text-sm font-bold text-slate-900">Pôles ({filteredPoles.length})</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {filterEtat ? `Filtrés : ${ETATS[filterEtat]?.label}` : 'Cliquer sur un pôle ou un département'}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {filteredPoles.length === 0
                  ? <div className="py-12 text-center text-slate-400"><p className="text-sm">Aucun pôle dans cet état</p></div>
                  : filteredPoles.map(pole => (
                      <PoleListItem key={pole.id} pole={pole}
                        selected={selectedPole?.id === pole.id}
                        onClick={() => setSelectedPole(prev => prev?.id === pole.id ? null : pole)} />
                    ))
                }
              </div>
              <div className="px-4 py-3 border-t border-slate-50 grid grid-cols-2 gap-2">
                {[
                  { label: 'Mentors',   value: filteredPoles.reduce((s, p) => s + p.mentors_count, 0) },
                  { label: 'Mentorats', value: filteredPoles.reduce((s, p) => s + p.mentorats_actifs, 0) },
                ].map(s => (
                  <div key={s.label} className="text-center bg-slate-50 rounded-lg py-1.5">
                    <p className="text-base font-black text-slate-800">{s.value}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── CARTE VILLES (pleine largeur) ─────────────────── */}
      <div ref={cityRef}>
        <VillesMapCard poles={data.poles} geoData={geoData} />
      </div>

      {/* Tooltip département */}
      {tooltip && (
        <DeptTooltip x={tooltip.x} y={tooltip.y} pole={hoveredPole} deptName={tooltip.deptCode} />
      )}
    </div>
  );
}
