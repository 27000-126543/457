import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { RiskTrendPoint } from '@/types';

interface RiskTrendChartProps {
  data: RiskTrendPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 min-w-[160px]">
      <p className="text-steel text-xs mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
          <span className="text-steel">
            {entry.dataKey === 'riskIndex' ? '风险指数' : '告警数'}
          </span>
          <span className="font-mono font-bold" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RiskTrendChart({ data }: RiskTrendChartProps) {
  return (
    <div className="glass-card p-5 h-full">
      <h3 className="section-title mb-4">风险趋势 (30天)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f5d4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00f5d4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f72585" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f72585" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#8892b0', fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
            stroke="#1e2a5e"
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#8892b0', fontSize: 11 }}
            stroke="#1e2a5e"
            domain={[40, 100]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#8892b0', fontSize: 11 }}
            stroke="#1e2a5e"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="riskIndex"
            stroke="#00f5d4"
            strokeWidth={2}
            fill="url(#riskGradient)"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="alertCount"
            stroke="#f72585"
            strokeWidth={1.5}
            fill="url(#alertGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
