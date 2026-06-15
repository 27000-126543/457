import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { RiskDimensions } from '@/types';

interface RiskRadarChartProps {
  current: RiskDimensions;
  threshold: number;
}

const DIMENSION_LABELS: Record<keyof RiskDimensions, string> = {
  supplierReputation: '供应商信誉',
  onTimeRate: '准时率',
  logisticsRisk: '物流风险',
  tariffCost: '关税成本',
  exchangeRateVolatility: '汇率波动',
};

const DIMENSION_KEYS = Object.keys(DIMENSION_LABELS) as (keyof RiskDimensions)[];

function buildData(current: RiskDimensions, threshold: number) {
  return DIMENSION_KEYS.map((key) => ({
    dimension: DIMENSION_LABELS[key],
    current: current[key],
    threshold,
  }));
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  color: string;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p className="text-white font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === 'current' ? '当前值' : '阈值'}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function RiskRadarChart({ current, threshold }: RiskRadarChartProps) {
  const data = buildData(current, threshold);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#1e2a5e" strokeDasharray="3 3" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: '#8892b0', fontSize: 12, fontFamily: 'Noto Sans SC' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: '#4a5568', fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          name="阈值"
          dataKey="threshold"
          stroke="#4a5568"
          fill="#4a5568"
          fillOpacity={0.15}
          strokeDasharray="5 5"
        />
        <Radar
          name="当前值"
          dataKey="current"
          stroke="#00f5d4"
          fill="#00f5d4"
          fillOpacity={0.25}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#8892b0' }}
          formatter={(value: string) => (
            <span style={{ color: value === '当前值' ? '#00f5d4' : '#4a5568' }}>{value}</span>
          )}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
