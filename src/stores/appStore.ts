import { create } from 'zustand';
import type {
  AlertItem, RiskPath, EmergencyPlan, ApprovalItem, RiskEvent, RiskLevel,
  ApprovalFlowRecord, EscalationLog, ApprovalType, EmergencyPlanType, ExecutionStep
} from '@/types';
import {
  mockAlerts, mockRiskPaths, mockEmergencyPlans, mockApprovals, mockRiskEvents,
  mockFlowRecords, mockEscalationLogs
} from '@/mock/data';

const NEXT_APPROVAL_TYPE: Record<ApprovalType, ApprovalType | null> = {
  procurement_review: 'finance_review',
  finance_review: 'legal_review',
  legal_review: null,
};

const APPROVER_MAP: Record<ApprovalType, string> = {
  procurement_review: '张伟（采购主管）',
  finance_review: '李芳（财务审核）',
  legal_review: '王刚（法务合规）',
};

const ESCALATION_APPROVER: Record<ApprovalType, string> = {
  procurement_review: '陈强（采购总监）',
  finance_review: '周明（财务总监）',
  legal_review: '赵敏（法务总监）',
};

function generateId(prefix: string) {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${num}`;
}

function addHours(dateStr: string, hours: number): string {
  const d = new Date(dateStr);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

interface AppState {
  alerts: AlertItem[];
  riskPaths: RiskPath[];
  emergencyPlans: EmergencyPlan[];
  approvals: ApprovalItem[];
  riskEvents: RiskEvent[];
  flowRecords: ApprovalFlowRecord[];
  escalationLogs: EscalationLog[];
  selectedAlertId: string | null;
  selectedPlanId: string | null;
  selectedPathId: string | null;
  selectedEventId: string | null;
  sidebarCollapsed: boolean;
  thresholdVersionSnapshot: {
    appliedAt: string | null;
    versionName: string;
    riskIndexBefore: number;
    riskIndexAfter: number;
    alertCountBefore: number;
    alertCountAfter: number;
    affectedAmount: number;
    changedPaths: { id: string; name: string; category: string; oldStatus: RiskLevel; newStatus: RiskLevel }[];
  } | null;

  setSelectedAlert: (id: string | null) => void;
  setSelectedPlan: (id: string | null) => void;
  setSelectedPath: (id: string | null) => void;
  setSelectedEvent: (id: string | null) => void;
  toggleSidebar: () => void;
  setThresholdVersionSnapshot: (snapshot: AppState['thresholdVersionSnapshot']) => void;
  addFlowRecord: (record: ApprovalFlowRecord) => void;
  addEscalationLog: (log: EscalationLog) => void;
  createApprovalForPlan: (planId: string) => void;
  approveItem: (id: string) => void;
  rejectItem: (id: string) => void;
  finalizeApproval: (approvalId: string, nextStatus: 'approved' | 'executing') => void;
  checkAndEscalate: () => void;
  updatePlanStatus: (id: string, status: EmergencyPlan['status']) => void;
  getAlertsByLevel: (level: RiskLevel) => AlertItem[];
  getPlansByAlert: (alertId: string) => EmergencyPlan[];
  getApprovalsByPlan: (planId: string) => ApprovalItem[];
  getPlanApprovals: (planId: string) => ApprovalItem[];
  getLatestApprovalForPlan: (planId: string) => ApprovalItem | null;
  getPlanFlowRecords: (planId: string) => ApprovalFlowRecord[];
  getRelatedEvents: (eventId: string) => RiskEvent[];
  generatePlansForAlert: (alert: AlertItem) => EmergencyPlan[];
  generateStepsForPlan: (planId: string) => ExecutionStep[];
}

export const useAppStore = create<AppState>((set, get) => ({
  alerts: mockAlerts,
  riskPaths: mockRiskPaths,
  emergencyPlans: mockEmergencyPlans,
  approvals: mockApprovals,
  riskEvents: mockRiskEvents,
  flowRecords: mockFlowRecords,
  escalationLogs: mockEscalationLogs,
  selectedAlertId: null,
  selectedPlanId: null,
  selectedPathId: null,
  selectedEventId: null,
  sidebarCollapsed: false,
  thresholdVersionSnapshot: null,

  setSelectedAlert: (id) => set({ selectedAlertId: id }),
  setSelectedPlan: (id) => set({ selectedPlanId: id }),
  setSelectedPath: (id) => set({ selectedPathId: id }),
  setSelectedEvent: (id) => set({ selectedEventId: id }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setThresholdVersionSnapshot: (snapshot) => set({ thresholdVersionSnapshot: snapshot }),

  addFlowRecord: (record) =>
    set((s) => ({ flowRecords: [...s.flowRecords, record] })),

  addEscalationLog: (log) =>
    set((s) => ({ escalationLogs: [...s.escalationLogs, log] })),

  createApprovalForPlan: (planId) => {
    const state = get();
    const plan = state.emergencyPlans.find((p) => p.id === planId);
    if (!plan) return;

    const existing = state.approvals.filter((a) => a.planId === planId);
    if (existing.length > 0) {
      const firstStage = existing.find((a) => a.type === 'procurement_review');
      if (!firstStage || firstStage.status !== 'pending') return;
      return;
    }

    const now = new Date().toISOString();
    const newApproval: ApprovalItem = {
      id: generateId('APR'),
      planId,
      type: 'procurement_review',
      applicant: '系统自动',
      summary: plan.title,
      costImpact: plan.costImpact,
      urgency: 'urgent',
      submittedAt: now,
      deadline: addHours(now, 12),
      status: 'pending',
      currentApprover: APPROVER_MAP['procurement_review'],
    };

    const flowRecord: ApprovalFlowRecord = {
      id: generateId('FR'),
      approvalId: newApproval.id,
      type: newApproval.type,
      approver: newApproval.currentApprover,
      action: 'pending',
      timestamp: now,
      comment: '提交审批',
    };

    const updatedPlans = state.emergencyPlans.map((p) =>
      p.id === planId ? { ...p, status: 'under_review' as const } : p
    );

    set({
      approvals: [...state.approvals, newApproval],
      flowRecords: [...state.flowRecords, flowRecord],
      emergencyPlans: updatedPlans,
    });
  },

  approveItem: (id) => {
    const state = get();
    const approval = state.approvals.find((a) => a.id === id);
    if (!approval) return;

    const now = new Date().toISOString();
    const approvedRecord: ApprovalFlowRecord = {
      id: generateId('FR'),
      approvalId: approval.id,
      type: approval.type,
      approver: approval.currentApprover,
      action: 'approved',
      timestamp: now,
      comment: '审批通过',
    };

    const updatedApprovals = state.approvals.map((a) =>
      a.id === id ? { ...a, status: 'approved' as const } : a
    );

    let newApprovals = [...updatedApprovals];
    let newFlowRecords = [...state.flowRecords, approvedRecord];
    let newPlans = state.emergencyPlans;

    const nextType = NEXT_APPROVAL_TYPE[approval.type];
    if (nextType) {
      const existingNext = state.approvals.find(
        (a) => a.planId === approval.planId && a.type === nextType
      );
      if (!existingNext) {
        const newApproval: ApprovalItem = {
          id: generateId('APR'),
          planId: approval.planId,
          type: nextType,
          applicant: approval.applicant,
          summary: approval.summary,
          costImpact: approval.costImpact,
          urgency: approval.urgency,
          submittedAt: now,
          deadline: addHours(now, 12),
          status: 'pending',
          currentApprover: APPROVER_MAP[nextType],
        };
        newApprovals.push(newApproval);

        const pendingRecord: ApprovalFlowRecord = {
          id: generateId('FR'),
          approvalId: newApproval.id,
          type: newApproval.type,
          approver: newApproval.currentApprover,
          action: 'pending',
          timestamp: now,
          comment: '提交审批',
        };
        newFlowRecords.push(pendingRecord);
      }
    }

    set({ approvals: newApprovals, flowRecords: newFlowRecords, emergencyPlans: newPlans });
  },

  rejectItem: (id) => {
    const state = get();
    const approval = state.approvals.find((a) => a.id === id);
    if (!approval) return;

    const now = new Date().toISOString();
    const rejectedRecord: ApprovalFlowRecord = {
      id: generateId('FR'),
      approvalId: approval.id,
      type: approval.type,
      approver: approval.currentApprover,
      action: 'rejected',
      timestamp: now,
      comment: '审批驳回',
    };

    set({
      approvals: state.approvals.map((a) =>
        a.id === id ? { ...a, status: 'rejected' as const } : a
      ),
      flowRecords: [...state.flowRecords, rejectedRecord],
    });
  },

  finalizeApproval: (approvalId, nextStatus) => {
    const state = get();
    const approval = state.approvals.find((a) => a.id === approvalId);
    if (!approval || approval.type !== 'legal_review') return;

    const now = new Date().toISOString();
    const newFlowRecords = [...state.flowRecords];

    const alreadyApproved = state.flowRecords.find(
      (r) => r.approvalId === approvalId && r.action === 'approved'
    );
    if (!alreadyApproved) {
      const approvedRecord: ApprovalFlowRecord = {
        id: generateId('FR'),
        approvalId: approval.id,
        type: approval.type,
        approver: approval.currentApprover,
        action: 'approved',
        timestamp: now,
        comment: '审批通过',
      };
      newFlowRecords.push(approvedRecord);
    }

    const finalRecord: ApprovalFlowRecord = {
      id: generateId('FR'),
      approvalId: approval.id,
      type: approval.type,
      approver: approval.currentApprover,
      action: 'approved',
      timestamp: now,
      comment: nextStatus === 'approved' ? '终审通过，方案已批准' : '终审通过，启动执行流程',
    };
    newFlowRecords.push(finalRecord);

    if (nextStatus === 'executing') {
      const step1Record: ApprovalFlowRecord = {
        id: generateId('FR'),
        approvalId: approval.id,
        type: approval.type,
        approver: '系统',
        action: 'approved',
        timestamp: now,
        comment: '执行步骤1：方案评估 - 已完成',
      };
      const step2Record: ApprovalFlowRecord = {
        id: generateId('FR'),
        approvalId: approval.id,
        type: approval.type,
        approver: '系统',
        action: 'pending',
        timestamp: now,
        comment: '执行步骤2：成本复核 - 进行中',
      };
      newFlowRecords.push(step1Record, step2Record);
    }

    const updatedApprovals = state.approvals.map((a) =>
      a.id === approvalId ? { ...a, status: 'approved' as const } : a
    );

    const updatedPlans = state.emergencyPlans.map((p) =>
      p.id === approval.planId ? { ...p, status: nextStatus } : p
    );

    set({
      approvals: updatedApprovals,
      flowRecords: newFlowRecords,
      emergencyPlans: updatedPlans,
    });
  },

  checkAndEscalate: () => {
    const state = get();
    const now = Date.now();
    let approvalsUpdated = [...state.approvals];
    let flowRecordsUpdated = [...state.flowRecords];
    let escalationLogsUpdated = [...state.escalationLogs];
    let changed = false;

    approvalsUpdated = approvalsUpdated.map((a) => {
      if (a.status === 'pending' && now > new Date(a.deadline).getTime() && !a.escalatedFrom) {
        changed = true;
        const escalatedApprover = ESCALATION_APPROVER[a.type];
        const timeStr = new Date().toISOString();

        const flowRecord: ApprovalFlowRecord = {
          id: generateId('FR'),
          approvalId: a.id,
          type: a.type,
          approver: a.currentApprover,
          action: 'escalated',
          timestamp: timeStr,
          comment: '审批超时未处理，自动升级',
        };
        flowRecordsUpdated.push(flowRecord);

        const escalationLog: EscalationLog = {
          id: generateId('ESC'),
          approvalId: a.id,
          fromApprover: a.currentApprover,
          toApprover: escalatedApprover,
          reason: '审批超时未处理，自动升级',
          escalatedAt: timeStr,
        };
        escalationLogsUpdated.push(escalationLog);

        return {
          ...a,
          status: 'escalated' as const,
          currentApprover: escalatedApprover,
          escalatedFrom: a.currentApprover,
        };
      }
      return a;
    });

    if (changed) {
      set({
        approvals: approvalsUpdated,
        flowRecords: flowRecordsUpdated,
        escalationLogs: escalationLogsUpdated,
      });
    }
  },

  updatePlanStatus: (id, status) =>
    set((s) => ({
      emergencyPlans: s.emergencyPlans.map((p) =>
        p.id === id ? { ...p, status } : p
      ),
    })),

  getAlertsByLevel: (level) => get().alerts.filter((a) => a.level === level),
  getPlansByAlert: (alertId) => get().emergencyPlans.filter((p) => p.triggerAlertId === alertId),
  getApprovalsByPlan: (planId) => get().approvals.filter((a) => a.planId === planId),
  getPlanApprovals: (planId) =>
    get()
      .approvals.filter((a) => a.planId === planId)
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()),
  getLatestApprovalForPlan: (planId) => {
    const planApprovals = get().approvals.filter((a) => a.planId === planId);
    if (planApprovals.length === 0) return null;
    const pending = planApprovals.find(
      (a) => a.status === 'pending' || a.status === 'escalated'
    );
    if (pending) return pending;
    return [...planApprovals].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )[0];
  },
  getPlanFlowRecords: (planId) => {
    const state = get();
    const planApprovalIds = state.approvals.filter((a) => a.planId === planId).map((a) => a.id);
    return state.flowRecords
      .filter((r) => planApprovalIds.includes(r.approvalId))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },
  getRelatedEvents: (eventId) => {
    const event = get().riskEvents.find((e) => e.id === eventId);
    if (!event) return [];
    return get().riskEvents.filter((e) => event.relatedEvents.includes(e.id));
  },

  generatePlansForAlert: (alert) => {
    const plans: EmergencyPlan[] = [];
    const message = alert.message;
    const category = alert.category;
    const supplier = alert.supplier;
    const allEvents = get().riskEvents;

    const findRelatedEvents = (cat: string): string[] => {
      const matched = allEvents.filter((e) => e.category === cat).slice(0, 2);
      return matched.map((e) => e.id);
    };

    const shouldGenerateSupplierSwitch =
      message.includes('产能') || message.includes('停工') || message.includes('停产') ||
      ['半导体', '硅晶圆', '显示面板'].includes(category);

    const shouldGenerateRouteAdjust =
      message.includes('台风') || message.includes('港口') || message.includes('罢工') ||
      message.includes('物流') || message.includes('运输') ||
      ['纺织品', '铁矿石', '农产品', '钢材'].includes(category);

    const shouldGenerateFxLock =
      message.includes('汇率') || message.includes('欧元') || message.includes('美元') ||
      message.includes('外汇') || ['汽车零部件'].includes(category);

    const randCost = (min: number, max: number) =>
      Math.round((min + Math.random() * (max - min)) * 10) / 10;

    const randRisk = () => Math.floor(15 + Math.random() * 41);

    const timeOptions = ['+3工作日', '+5工作日', '即时生效', '+2工作日', '+7工作日'];
    const randTime = () => timeOptions[Math.floor(Math.random() * timeOptions.length)];

    if (shouldGenerateSupplierSwitch) {
      const related = findRelatedEvents(category);
      plans.push({
        id: generateId('EP'),
        triggerAlertId: alert.id,
        type: 'supplier_switch',
        title: `${supplier}产能切换至备用供应商`,
        description: `将${category}订单从${supplier}转移至认证备选供应商，产能覆盖率约80%，需重新评估交付能力`,
        costImpact: randCost(8, 15),
        timeImpact: timeOptions[Math.floor(Math.random() * 3) + 1],
        riskReduction: randRisk(),
        status: 'generated',
        relatedHistoricalEvents: related.length > 0 ? related : findRelatedEvents('半导体'),
        createdAt: new Date().toISOString(),
      });
    }

    if (shouldGenerateRouteAdjust) {
      const related = findRelatedEvents(category);
      plans.push({
        id: generateId('EP'),
        triggerAlertId: alert.id,
        type: 'route_adjust',
        title: `${supplier}物流路线调整方案`,
        description: `优化${category}运输路径，避开风险区域，增加陆运或海运中转节点以确保交付时效`,
        costImpact: randCost(2, 8),
        timeImpact: randTime(),
        riskReduction: randRisk(),
        status: 'generated',
        relatedHistoricalEvents: related.length > 0 ? related : findRelatedEvents('纺织品'),
        createdAt: new Date().toISOString(),
      });
    }

    if (shouldGenerateFxLock) {
      const related = findRelatedEvents(category);
      plans.push({
        id: generateId('EP'),
        triggerAlertId: alert.id,
        type: 'fx_lock',
        title: `${supplier}外汇风险锁定方案`,
        description: `与银行签订远期外汇合约，锁定${category}采购汇率，对冲未来30-60天汇率波动风险`,
        costImpact: randCost(1.5, 5),
        timeImpact: '即时生效',
        riskReduction: randRisk(),
        status: 'generated',
        relatedHistoricalEvents: related.length > 0 ? related : findRelatedEvents('汽车零部件'),
        createdAt: new Date().toISOString(),
      });
    }

    if (plans.length === 0) {
      const fallbackType: EmergencyPlanType = 'supplier_switch';
      const related = findRelatedEvents(category);
      plans.push({
        id: generateId('EP'),
        triggerAlertId: alert.id,
        type: fallbackType,
        title: `${supplier}风险应急应对方案`,
        description: `针对${supplier}当前${category}风险状况启动多维度评估，制定供应商备选及库存缓冲策略`,
        costImpact: randCost(3, 10),
        timeImpact: randTime(),
        riskReduction: randRisk(),
        status: 'generated',
        relatedHistoricalEvents: related.length > 0 ? related : allEvents.slice(0, 2).map((e) => e.id),
        createdAt: new Date().toISOString(),
      });
    }

    if (plans.length === 1 && Math.random() > 0.3) {
      const existingTypes = plans.map((p) => p.type);
      const extraTypes: EmergencyPlanType[] = ['supplier_switch', 'route_adjust', 'fx_lock'].filter(
        (t) => !existingTypes.includes(t as EmergencyPlanType)
      ) as EmergencyPlanType[];

      if (extraTypes.length > 0) {
        const extraType = extraTypes[Math.floor(Math.random() * extraTypes.length)];
        const related = findRelatedEvents(category);
        const extraTitles: Record<EmergencyPlanType, string> = {
          supplier_switch: `${supplier}二级供应商激活方案`,
          route_adjust: `${supplier}多式联运优化方案`,
          fx_lock: `${supplier}付款周期调整方案`,
        };
        const extraDescs: Record<EmergencyPlanType, string> = {
          supplier_switch: `启动${category}二级供应商资质复核与小批量试单，建立双源供应体系降低断供风险`,
          route_adjust: `评估${category}铁运/空运替代方案，结合库存水平制定动态物流切换策略`,
          fx_lock: `调整${category}付款账期与币种结构，结合自然对冲降低外汇敞口`,
        };
        plans.push({
          id: generateId('EP'),
          triggerAlertId: alert.id,
          type: extraType,
          title: extraTitles[extraType],
          description: extraDescs[extraType],
          costImpact: randCost(1.5, 10),
          timeImpact: randTime(),
          riskReduction: randRisk(),
          status: 'generated',
          relatedHistoricalEvents: related.length > 0 ? related : allEvents.slice(0, 1).map((e) => e.id),
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (plans.length < 3 && Math.random() > 0.6) {
      const existingTypes = plans.map((p) => p.type);
      const remainingTypes: EmergencyPlanType[] = ['supplier_switch', 'route_adjust', 'fx_lock'].filter(
        (t) => !existingTypes.includes(t as EmergencyPlanType)
      ) as EmergencyPlanType[];

      if (remainingTypes.length > 0) {
        const extraType = remainingTypes[Math.floor(Math.random() * remainingTypes.length)];
        const related = findRelatedEvents(category);
        const extraTitles: Record<EmergencyPlanType, string> = {
          supplier_switch: `${supplier}安全库存补充方案`,
          route_adjust: `${supplier}本地仓库前置方案`,
          fx_lock: `${supplier}价格联动谈判方案`,
        };
        const extraDescs: Record<EmergencyPlanType, string> = {
          supplier_switch: `紧急采购${category}安全库存，维持60天消耗量，缓冲供应商交付不确定性`,
          route_adjust: `将${category}货物前置至区域仓，缩短终端交付周期并降低运输中断影响`,
          fx_lock: `与${supplier}协商价格联动机制，按汇率波动区间动态调整采购单价`,
        };
        plans.push({
          id: generateId('EP'),
          triggerAlertId: alert.id,
          type: extraType,
          title: extraTitles[extraType],
          description: extraDescs[extraType],
          costImpact: randCost(2, 12),
          timeImpact: randTime(),
          riskReduction: randRisk(),
          status: 'generated',
          relatedHistoricalEvents: related.length > 0 ? related : allEvents.slice(0, 1).map((e) => e.id),
          createdAt: new Date().toISOString(),
        });
      }
    }

    return plans.slice(0, 3);
  },

  generateStepsForPlan: (planId) => {
    const now = new Date();
    const addDays = (d: Date, days: number) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + days);
      return nd.toISOString();
    };

    return [
      {
        id: generateId('ES'),
        planId,
        step: 1,
        title: '方案评估',
        assignee: '张伟（采购主管）',
        status: 'in_progress',
        deadline: addDays(now, 1),
      },
      {
        id: generateId('ES'),
        planId,
        step: 2,
        title: '成本复核',
        assignee: '李芳（财务审核）',
        status: 'pending',
        deadline: addDays(now, 2),
      },
      {
        id: generateId('ES'),
        planId,
        step: 3,
        title: '合同签署',
        assignee: '王刚（法务合规）',
        status: 'pending',
        deadline: addDays(now, 4),
      },
      {
        id: generateId('ES'),
        planId,
        step: 4,
        title: '执行启动',
        assignee: '陈明（运营经理）',
        status: 'pending',
        deadline: addDays(now, 7),
      },
    ];
  },
}));
