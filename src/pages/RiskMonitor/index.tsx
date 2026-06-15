import { useState } from 'react';
import { motion } from 'framer-motion';
import { mockRiskPaths, mockThresholds } from '@/mock/data';
import type { RiskPath, ThresholdConfig, RiskLevel } from '@/types';
import { getLevelLabel, getLevelBadgeClass, getRiskIndexColor } from '@/utils/format';
import RiskRadarChart from '@/components/charts/RiskRadarChart';

const DIM_ITEMS: { key: keyof RiskPath['dimensions']; label: string; weight: number }[] = [
  { key: 'supplierReputation', label: '供应商信誉', weight: 20 },
  { key: 'onTimeRate', label: '准时率', weight: 25 },
  { key: 'logisticsRisk', label: '物流风险', weight: 20 },
  { key: 'tariffCost', label: '关税成本', weight: 20 },
  { key: 'exchangeRateVolatility', label: '汇率波动', weight: 15 },
];

function PathCard({ path, selected, onClick }: { path: RiskPath; selected: boolean; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`glass-card-hover cursor-pointer p-4 ${selected ? 'border-neon-cyan/60 shadow-[0_0_20px_rgba(0,245,212,0.2)]' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white truncate mr-2">{path.name}</span>
        <span className={getLevelBadgeClass(path.status)}>{getLevelLabel(path.status)}</span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <span className="stat-value text-lg" style={{ color: getRiskIndexColor(path.compositeIndex) }}>
          {path.compositeIndex}
        </span>
        <span className="text-xs text-steel">/ 阈值 {path.threshold}</span>
      </div>
      <div className="h-2 rounded-full bg-deep-bg/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(path.compositeIndex, 100)}%`,
            background: `linear-gradient(90deg, ${getRiskIndexColor(path.compositeIndex)}88, ${getRiskIndexColor(path.compositeIndex)})`,
          }}
        />
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
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dimensions[key]}%` }}
              transition={{ duration: 0.6 }}
              className="h-full rounded-full"
              style={{ background: getRiskIndexColor(dimensions[key]) }}
            />
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
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
          className="absolute h-full rounded-full" style={{ background: getRiskIndexColor(value) }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-white/80"
          style={{ left: `${threshPct}%` }}
        />
      </div>
    </div>
  );
}

function ThresholdTable({ configs, onChange }: { configs: ThresholdConfig[]; onChange: (i: number, field: keyof ThresholdConfig, v: number) => void }) {
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
                  <input
                    type="number"
                    value={c[field]}
                    onChange={(e) => onChange(i, field, Number(e.target.value))}
                    className="input-field w-16 text-center text-xs mx-auto"
                  />
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
  const [riskPaths, setRiskPaths] = useState<RiskPath[]>(mockRiskPaths);
  const selected = riskPaths.find((p) => p.id === selectedId) ?? riskPaths[0];

  const calcStatus = (index: number, threshold: number, config: ThresholdConfig | undefined): RiskLevel => {
    if (!config) {
      if (index >= threshold + 15) return 'critical';
      if (index >= threshold) return 'severe';
      if (index >= threshold - 10) return 'warning';
      return 'normal';
    }
    if (index >= config.critical) return 'critical';
    if (index >= config.severe) return 'severe';
    if (index >= config.warning) return 'warning';
    return 'normal';
  };

  const calcThreshold = (category: string, configs: ThresholdConfig[]): number => {
    const config = configs.find((c) => c.category === category);
    return config ? config.severe : 70;
  };

  const extractCategory = (pathName: string): string => {
    const match = pathName.match(/\s(\S+?)供应链$/);
    return match ? match[1] : '';
  };

  const handleThresholdChange = (i: number, field: keyof ThresholdConfig, v: number) => {
    const updatedConfigs = thresholds.map((c, idx) => idx === i ? { ...c, [field]: v } : c);
    setThresholds(updatedConfigs);
    const category = updatedConfigs[i].category;
    const updatedConfig = updatedConfigs[i];
    setRiskPaths((prev) =>
      prev.map((p) => {
        const pathCategory = extractCategory(p.name);
        if (pathCategory !== category) return p;
        const newThreshold = calcThreshold(category, updatedConfigs);
        const newStatus = calcStatus(p.compositeIndex, newThreshold, updatedConfig);
        return { ...p, threshold: newThreshold, status: newStatus };
      })
    );
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6">
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
        <h3 className="section-title mb-4">阈值配置</h3>
        <ThresholdTable configs={thresholds} onChange={handleThresholdChange} />
      </div>
    </div>
  );
}
