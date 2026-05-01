import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposableMap,
  createCoordinates,
  Geographies,
  Geography,
} from '@vnedyalk0v/react19-simple-maps';

// Départements couverts par ORA — données statiques, aucun appel API
// Répartition plausible sur ~25 pôles actifs
const COVERED: Record<string, { fill: string; stroke: string }> = {
  // Bretagne
  '29': { fill: '#bbf7d0', stroke: '#16a34a' },
  '35': { fill: '#bbf7d0', stroke: '#16a34a' },
  '22': { fill: '#bae6fd', stroke: '#0284c7' },
  '56': { fill: '#bbf7d0', stroke: '#16a34a' },
  // Pays de la Loire
  '44': { fill: '#bbf7d0', stroke: '#16a34a' },
  '85': { fill: '#bae6fd', stroke: '#0284c7' },
  '49': { fill: '#bbf7d0', stroke: '#16a34a' },
  // Normandie
  '14': { fill: '#bae6fd', stroke: '#0284c7' },
  '76': { fill: '#fde68a', stroke: '#d97706' },
  // Hauts-de-France
  '59': { fill: '#ddd6fe', stroke: '#7c3aed' },
  '62': { fill: '#ddd6fe', stroke: '#7c3aed' },
  // Île-de-France
  '75': { fill: '#ddd6fe', stroke: '#7c3aed' },
  '77': { fill: '#ddd6fe', stroke: '#7c3aed' },
  '93': { fill: '#ddd6fe', stroke: '#7c3aed' },
  // Grand Est
  '67': { fill: '#fde68a', stroke: '#d97706' },
  '57': { fill: '#bae6fd', stroke: '#0284c7' },
  '54': { fill: '#fde68a', stroke: '#d97706' },
  '52': { fill: '#bae6fd', stroke: '#0284c7' },
  // Auvergne-Rhône-Alpes
  '69': { fill: '#bbf7d0', stroke: '#16a34a' },
  '01': { fill: '#bbf7d0', stroke: '#16a34a' },
  '38': { fill: '#fde68a', stroke: '#d97706' },
  '73': { fill: '#bae6fd', stroke: '#0284c7' },
  '74': { fill: '#fde68a', stroke: '#d97706' },
  // PACA
  '13': { fill: '#bbf7d0', stroke: '#16a34a' },
  '83': { fill: '#bae6fd', stroke: '#0284c7' },
  '84': { fill: '#fde68a', stroke: '#d97706' },
  // Occitanie
  '34': { fill: '#bbf7d0', stroke: '#16a34a' },
  '31': { fill: '#fde68a', stroke: '#d97706' },
  '30': { fill: '#bae6fd', stroke: '#0284c7' },
  '66': { fill: '#ddd6fe', stroke: '#7c3aed' },
  // Nouvelle-Aquitaine
  '33': { fill: '#fde68a', stroke: '#d97706' },
  '47': { fill: '#bae6fd', stroke: '#0284c7' },
  '64': { fill: '#bbf7d0', stroke: '#16a34a' },
  '87': { fill: '#bae6fd', stroke: '#0284c7' },
};

const FILL_NONE   = '#334155';
const STROKE_NONE = '#475569';

let _geoCache: unknown = null;

export function StaticMiniMap() {
  const navigate = useNavigate();
  const [geoData, setGeoData] = useState<unknown>(_geoCache);

  useEffect(() => {
    if (_geoCache) return;
    fetch('/departements.geojson')
      .then(r => r.json())
      .then(d => { _geoCache = d; setGeoData(d); })
      .catch(() => {});
  }, []);

  return (
    <button
      onClick={() => navigate('/implantations')}
      className="w-full rounded-2xl overflow-hidden hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
      aria-label="Voir la carte des implantations"
    >
      <ComposableMap
        projection="geoConicConformal"
        projectionConfig={{ center: createCoordinates(2.5, 46.5), scale: 2800 }}
        width={800}
        height={460}
        style={{ display: 'block', background: 'transparent' }}
      >
        {geoData && (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <Geographies geography={geoData as any}>
            {({ geographies }) =>
              geographies.map((geo, i) => {
                const code = (geo.properties?.code as string | undefined) ?? String(i);
                const cfg  = COVERED[code] ?? null;

                return (
                  <Geography
                    key={code}
                    geography={geo}
                    fill={cfg ? cfg.fill : FILL_NONE}
                    stroke={cfg ? cfg.stroke : STROKE_NONE}
                    strokeWidth={cfg ? 0.8 : 0.5}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', opacity: 0.85 },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        )}
        {!geoData && (
          <rect width={800} height={580} fill="#334155" rx={12} />
        )}
      </ComposableMap>
    </button>
  );
}
