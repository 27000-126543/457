import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, History, CheckCircle, Loader, XCircle, ArrowUpCircle } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { mockExecutionSteps, mockRiskEvents } from '@/mock/data';
import { getLevelColor, getLevelLabel, getLevelBadgeClass, formatDateTime, getApprovalTypeLabel, getPlanStatusLabel } from '@/utils/format';
import PlanCard from '@/components/cards/PlanCard';
import ExecutionTimeline from '@/components/ui/ExecutionTimeline';
import clsx from 'clsx';
import type { ApprovalFlowRecord, ApprovalStatus } from '@/types';

export default function Emergency() {
  const {
    alerts,
    emergencyPlans,
    selectedAlertId,
    selectedPlanId,
    setSelectedAlert,
    setSelectedPlan,
    generatePlansForAlert,
    generateStepsForPlan,
    getPlanApprovals,
    getLatestApprovalForPlan,
    getPlanFlowRecords,
    createApprovalForPlan,
    finalizeApproval,
  } = useAppStore();

  const triggerAlert = useMemo(
    () => alerts.find((a) => a.id === selectedAlertId) ?? alerts[0],
    [alerts, selectedAlertId]
  );

  const filteredPlans = useMemo(() => {
    const existing = emergencyPlans.filter((p) => p.triggerAlertId === triggerAlert.id);
    if (existing.length > 0) return existing;
    return generatePlansForAlert(triggerAlert);
  }, [emergencyPlans, triggerAlert, generatePlansForAlert]);

  const activePlan = useMemo(
    () => filteredPlans.find((p) => p.id === selectedPlanId) ?? filteredPlans[0],
    [filteredPlans, selectedPlanId]
  );

  const planSteps = useMemo(() => {
    if (!activePlan) return [];
    const existing = mockExecutionSteps.filter((s) => s.planId === activePlan.id);
    if (existing.length > 0) return existing;
    return generateStepsForPlan(activePlan.id);
  }, [activePlan, generateStepsForPlan]);

  const relatedEvents = useMemo(() => {
    if (!activePlan) return [];
    const direct = mockRiskEvents.filter((e) => activePlan.relatedHistoricalEvents.includes(e.id));
    if (direct.length > 0) return direct;
    return mockRiskEvents.filter((e) => e.category === triggerAlert.category).slice(0, 2);
  }, [activePlan, triggerAlert]);

  const planApprovals = useMemo(
    () => (activePlan ? getPlanApprovals(activePlan.id) : []),
    [activePlan, getPlanApprovals]
  );

  const planFlowRecords = useMemo(
    () => (activePlan ? getPlanFlowRecords(activePlan.id) : []),
    [activePlan, getPlanFlowRecords]
  );

  const currentApproval = useMemo(
    () => (activePlan ? getLatestApprovalForPlan(activePlan.id) : null),
    [activePlan, getLatestApprovalForPlan]
  );

  const showFinalizeDialog = useMemo(() => {
    if (!activePlan || planApprovals.length === 0) return false;
    const legalApproved = planApprovals.find(
      (a) => a.type === 'legal_review' && a.status === 'approved'
    );
    return !!legalApproved && activePlan.status === 'under_review';
  }, [activePlan, planApprovals]);

  const flowIconConfig: Record<string, { icon: React.ElementType; color: string; glow: string }> = {
    approved: { icon: CheckCircle, color: 'text-neon-cyan', glow: 'shadow-[0_0_8px_rgba(0,245,212,0.4)]' },
    pending: { icon: Loader, color: 'text-amber-warn', glow: 'shadow-[0_0_8px_rgba(255,107,53,0.5)]' },
    rejected: { icon: XCircle, color: 'text-rose-critical', glow: 'shadow-[0_0_8px_rgba(255,0,64,0.4)]' },
    escalated: { icon: ArrowUpCircle, color: 'text-amber-warn', glow: 'shadow-[0_0_8px_rgba(255,107,53,0.5)]' },
  };

  const statusBadgeClass = (status: ApprovalStatus | string) => {
    switch (status) {
      case 'approved':
        return 'risk-badge-normal';
      case 'pending':
        return 'risk-badge-warning';
      case 'rejected':
        return 'risk-badge-severe';
      case 'escalated':
        return 'risk-badge-warning';
      default:
        return 'bg-slate-dim/20 text-slate-dim border-slate-dim/30';
    }
  };

  const statusLabel = (status: ApprovalStatus | string) => {
    switch (status) {
      case 'approved':
        return '已通过';
      case 'pending':
        return '待审批';
      case 'rejected':
        return '已驳回';
      case 'escalated':
        return '已升级';
      default:
        return status;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} style={{ color: getLevelColor(triggerAlert.level) }} />
            <div>
              <h2 className="section-title">触发预警</h2>
              <p className="text-steel text-sm mt-0.5">{triggerAlert.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={getLevelBadgeClass(triggerAlert.level)}>
              {getLevelLabel(triggerAlert.level)}
            </span>
            <span className="text-xs text-slate-dim font-mono">
              {triggerAlert.supplier} · {triggerAlert.category} · 风险指数 {triggerAlert.riskIndex}
            </span>
            <select
              className="input-field !w-auto !py-1 !text-xs"
              value={triggerAlert.id}
              onChange={(e) => {
                setSelectedAlert(e.target.value);
                setSelectedPlan(null);
              }}
            >
              {alerts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.supplier} - {a.message.slice(0, 20)}...
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h2 className="section-title mb-4">应急方案</h2>
        <div className="grid grid-cols-3 gap-4">
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={plan.id === activePlan?.id}
              onSelect={setSelectedPlan}
            />
          ))}
        </div>
      </div>

      {activePlan && (
        <motion.div
          key={`approval-${activePlan.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5"
        >
          <h3 className="section-title mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-neon-cyan" />
            审批协同状态
          </h3>

          {planApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <p className="text-slate-dim text-sm">尚未提交审批</p>
              <button
                className="btn-primary"
                onClick={() => createApprovalForPlan(activePlan.id)}
              >
                提交审批
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                {showFinalizeDialog && currentApproval && (
                  <div className="p-4 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                    <p className="text-sm text-white font-medium mb-3">终审已通过，请选择下一步</p>
                    <div className="flex gap-3">
                      <button
                        className="btn-ghost flex-1"
                        onClick={() => finalizeApproval(currentApproval.id, 'approved')}
                      >
                        标记为已批准
                      </button>
                      <button
                        className="btn-primary flex-1"
                        onClick={() => finalizeApproval(currentApproval.id, 'executing')}
                      >
                        直接启动执行
                      </button>
                    </div>
                  </div>
                )}
                {currentApproval && (
                  <div className="p-4 rounded-lg bg-deep-bg/40 border border-deep-border/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-dim">当前阶段</span>
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium border', statusBadgeClass(currentApproval.status))}>
                        {statusLabel(currentApproval.status)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                        <span className="text-sm text-white font-medium">
                          {getApprovalTypeLabel(currentApproval.type)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-dim">审批人</span>
                        <span className="text-steel">{currentApproval.currentApprover}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-dim">截止时间</span>
                        <span className="text-steel font-mono">{formatDateTime(currentApproval.deadline)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-dim">方案状态</span>
                        <span className="text-neon-cyan font-medium">{getPlanStatusLabel(activePlan.status)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-slate-dim mb-2">审批流程阶段</p>
                  {(['procurement_review', 'finance_review', 'legal_review'] as const).map((type, idx) => {
                    const stageApproval = planApprovals.find((a) => a.type === type);
                    const stageStatus = stageApproval?.status || 'pending';
                    const isActive = stageApproval && (stageApproval.status === 'pending' || stageApproval.status === 'escalated');
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <div className={clsx(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono',
                          stageStatus === 'approved'
                            ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40'
                            : isActive
                            ? 'bg-amber-warn/20 text-amber-warn border border-amber-warn/40'
                            : stageStatus === 'rejected'
                            ? 'bg-rose-critical/20 text-rose-critical border border-rose-critical/40'
                            : 'bg-slate-dim/20 text-slate-dim border border-slate-dim/30'
                        )}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={clsx(
                              'text-sm',
                              stageStatus === 'approved' ? 'text-neon-cyan' : isActive ? 'text-amber-warn' : stageStatus === 'rejected' ? 'text-rose-critical' : 'text-steel'
                            )}>
                              {getApprovalTypeLabel(type)}
                            </span>
                            {stageApproval && (
                              <span className={clsx('text-xs px-1.5 py-0.5 rounded border', statusBadgeClass(stageApproval.status))}>
                                {statusLabel(stageApproval.status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-dim mb-3">审批流转记录</p>
                <div className="relative pl-6 max-h-[280px] overflow-y-auto pr-2">
                  {planFlowRecords.map((record: ApprovalFlowRecord, idx: number) => {
                    const cfg = flowIconConfig[record.action] || flowIconConfig.pending;
                    const Icon = cfg.icon;
                    const isLast = idx === planFlowRecords.length - 1;

                    return (
                      <div key={record.id} className="relative pb-5">
                        {!isLast && (
                          <div
                            className={clsx(
                              'absolute left-[-18px] top-[22px] w-0.5 h-[calc(100%-10px)]',
                              record.action === 'approved' ? 'bg-neon-cyan/40' : 'bg-deep-border/60'
                            )}
                          />
                        )}
                        <div className="absolute left-[-24px] top-0">
                          <div className={clsx(
                            'w-[20px] h-[20px] rounded-full flex items-center justify-center bg-deep-bg border-2',
                            cfg.color.replace('text-', 'border-'),
                            cfg.glow
                          )}>
                            <Icon
                              size={11}
                              className={clsx(cfg.color, (record.action === 'pending' || record.action === 'escalated') && 'animate-spin')}
                            />
                          </div>
                        </div>
                        <div className="ml-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm text-white font-medium">{record.approver}</span>
                            <span className={clsx('text-xs px-1.5 py-0.5 rounded border', statusBadgeClass(record.action))}>
                              {statusLabel(record.action)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-dim mb-0.5">
                            <span>{getApprovalTypeLabel(record.type)}</span>
                            <span>·</span>
                            <span className="font-mono">{formatDateTime(record.timestamp)}</span>
                          </div>
                          {record.comment && (
                            <p className="text-xs text-steel">{record.comment}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <motion.div
          key={activePlan?.id ?? 'empty'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-5"
        >
          <h3 className="section-title mb-4">执行时间线</h3>
          {planSteps.length > 0 ? (
            <ExecutionTimeline steps={planSteps} />
          ) : (
            <p className="text-slate-dim text-sm text-center py-8">暂无执行步骤</p>
          )}
        </motion.div>

        <motion.div
          key={`events-${activePlan?.id ?? 'empty'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-5"
        >
          <h3 className="section-title mb-4 flex items-center gap-2">
            <History size={16} className="text-neon-cyan" />
            历史关联事件
          </h3>
          {relatedEvents.length > 0 ? (
            <div className="space-y-3">
              {relatedEvents.map((evt, i) => (
                <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg bg-deep-bg/40 border border-deep-border/30">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-dim font-mono">#{i + 1}</span>
                    <span className={clsx('stat-value !text-base', evt.severity >= 80 ? 'text-rose-critical' : evt.severity >= 60 ? 'text-amber-warn' : 'text-neon-cyan')}>
                      {evt.severity}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm text-white font-medium truncate">{evt.riskType}</span>
                      <span className="text-xs text-slate-dim">{evt.supplier}</span>
                    </div>
                    <p className="text-xs text-steel mb-1">{evt.resolution}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-dim">
                      <span>{evt.date}</span>
                      {evt.resolutionTime > 0 && <span>· 解决耗时 {evt.resolutionTime}h</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-dim text-sm text-center py-8">暂无关联历史事件</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
