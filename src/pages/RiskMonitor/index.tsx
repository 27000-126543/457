import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { mockRiskPaths, mockThresholds, mockThresholdHistory, mockThresholdVersions } from '@/mock/data';
import type { RiskPath, ThresholdConfig, RiskLevel, ThresholdChangeRecord } from '@/types';
import { getLevelLabel, getLevelBadgeClass, getRiskIndexColor, formatDateTime, formatDate } from '@/utils/format';
import RiskRadarChart from '@/components/charts/RiskRadarChart';

const DIM_ITEMS: { key: keyof RiskPath['dimensions']; label: string; weight: number }[] = [
  { key: 'supplierReputation', label: '供应商信誉', weight: 20 },
  { key: 'onTimeRate', label: '准时率', weight: 25 },
  { key: 'logisticsRisk', label: '物流风险', weight: 20 },
  { key: 'tariffCost', label: '关税成本', weight: 20 },
  { key: 'exchangeRateVolatility', label: '汇率波动', weight: 15 },
];

const FIELD_LABEL: Record<'warning' | 'severe' | 'critical', string> = { warning: '预警', severe: '严重', critical: '紧急' };

function calcStatus(index: number, config: ThresholdConfig | undefined): RiskLevel {
  if (!config) {
    if (index >= 85) return 'critical';
    if (index >= 70) return 'severe';
    if (index >= 60) return 'warning';
    return 'normal';
  }
  if (index >= config.critical) return 'critical';
  if (index >= config.severe) return 'severe';
  if (index >= config.warning) return 'warning';
  return 'normal';
}

function extractCategory(pathName: string): string {
  const match = pathName.match(/\s(\S+?)供应链$/);
  return match ? match[1] : '';
}

function computePaths(configs: ThresholdConfig[]): RiskPath[] {
  return mockRiskPaths.map((p) => {
    const pathCategory = extractCategory(p.name);
    const config = configs.find((c) => c.category === pathCategory);
    const newThreshold = config ? config.severe : 70;
    return { ...p, threshold: newThreshold, status: calcStatus(p.compositeIndex, config) };
  });
}

function PathCard({ path, selected, onClick }: { path: RiskPath; selected: boolean; onClick: () => void }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} onClick={onClick}
      className={`glass-card-hover cursor-pointer p-4 ${selected ? 'border-neon-cyan/60 shadow-[0_0_20px_rgba(0,245,212,0.2)]' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white truncate mr-2">{path.name}</span>
        <span className={getLevelBadgeClass(path.status)}>{getLevelLabel(path.status)}</span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <span className="stat-value text-lg" style={{ color: getRiskIndexColor(path.compositeIndex) }}>{path.compositeIndex}</span>
        <span className="text-xs text-steel">/ 阈值 {path.threshold}</span>
      </div>
      <div className="h-2 rounded-full bg-deep-bg/60 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{
          width: `${Math.min(path.compositeIndex, 100)}%`,
          background: `linear-gradient(90deg, ${getRiskIndexColor(path.compositeIndex)}88, ${getRiskIndexColor(path.compositeIndex)})`,
        }} />
      </div>
    </motion.div>
  );
}

function DimensionBars({ dimensions }: { dimensions: RiskPath['dimensions'] }) {
  return (
    <div className="space-y-3">
      {DIM_ITEMS.map(({ key, label, weight }) => (
        <div key={key}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-steel">{label}</span>
            <div className="flex gap-3">
              <span className="text-white font-mono">{dimensions[key]}</span>
              <span className="text-slate-dim">权重 {weight}%</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-deep-bg/60 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${dimensions[key]}%` }} transition={{ duration: 0.6 }}
              className="h-full rounded-full" style={{ background: getRiskIndexColor(dimensions[key]) }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ThresholdGauge({ value, threshold }: { value: number; threshold: number }) {
  const pct = Math.min((value / 100) * 100, 100);
  const threshPct = Math.min((threshold / 100) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: getRiskIndexColor(value) }} className="font-mono font-bold">当前 {value}</span>
        <span className="text-slate-dim">阈值 {threshold}</span>
      </div>
      <div className="relative h-3 rounded-full bg-deep-bg/60 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
          className="absolute h-full rounded-full" style={{ background: getRiskIndexColor(value) }} />
        <div className="absolute top-0 h-full w-0.5 bg-white/80" style={{ left: `${threshPct}%` }} />
      </div>
    </div>
  );
}

