import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, History } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { mockExecutionSteps, mockRiskEvents } from '@/mock/data';
import { getLevelColor, getLevelLabel, getLevelBadgeClass, formatDateTime } from '@/utils/format';
import PlanCard from '@/components/cards/PlanCard';
import ExecutionTimeline from '@/components/ui/ExecutionTimeline';
import clsx from 'clsx';

export default function Emergency() {
  const { alerts, emergencyPlans, selectedAlertId, selectedPlanId, setSelectedAlert, setSelectedPlan, generatePlansForAlert, generateStepsForPlan } = useAppStore();

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
