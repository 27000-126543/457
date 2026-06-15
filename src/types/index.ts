export type RiskLevel = 'normal' | 'warning' | 'severe' | 'critical';

export interface KPIMetrics {
  globalRiskIndex: number;
  activeAlerts: number;
  onTimeDeliveryRate: number;
  costDeviationRate: number;
  pendingApprovals: number;
}

export interface RiskTrendPoint {
  date: string;
  riskIndex: number;
  alertCount: number;
}

export interface AlertItem {
  id: string;
  level: RiskLevel;
  supplier: string;
  category: string;
  riskIndex: number;
  message: string;
  timestamp: string;
}

export interface MapDataPoint {
  supplierId: string;
  name: string;
  coordinates: [number, number];
  riskLevel: number;
  category: string;
  region: string;
}

export interface RiskDimensions {
  supplierReputation: number;
  onTimeRate: number;
  logisticsRisk: number;
  tariffCost: number;
  exchangeRateVolatility: number;
}

export interface RiskPath {
  id: string;
  name: string;
  supplierId: string;
  dimensions: RiskDimensions;
  compositeIndex: number;
  threshold: number;
  status: RiskLevel;
}

export interface ThresholdConfig {
  category: string;
  warning: number;
  severe: number;
  critical: number;
}

export type EmergencyPlanType = 'supplier_switch' | 'route_adjust' | 'fx_lock';
export type EmergencyPlanStatus = 'generated' | 'under_review' | 'approved' | 'executing' | 'completed';

export interface EmergencyPlan {
  id: string;
  triggerAlertId: string;
  type: EmergencyPlanType;
  title: string;
  description: string;
  costImpact: number;
  timeImpact: string;
  riskReduction: number;
  status: EmergencyPlanStatus;
  relatedHistoricalEvents: string[];
  createdAt: string;
}

export interface ExecutionStep {
  id: string;
  planId: string;
  step: number;
  title: string;
  assignee: string;
  status: 'pending' | 'in_progress' | 'completed';
  deadline: string;
  completedAt?: string;
}

export type ApprovalType = 'procurement_review' | 'finance_review' | 'legal_review';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated';
export type Urgency = 'normal' | 'urgent' | 'critical';

export interface ApprovalItem {
  id: string;
  planId: string;
  type: ApprovalType;
  applicant: string;
  summary: string;
  costImpact: number;
  urgency: Urgency;
  submittedAt: string;
  deadline: string;
  status: ApprovalStatus;
  currentApprover: string;
  escalatedFrom?: string;
}

export interface RiskEvent {
  id: string;
  date: string;
  category: string;
  supplier: string;
  riskType: string;
  severity: number;
  resolution: string;
  resolutionTime: number;
  relatedEvents: string[];
}

export interface ComparisonReport {
  currentEvent: RiskEvent;
  historicalEvents: RiskEvent[];
  differences: {
    field: string;
    currentValue: string;
    historicalValue: string;
  }[];
}

export interface CategorySummary {
  category: string;
  onTimeRate: number;
  costDeviation: number;
  riskEventCount: number;
  avgResolutionTime: number;
}

export interface DailyReport {
  date: string;
  categorySummaries: CategorySummary[];
  trendData: {
    date: string;
    onTimeRate: number;
    costDeviation: number;
    riskEvents: number;
  }[];
}

export interface QueryParams {
  supplier?: string;
  category?: string[];
  dateRange: { start: string; end: string };
  riskLevel?: RiskLevel[];
}

export interface SupplyChainRecord {
  id: string;
  supplier: string;
  category: string;
  orderDate: string;
  deliveryDate: string;
  status: string;
  riskEvents: string[];
  cost: number;
  path: string[];
}

export interface Supplier {
  id: string;
  name: string;
  region: string;
  category: string;
  reputationScore: number;
  onTimeRate: number;
}

export interface EscalationLog {
  id: string;
  approvalId: string;
  fromApprover: string;
  toApprover: string;
  reason: string;
  escalatedAt: string;
}

export interface ApprovalFlowRecord {
  id: string;
  approvalId: string;
  type: ApprovalType;
  approver: string;
  action: 'pending' | 'approved' | 'rejected' | 'escalated';
  timestamp: string;
  comment?: string;
}

export interface ThresholdChangeRecord {
  id: string;
  category: string;
  field: 'warning' | 'severe' | 'critical';
  oldValue: number;
  newValue: number;
  operator: string;
  changedAt: string;
}

export interface ThresholdVersion {
  id: string;
  name: string;
  createdAt: string;
  configs: ThresholdConfig[];
  operator: string;
}

export interface AppStoreState {
  flowRecords: ApprovalFlowRecord[];
  escalationLogs: EscalationLog[];
}
