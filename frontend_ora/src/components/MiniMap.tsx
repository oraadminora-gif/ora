import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposableMap,
  createCoordinates,
  Geographies,
  Geography,
} from '@vnedyalk0v/react19-simple-maps';
import api from '../services/api';

interface ImplantationsData {
  poles: { id: number; etat_activite: string }[];
  department_pole_map: Record<string, { pole_id: number; etat_activite: string }>;
}

const ETATS: Record<string, { fill: string; stroke: string }> = {
  a_letude:    { fill: '#bae6fd', stroke: '#0284c7' },
  demarre:     { fill: '#bbf7d0', stroke: '#16a34a' },
  fragile:     { fill: '#fde68a', stroke: '#d97706' },
  experimente: { fill: '#ddd6fe', stroke: '#7c3aed' },
  arrete:      { fill: '#fecaca', stroke: '#dc2626' },
  '':          { fill: '#bfdbfe', stroke: '#3b82f6' },
};
const FILL_NONE   = '#e2e8f0';
const STROKE_NONE = '#cbd5e1';

let _geoCache: unknown = null;
let _dataCache: ImplantationsData | null = null;

export function MiniMap() {
  const navigate = useNavigate();
  const [geoData, setGeoData]   = useState<unknown>(_geoCache);
  const [data, setData]         = useState<ImplantationsData | null>(_dataCache);

  useEffect(() => {
    if (!_geoCache) {
      fetch('/departements.geojson')
        .then(r => r.json())
        .then(d => { _geoCache = d; setGeoData(d); })
        .catch(() => {});
    }
    if (!_dataCache) {
      api.get<ImplantationsData>('/public/implantations/')
        .then(r => { _dataCache = r.data; setData(r.data); })
        .catch(() => {});
    }
  }, []);

  const poleById = useMemo(() => {
    const m: Record<number, { etat_activite: string }> = {};
    data?.poles?.forEach(p => { m[p.id] = p; });
    return m;
  }, [data]);

  return (
    <button
      onClick={() => navigate('/implantations')}
      className="w-full rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:shadow-lg hover:scale-[1.01] focus:outline-none"
      aria-label="Voir la carte des implantations"
    >
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
                const entry = data?.department_pole_map[deptCode];
                const pole  = entry ? poleById[entry.pole_id] : null;
                const cfg   = (entry && pole) ? (ETATS[entry.etat_activite] ?? ETATS['']) : null;

                return (
                  <Geography
                    key={deptCode}
                    geography={geo}
                    fill={cfg ? cfg.fill : FILL_NONE}
                    stroke={cfg ? cfg.stroke : STROKE_NONE}
                    strokeWidth={0.6}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        )}

        {/* Squelette gris si GeoJSON pas encore chargé */}
        {!geoData && (
          <rect width={800} height={580} fill="#e2e8f0" rx={12} />
        )}
      </ComposableMap>
    </button>
  );
}
