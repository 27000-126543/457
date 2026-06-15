import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { mockEmergencyPlans, mockEscalationLogs } from '@/mock/data';
import { getApprovalTypeLabel, getUrgencyLabel, formatDateTime } from '@/utils/format';
import type { Urgency } from '@/types';
import ApprovalEfficiencyChart from '@/components/charts/ApprovalEfficiencyChart';

const URGENCY_ORDER: Record<Urgency, number> = { critical: 0, urgent: 1, normal: 2 };
const URGENCY_BORDER: Record<Urgency, string> = {
  normal: 'border-l-neon-cyan',
  urgent: 'border-l-amber-warn',
  critical: 'border-l-rose-critical',
};
const URGENCY_BADGE: Record<Urgency, string> = {
  normal: 'risk-badge-normal',
  urgent: 'risk-badge-warning',
  critical: 'risk-badge-severe',
};

export default function Approval() {
  const { approvals, approveItem, rejectItem } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const isOverdue = (d: string) => now > new Date(d).getTime();
  const getCountdown = (d: string) => {
    const diff = new Date(d).getTime() - now;
    if (diff <= 0) return '已逾期';
    return `${Math.floor(diff / 3600000)}时${Math.floor((diff % 3600000) / 60000)}分`;
  };

  const pending = approvals.filter((a) => a.status === 'pending');
  const sorted = [...pending].sort(
    (a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
  );
  const selected = approvals.find((a) => a.id === selectedId) ?? null;
  const overdueCount = pending.filter((a) => isOverdue(a.deadline)).length;
  const approvedToday = approvals.filter((a) => a.status === 'approved').length;
  const relatedPlan = selected
    ? mockEmergencyPlans.find((p) => p.id === selected.planId)
    : null;
  const escalation = selected
    ? mockEscalationLogs.find((e) => e.approvalId === selected.id)
    : null;

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '待审批', value: pending.length, color: 'text-neon-cyan' },
          { label: '今日已批', value: approvedToday, color: 'text-white' },
          { label: '已逾期', value: overdueCount, color: 'text-rose-critical' },
          { label: '平均处理', value: '4.2h', color: 'text-amber-warn' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className="text-steel text-sm">{s.label}</div>
            <div className={`stat-value ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-2">
          <h2 className="section-title">待审批列表</h2>
          <AnimatePresence>
            {sorted.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => setSelectedId(item.id)}
                className={`glass-card-hover cursor-pointer border-l-4 ${URGENCY_BORDER[item.urgency]} p-4 ${
                  selectedId === item.id ? 'ring-1 ring-neon-cyan/40' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={URGENCY_BADGE[item.urgency]}>
                    {getUrgencyLabel(item.urgency)}
                  </span>
                  <span className="risk-badge-normal">
                    {getApprovalTypeLabel(item.type)}
                  </span>
                </div>
                <p className="text-sm text-white/90 mb-2 line-clamp-2">{item.summary}</p>
                <div className="flex items-center justify-between text-xs text-steel">
                  <span>成本影响: ¥{item.costImpact}万</span>
                  <span
                    className={
                      isOverdue(item.deadline) ? 'text-rose-critical animate-blink' : ''
                    }
                  >
                    {getCountdown(item.deadline)}
                  </span>
                </div>
                <div className="text-xs text-steel mt-1">审批人: {item.currentApprover}</div>
                <div className="flex gap-2 mt-3">
                  <button
                    className="btn-primary text-xs px-3 py-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      approveItem(item.id);
                    }}
                  >
                    通过
                  </button>
                  <button
                    className="btn-danger text-xs px-3 py-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      rejectItem(item.id);
                    }}
                  >
                    驳回
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="col-span-7">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-6 space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={URGENCY_BADGE[selected.urgency]}>
                  {getUrgencyLabel(selected.urgency)}
                </span>
                <span className="risk-badge-normal">
                  {getApprovalTypeLabel(selected.type)}
                </span>
                <span className="text-steel text-sm">
                  提交: {formatDateTime(selected.submittedAt)}
                </span>
              </div>
              <h3 className="text-lg text-white font-medium">{selected.summary}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-3">
                  <div className="text-steel text-xs mb-1">成本影响</div>
                  <div className="stat-value text-amber-warn text-lg">
                    ¥{selected.costImpact}万
                  </div>
                </div>
                <div className="glass-card p-3">
                  <div className="text-steel text-xs mb-1">截止时间</div>
                  <div
                    className={`font-mono text-lg ${
                      isOverdue(selected.deadline)
                        ? 'text-rose-critical animate-blink'
                        : 'text-neon-cyan'
                    }`}
                  >
                    {getCountdown(selected.deadline)}
                  </div>
                </div>
              </div>
              {relatedPlan && (
                <div className="glass-card p-4">
                  <div className="text-steel text-xs mb-2">关联应急预案</div>
                  <div className="text-white text-sm font-medium">{relatedPlan.title}</div>
                  <p className="text-steel text-xs mt-1">{relatedPlan.description}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-amber-warn">成本: ¥{relatedPlan.costImpact}万</span>
                    <span className="text-neon-cyan">
                      风险降低: {relatedPlan.riskReduction}%
                    </span>
                    <span className="text-steel">状态: {relatedPlan.status}</span>
                  </div>
                </div>
              )}
              {escalation && (
                <div className="glass-card p-3 border-l-4 border-l-amber-warn">
                  <div className="text-amber-warn text-xs">
                    升级: {escalation.fromApprover} → {escalation.toApprover}
                  </div>
                  <div className="text-steel text-xs mt-1">{escalation.reason}</div>
                </div>
              )}
              {selected.escalatedFrom && (
                <div className="text-xs text-amber-warn">原审批人: {selected.escalatedFrom}</div>
              )}
              <div className="text-xs text-steel">当前审批人: {selected.currentApprover}</div>
              <div className="flex gap-3 pt-2">
                <button className="btn-primary" onClick={() => approveItem(selected.id)}>
                  通过
                </button>
                <button className="btn-danger" onClick={() => rejectItem(selected.id)}>
                  驳回
                </button>
                <button className="btn-ghost">退回</button>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-12 flex items-center justify-center text-steel">
              请选择左侧审批项查看详情
            </div>
          )}
        </div>
      </div>

      <ApprovalEfficiencyChart />
    </div>
  );
}
