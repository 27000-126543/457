import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { getApprovalTypeLabel, getUrgencyLabel, formatDateTime } from '@/utils/format';
import type { Urgency, ApprovalFlowRecord } from '@/types';
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

const ACTION_LABEL: Record<ApprovalFlowRecord['action'], string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  escalated: '已升级',
};

const ACTION_COLOR: Record<ApprovalFlowRecord['action'], string> = {
  pending: 'text-neon-cyan',
  approved: 'text-emerald-400',
  rejected: 'text-rose-critical',
  escalated: 'text-amber-warn',
};

const ACTION_DOT: Record<ApprovalFlowRecord['action'], string> = {
  pending: 'bg-neon-cyan',
  approved: 'bg-emerald-400',
  rejected: 'bg-rose-critical',
  escalated: 'bg-amber-warn',
};

export default function Approval() {
  const {
    approvals, flowRecords, escalationLogs, emergencyPlans,
    approveItem, rejectItem, checkAndEscalate, finalizeApproval,
  } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    checkAndEscalate();
    const t = setInterval(() => {
      setNow(Date.now());
      checkAndEscalate();
    }, 30000);
    return () => clearInterval(t);
  }, [checkAndEscalate]);

  const isOverdue = (d: string) => now > new Date(d).getTime();
  const getCountdown = (d: string) => {
    const diff = new Date(d).getTime() - now;
    if (diff <= 0) return '已逾期';
    return `${Math.floor(diff / 3600000)}时${Math.floor((diff % 3600000) / 60000)}分`;
  };

  const pending = approvals.filter((a) => a.status === 'pending' || a.status === 'escalated');
  const sorted = [...pending].sort(
    (a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
  );
  const selected = approvals.find((a) => a.id === selectedId) ?? null;
  const overdueCount = pending.filter((a) => isOverdue(a.deadline)).length;
  const approvedToday = approvals.filter((a) => a.status === 'approved').length;
  const relatedPlan = selected
    ? emergencyPlans.find((p) => p.id === selected.planId)
    : null;
  const showFinalizeButtons = selected && relatedPlan
    ? selected.type === 'legal_review' && selected.status === 'approved' && relatedPlan.status === 'under_review'
    : false;

  const planFlowRecords = selected
    ? approvals
        .filter((a) => a.planId === selected.planId)
        .flatMap((a) => flowRecords.filter((fr) => fr.approvalId === a.id))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  const nextPendingApproval = selected
    ? approvals.find(
        (a) =>
          a.planId === selected.planId &&
          a.id !== selected.id &&
          (a.status === 'pending' || a.status === 'escalated')
      )
    : null;

  const selectedEscalations = selected
    ? escalationLogs.filter((e) => e.approvalId === selected.id)
    : [];

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
                  {item.status === 'escalated' && (
                    <span className="risk-badge-warning">已升级</span>
                  )}
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
              className="glass-card p-6 space-y-4 max-h-[calc(100vh-340px)] overflow-y-auto pr-2"
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
                {selected.status === 'escalated' && (
                  <span className="risk-badge-warning">已升级</span>
                )}
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
              {selectedEscalations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-steel text-xs">升级记录</div>
                  {selectedEscalations.map((e) => (
                    <div
                      key={e.id}
                      className="glass-card p-3 border-l-4 border-l-amber-warn"
                    >
                      <div className="text-amber-warn text-xs">
                        升级: {e.fromApprover} → {e.toApprover}
                      </div>
                      <div className="text-steel text-xs mt-1">{e.reason}</div>
                      <div className="text-steel text-xs mt-1">
                        时间: {formatDateTime(e.escalatedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {nextPendingApproval && (
                <div className="glass-card p-3 border-l-4 border-l-neon-cyan">
                  <div className="text-neon-cyan text-xs">下一待审批</div>
                  <div className="text-white text-sm mt-1">
                    {getApprovalTypeLabel(nextPendingApproval.type)} - {nextPendingApproval.currentApprover}
                  </div>
                  <div className="text-steel text-xs mt-1">
                    截止: {formatDateTime(nextPendingApproval.deadline)}
                  </div>
                </div>
              )}
              {selected.escalatedFrom && (
                <div className="text-xs text-amber-warn">原审批人: {selected.escalatedFrom}</div>
              )}
              <div className="text-xs text-steel">当前审批人: {selected.currentApprover}</div>
              {showFinalizeButtons && selected && (
                <div className="p-4 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                  <p className="text-sm text-white font-medium mb-3">终审已通过，请选择下一步</p>
                  <div className="flex gap-3">
                    <button
                      className="btn-ghost flex-1"
                      onClick={() => finalizeApproval(selected.id, 'approved')}
                    >
                      标记为已批准
                    </button>
                    <button
                      className="btn-primary flex-1"
                      onClick={() => finalizeApproval(selected.id, 'executing')}
                    >
                      直接启动执行
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button className="btn-primary" onClick={() => approveItem(selected.id)}>
                  通过
                </button>
                <button className="btn-danger" onClick={() => rejectItem(selected.id)}>
                  驳回
                </button>
                <button className="btn-ghost">退回</button>
              </div>
              {planFlowRecords.length > 0 && (
                <div className="pt-4 border-t border-steel/20">
                  <div className="text-steel text-xs mb-3">流转记录</div>
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-1 bottom-1 w-px bg-steel/30" />
                    {planFlowRecords.map((record) => (
                      <div key={record.id} className="relative mb-4 last:mb-0">
                        <div
                          className={`absolute -left-5 top-1 w-3 h-3 rounded-full ${ACTION_DOT[record.action]} ring-4 ring-bg-dark`}
                        />
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${ACTION_COLOR[record.action]}`}>
                            {ACTION_LABEL[record.action]}
                          </span>
                          <span className="risk-badge-normal text-xs">
                            {getApprovalTypeLabel(record.type)}
                          </span>
                        </div>
                        <div className="text-white text-sm mt-1">{record.approver}</div>
                        {record.comment && (
                          <div className="text-steel text-xs mt-1">{record.comment}</div>
                        )}
                        <div className="text-steel text-xs mt-0.5">
                          {formatDateTime(record.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
