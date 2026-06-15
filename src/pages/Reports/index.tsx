import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { mockDailyReport } from '@/mock/data';
import { getRiskIndexColor } from '@/utils/format';

const RANGES = [7, 30, 90] as const;

function StatCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="glass-card p-4 flex-1">
      <div className="text-steel text-xs mb-1">{label}</div>
      <div className="stat-value text-neon-cyan">{value}{unit && <span className="text-sm text-steel ml-1">{unit}</span>}</div>
    </div>
  );
}

export default function Reports() {
  const [range, setRange] = useState<number>(30);
  const { categorySummaries, trendData } = mockDailyReport;

  const filtered = useMemo(() => trendData.slice(-range), [trendData, range]);
  const totalCategories = categorySummaries.length;
  const avgOnTime = (categorySummaries.reduce((s, c) => s + c.onTimeRate, 0) / totalCategories).toFixed(1);
  const avgCostDev = (categorySummaries.reduce((s, c) => s + c.costDeviation, 0) / totalCategories).toFixed(1);
  const totalRisk = categorySummaries.reduce((s, c) => s + c.riskEventCount, 0);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex items-center gap-4">
        <input type="date" defaultValue={mockDailyReport.date} className="input-field w-48" />
        <h2 className="section-title">日报概览</h2>
      </div>

      <div className="flex gap-3">
        <StatCard label="品类数" value={totalCategories} />
        <StatCard label="平均准时率" value={avgOnTime} unit="%" />
        <StatCard label="平均成本偏差" value={avgCostDev} unit="%" />
        <StatCard label="风险事件总数" value={totalRisk} />
      </div>

      <div className="glass-card p-4">
        <h3 className="section-title mb-3">品类汇总</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-steel text-xs">
                <th className="text-left py-2 px-3">品类</th>
                <th className="text-left py-2 px-3">准时交付率</th>
                <th className="text-left py-2 px-3">成本偏差</th>
                <th className="text-left py-2 px-3">风险事件数</th>
                <th className="text-left py-2 px-3">平均处理时长</th>
              </tr>
            </thead>
            <tbody>
              {categorySummaries.map(c => (
                <tr key={c.category} className="border-t border-deep-border/30">
                  <td className="py-2 px-3 text-white">{c.category}</td>
                  <td className={`py-2 px-3 font-mono ${c.onTimeRate < 80 ? 'text-rose-critical' : c.onTimeRate < 85 ? 'text-amber-warn' : 'text-neon-cyan'}`}>{c.onTimeRate}%</td>
                  <td className="py-2 px-3 font-mono text-amber-warn">{c.costDeviation}%</td>
                  <td className="py-2 px-3 font-mono" style={{ color: getRiskIndexColor(c.riskEventCount * 20 + 40) }}>{c.riskEventCount}</td>
                  <td className="py-2 px-3 font-mono text-steel">{c.avgResolutionTime > 0 ? `${c.avgResolutionTime}h` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">趋势分析</h3>
          <div className="flex gap-2">
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-lg text-xs transition-all ${range === r ? 'btn-primary' : 'btn-ghost'}`}>{r}天</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'onTimeRate', label: '准时率趋势', color: '#00f5d4' },
            { key: 'costDeviation', label: '成本偏差趋势', color: '#ff6b35' },
            { key: 'riskEvents', label: '风险事件趋势', color: '#f72585' },
          ].map(chart => (
            <div key={chart.key}>
              <div className="text-xs text-steel mb-2 text-center">{chart.label}</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={filtered}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8892b0' }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: '#8892b0' }} width={36} />
                  <Tooltip contentStyle={{ background: '#111640', border: '1px solid #1e2a5e', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn-primary" onClick={() => alert('导出PDF功能开发中')}>导出PDF</button>
        <button className="btn-ghost" onClick={() => alert('导出Excel功能开发中')}>导出Excel</button>
      </div>
    </div>
  );
}