function ThresholdTable({ configs, onChange, readOnly }: { configs: ThresholdConfig[]; onChange?: (i: number, field: 'warning' | 'severe' | 'critical', v: number) => void; readOnly?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-steel text-xs border-b border-deep-border/50">
            <th className="py-2 text-left">品类</th>
            <th className="py-2 text-center">预警</th>
            <th className="py-2 text-center">严重</th>
            <th className="py-2 text-center">紧急</th>
          </tr>
        </thead>
        <tbody>
          {configs.map((c, i) => (
            <tr key={c.category} className="border-b border-deep-border/30">
              <td className="py-2 text-white">{c.category}</td>
              {(['warning', 'severe', 'critical'] as const).map((field) => (
                <td key={field} className="py-2 text-center">
                  <input type="number" value={c[field]} disabled={readOnly}
                    onChange={(e) => onChange?.(i, field, Number(e.target.value))}
                    className={`input-field w-16 text-center text-xs mx-auto ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RiskMonitor() {
  const [selectedId, setSelectedId] = useState(mockRiskPaths[0].id);
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>(mockThresholds);
  const [history, setHistory] = useState<ThresholdChangeRecord[]>(mockThresholdHistory);
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);

  const displayConfigs = useMemo(() => {
    if (viewingVersionId) {
      const v = mockThresholdVersions.find((x) => x.id === viewingVersionId);
      return v ? v.configs : thresholds;
    }
    return thresholds;
  }, [viewingVersionId, thresholds]);

  const riskPaths = useMemo(() => computePaths(displayConfigs), [displayConfigs]);
  const selected = riskPaths.find((p) => p.id === selectedId) ?? riskPaths[0];
  const viewingVersion = viewingVersionId ? mockThresholdVersions.find((v) => v.id === viewingVersionId) : null;

  const handleThresholdChange = (i: number, field: 'warning' | 'severe' | 'critical', v: number) => {
    if (viewingVersionId) return;
    const oldValue = thresholds[i][field];
    if (oldValue === v) return;
    const updatedConfigs = thresholds.map((c, idx) => idx === i ? { ...c, [field]: v } : c);
    setThresholds(updatedConfigs);
    setHistory((prev) => [{
      id: `TH${Date.now()}`,
      category: updatedConfigs[i].category,
      field: field,
      oldValue: oldValue,
      newValue: v,
      operator: '当前用户',
      changedAt: new Date().toISOString(),
    }, ...prev]);
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      {viewingVersion && (
        <div className="glass-card p-3 flex items-center justify-between border border-blue-500/50 bg-blue-500/10">
          <span className="text-sm text-blue-300">
            正在查看历史版本 <span className="font-bold text-white">{viewingVersion.id}</span> - {viewingVersion.name} ({formatDate(viewingVersion.createdAt)})
          </span>
          <button className="btn-ghost text-xs" onClick={() => setViewingVersionId(null)}>返回当前版本</button>
        </div>
      )}
      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-80 flex-shrink-0 space-y-3 overflow-y-auto pr-1">
          <h2 className="section-title">风险路径列表</h2>
          {riskPaths.map((p) => (
            <PathCard key={p.id} path={p} selected={p.id === selectedId} onClick={() => setSelectedId(p.id)} />
          ))}
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto">
          <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-5">
              <h3 className="section-title mb-4">多维风险雷达</h3>
              <RiskRadarChart current={selected.dimensions} threshold={selected.threshold} />
            </div>
            <div className="glass-card p-5">
              <h3 className="section-title mb-4">风险指标计算</h3>
              <DimensionBars dimensions={selected.dimensions} />
              <div className="mt-5">
                <h4 className="text-sm text-steel mb-2">阈值对比</h4>
                <ThresholdGauge value={selected.compositeIndex} threshold={selected.threshold} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="glass-card p-5 flex-shrink-0">
        <h3 className="section-title mb-4">{viewingVersionId ? '历史阈值配置（只读）' : '阈值配置'}</h3>
        <ThresholdTable configs={displayConfigs} onChange={handleThresholdChange} readOnly={!!viewingVersionId} />
      </div>
      <div className="glass-card p-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setHistoryCollapsed(!historyCollapsed)}>
          <h3 className="section-title mb-0">阈值修改历史与版本管理</h3>
          <span className="text-xs text-steel">{historyCollapsed ? '展开 ▼' : '收起 ▲'}</span>
        </div>
        {!historyCollapsed && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-white mb-3">修改历史记录</h4>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-deep-bg/90">
                    <tr className="text-steel border-b border-deep-border/50">
                      <th className="py-2 text-left">时间</th>
                      <th className="py-2 text-left">品类</th>
                      <th className="py-2 text-left">字段</th>
                      <th className="py-2 text-left">变更</th>
                      <th className="py-2 text-left">操作人</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r) => (
                      <tr key={r.id} className="border-b border-deep-border/30">
                        <td className="py-2 text-slate-dim whitespace-nowrap">{formatDateTime(r.changedAt)}</td>
                        <td className="py-2 text-white">{r.category}</td>
                        <td className="py-2 text-steel">{FIELD_LABEL[r.field]}</td>
                        <td className="py-2">
                          <span className="text-slate-dim">{r.oldValue}</span>
                          <span className="mx-1 text-steel">→</span>
                          <span className={r.newValue > r.oldValue ? 'text-neon-cyan font-mono' : 'text-amber-warn font-mono'}>{r.newValue}</span>
                        </td>
                        <td className="py-2 text-slate-dim">{r.operator}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-3">版本管理</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mockThresholdVersions.map((v) => (
                  <div key={v.id} className={`p-3 rounded-lg border ${viewingVersionId === v.id ? 'border-neon-cyan/60 bg-neon-cyan/5' : 'border-deep-border/50 bg-deep-bg/30'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{v.id}</span>
                        <span className="text-steel text-xs">{v.name}</span>
                      </div>
                      <button className="btn-ghost text-xs" onClick={() => setViewingVersionId(v.id)}>回看</button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-dim">
                      <span>{formatDate(v.createdAt)}</span>
                      <span>{v.operator}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
