import { useState } from 'react';
import { motion } from 'framer-motion';
import { mockRiskEvents } from '@/mock/data';
import type { RiskEvent } from '@/types';
import { getRiskIndexColor, formatDate } from '@/utils/format';

const FIELDS = ['日期', '供应商', '风险类型', '严重程度', '处置方案', '处理时长'] as const;

function getField(event: RiskEvent, field: string): string {
  switch (field) {
    case '日期': return event.date;
    case '供应商': return event.supplier;
    case '风险类型': return event.riskType;
    case '严重程度': return String(event.severity);
    case '处置方案': return event.resolution;
    case '处理时长': return event.resolutionTime > 0 ? `${event.resolutionTime}h` : '-';
    default: return '';
  }
}

const POSITIONS = [
  { x: 50, y: 50 },
  { x: 20, y: 20 }, { x: 80, y: 20 }, { x: 20, y: 80 },
  { x: 80, y: 80 }, { x: 50, y: 15 }, { x: 50, y: 85 },
];

export default function Analysis() {
  const [selected, setSelected] = useState<RiskEvent>(mockRiskEvents[0]);
  const related = mockRiskEvents.filter(e => selected.relatedEvents.includes(e.id));
  const historical = related[0];

  return (
    <div className="flex gap-4 h-full">
      <div className="w-80 shrink-0 flex flex-col gap-3 overflow-y-auto pr-2">
        <h2 className="section-title">风险事件列表</h2>
        {mockRiskEvents.map(evt => (
          <motion.div
            key={evt.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelected(evt)}
            className={`glass-card-hover p-3 cursor-pointer ${selected.id === evt.id ? 'border-neon-cyan shadow-[0_0_15px_rgba(0,245,212,0.2)]' : ''}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-steel">{formatDate(evt.date)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                evt.resolution === '已完成' ? 'bg-neon-cyan/20 text-neon-cyan' :
                evt.resolution === '执行中' ? 'bg-rose-critical/20 text-rose-critical' :
                'bg-amber-warn/20 text-amber-warn'
              }`}>{evt.resolution}</span>
            </div>
            <div className="text-sm font-medium text-white mb-1">{evt.supplier}</div>
            <div className="text-xs text-steel mb-2">{evt.riskType}</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-deep-bg rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${evt.severity}%`, backgroundColor: getRiskIndexColor(evt.severity) }} />
              </div>
              <span className="text-xs font-mono" style={{ color: getRiskIndexColor(evt.severity) }}>{evt.severity}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="glass-card p-4 flex-1">
          <h3 className="section-title mb-3">事件关联网络</h3>
          <div className="relative w-full h-full min-h-[260px]">
            <svg className="absolute inset-0 w-full h-full">
              {related.map((_, i) => (
                <line key={i} x1={`${POSITIONS[0].x}%`} y1={`${POSITIONS[0].y}%`} x2={`${POSITIONS[i + 1].x}%`} y2={`${POSITIONS[i + 1].y}%`} stroke="#1e2a5e" strokeWidth="1" strokeDasharray="4 4" />
              ))}
            </svg>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute w-16 h-16 rounded-full bg-neon-cyan/30 border-2 border-neon-cyan shadow-[0_0_20px_rgba(0,245,212,0.4)] flex items-center justify-center text-xs text-neon-cyan font-medium text-center leading-tight"
              style={{ left: `calc(${POSITIONS[0].x}% - 32px)`, top: `calc(${POSITIONS[0].y}% - 32px)` }}
            >{selected.riskType}</motion.div>
            {related.map((evt, i) => (
              <motion.div
                key={evt.id}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 * (i + 1) }}
                className="absolute w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-medium text-center leading-tight"
                style={{
                  left: `calc(${POSITIONS[i + 1].x}% - 24px)`, top: `calc(${POSITIONS[i + 1].y}% - 24px)`,
                  backgroundColor: `${getRiskIndexColor(evt.severity)}20`, border: `1.5px solid ${getRiskIndexColor(evt.severity)}`,
                }}
              >{evt.riskType}</motion.div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="section-title mb-3">对比报告</h3>
          {historical ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-steel text-xs">
                  <th className="text-left py-2 px-3">字段</th>
                  <th className="text-left py-2 px-3">当前事件</th>
                  <th className="text-left py-2 px-3">历史事件</th>
                </tr>
              </thead>
              <tbody>
                {FIELDS.map(field => {
                  const cur = getField(selected, field);
                  const his = getField(historical, field);
                  const diff = cur !== his;
                  return (
                    <tr key={field} className="border-t border-deep-border/30">
                      <td className="py-2 px-3 text-steel">{field}</td>
                      <td className={`py-2 px-3 ${diff ? 'bg-amber-warn/10 text-amber-warn' : 'text-white'}`}>{cur}</td>
                      <td className={`py-2 px-3 ${diff ? 'bg-amber-warn/10 text-amber-warn' : 'text-white'}`}>{his}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-steel text-sm text-center py-6">选择有关联历史事件的风险事件查看对比</div>
          )}
        </div>
      </div>
    </div>
  );
}
