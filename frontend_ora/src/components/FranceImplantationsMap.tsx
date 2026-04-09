import { useState, useEffect } from 'react';
import {
  ComposableMap,
  createCoordinates,
  Geographies,
  Geography,
} from "@vnedyalk0v/react19-simple-maps";

type Implantation = {
  code: string;
  department: string;
  city: string;
  email: string;
};

// Cache module-level so the file is fetched only once across renders
let _geoCache: unknown = null;

export function FranceImplantationsMap({
  implantations,
  hoveredCode,
}: {
  implantations: Implantation[];
  hoveredCode?: string;
}) {
  const [geoData, setGeoData] = useState<unknown>(_geoCache);
  const activeDepartments = implantations.map((i) => i.code);

  useEffect(() => {
    if (_geoCache) { setGeoData(_geoCache); return; }
    fetch('/departements.geojson')
      .then(r => r.json())
      .then(d => { _geoCache = d; setGeoData(d); })
      .catch(() => {});
  }, []);

  if (!geoData) return null;

  return (
    <ComposableMap
      projection="geoConicConformal"
      projectionConfig={{
        center: createCoordinates(2.5, 46.5),
        scale: 2500,
      }}
      className="w-full max-w-lg mx-auto"
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Geographies geography={geoData as any}>
        {({ geographies }) =>
          geographies.map((geo, i) => {
            const code = (geo.properties?.code as string | undefined) ?? String(i);
            const isActive = activeDepartments.includes(code);

            return (
              <Geography
                key={code}
                geography={geo}
                fill={
                  code === hoveredCode
                    ? "#1d4ed8"
                    : isActive
                    ? "#3b82f6"
                    : "#e2e8f0"
                }
                stroke="#ffffff"
                strokeWidth={0.6}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
}
