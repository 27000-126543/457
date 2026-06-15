import { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { motion } from 'framer-motion';
import type { MapDataPoint } from '@/types';
import { getRiskIndexColor } from '@/utils/format';

interface RiskMapProps {
  data: MapDataPoint[];
}

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export default function RiskMap({ data }: RiskMapProps) {
  const [tooltip, setTooltip] = useState<{ name: string; risk: number; x: number; y: number } | null>(null);

  function getMarkerSize(risk: number): number {
    if (risk >= 80) return 8;
    if (risk >= 65) return 6;
    if (risk >= 50) return 5;
    return 4;
  }

  return (
    <div className="glass-card p-5 relative">
      <h3 className="section-title mb-4">全球风险分布</h3>
      <div className="relative">
        <ComposableMap
          projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#111640"
                  stroke="#1e2a5e"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: '#1a2050', outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
          {data.map((point) => {
            const color = getRiskIndexColor(point.riskLevel);
            const size = getMarkerSize(point.riskLevel);
            return (
              <Marker key={point.supplierId} coordinates={point.coordinates as [number, number]}>
                <circle
                  r={size}
                  fill={color}
                  stroke={color}
                  strokeWidth={1}
                  fillOpacity={0.7}
                  strokeOpacity={0.4}
                  onMouseEnter={(e) => {
                    const rect = (e.target as SVGCircleElement).getBoundingClientRect();
                    setTooltip({ name: point.name, risk: point.riskLevel, x: rect.left, y: rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: 'pointer' }}
                />
              </Marker>
            );
          })}
        </ComposableMap>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed z-50 glass-card px-3 py-2 pointer-events-none"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
          >
            <p className="text-white text-sm font-medium">{tooltip.name}</p>
            <p className="text-xs font-mono" style={{ color: getRiskIndexColor(tooltip.risk) }}>
              风险指数: {tooltip.risk}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
