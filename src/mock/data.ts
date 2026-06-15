import type {
  KPIMetrics, AlertItem, MapDataPoint, RiskPath, RiskTrendPoint,
  ThresholdConfig, EmergencyPlan, ExecutionStep, ApprovalItem,
  RiskEvent, DailyReport, SupplyChainRecord, Supplier, EscalationLog,
  ApprovalFlowRecord
} from '@/types';

export const mockKPI: KPIMetrics = {
  globalRiskIndex: 67.3,
  activeAlerts: 23,
  onTimeDeliveryRate: 91.2,
  costDeviationRate: 4.7,
  pendingApprovals: 8,
};

export const mockAlerts: AlertItem[] = [
  { id: 'ALT001', level: 'critical', supplier: '深圳精密电子', category: '半导体', riskIndex: 89.5, message: '供应商产能骤降40%，多条产线停工', timestamp: '2026-06-15T08:32:00' },
  { id: 'ALT002', level: 'severe', supplier: '越南星月纺织', category: '纺织品', riskIndex: 78.2, message: '台风预警：胡志明港预计72小时内关闭', timestamp: '2026-06-15T07:15:00' },
  { id: 'ALT003', level: 'severe', supplier: '德国博世汽配', category: '汽车零部件', riskIndex: 75.8, message: '欧元汇率波动超3%阈值，远期合约需调整', timestamp: '2026-06-15T06:48:00' },
  { id: 'ALT004', level: 'warning', supplier: '印度塔塔钢铁', category: '钢材', riskIndex: 62.4, message: '印度加征12%出口关税，成本偏差超预期', timestamp: '2026-06-15T05:20:00' },
  { id: 'ALT005', level: 'warning', supplier: '韩国三星显示', category: '显示面板', riskIndex: 58.1, message: '准时交付率降至82%，低于合同约定值', timestamp: '2026-06-15T04:05:00' },
  { id: 'ALT006', level: 'critical', supplier: '日本信越化学', category: '硅晶圆', riskIndex: 92.1, message: '地震导致工厂停产，供应链中断风险极高', timestamp: '2026-06-15T03:12:00' },
  { id: 'ALT007', level: 'warning', supplier: '巴西淡水河谷', category: '铁矿石', riskIndex: 55.3, message: '巴西港口工人罢工，预计延误7-14天', timestamp: '2026-06-15T02:30:00' },
  { id: 'ALT008', level: 'severe', supplier: '泰国正大集团', category: '农产品', riskIndex: 71.6, message: '禽流感疫情扩散，出口检疫加严', timestamp: '2026-06-14T23:45:00' },
];

export const mockMapData: MapDataPoint[] = [
  { supplierId: 'SUP001', name: '深圳精密电子', coordinates: [114.07, 22.62], riskLevel: 89.5, category: '半导体', region: '华南' },
  { supplierId: 'SUP002', name: '越南星月纺织', coordinates: [106.7, 10.82], riskLevel: 78.2, category: '纺织品', region: '东南亚' },
  { supplierId: 'SUP003', name: '德国博世汽配', coordinates: [9.18, 48.78], riskLevel: 75.8, category: '汽车零部件', region: '欧洲' },
  { supplierId: 'SUP004', name: '印度塔塔钢铁', coordinates: [78.96, 20.59], riskLevel: 62.4, category: '钢材', region: '南亚' },
  { supplierId: 'SUP005', name: '韩国三星显示', coordinates: [127.1, 37.57], riskLevel: 58.1, category: '显示面板', region: '东亚' },
  { supplierId: 'SUP006', name: '日本信越化学', coordinates: [138.71, 35.68], riskLevel: 92.1, category: '硅晶圆', region: '东亚' },
  { supplierId: 'SUP007', name: '巴西淡水河谷', coordinates: [-43.17, -22.91], riskLevel: 55.3, category: '铁矿石', region: '南美' },
  { supplierId: 'SUP008', name: '泰国正大集团', coordinates: [100.5, 13.75], riskLevel: 71.6, category: '农产品', region: '东南亚' },
  { supplierId: 'SUP009', name: '美国德州仪器', coordinates: [-96.8, 32.78], riskLevel: 35.2, category: '芯片', region: '北美' },
  { supplierId: 'SUP010', name: '澳大利亚力拓', coordinates: [115.86, -31.95], riskLevel: 42.7, category: '矿石', region: '大洋洲' },
  { supplierId: 'SUP011', name: '墨西哥Nemak', coordinates: [-100.31, 25.67], riskLevel: 48.9, category: '铝铸件', region: '北美' },
  { supplierId: 'SUP012', name: '印尼青山钢铁', coordinates: [106.85, -6.21], riskLevel: 66.8, category: '不锈钢', region: '东南亚' },
  { supplierId: 'SUP013', name: '波兰Aptiv', coordinates: [21.01, 52.23], riskLevel: 31.4, category: '线束', region: '欧洲' },
  { supplierId: 'SUP014', name: '土耳其Kordsa', coordinates: [32.86, 39.92], riskLevel: 53.6, category: '工业纤维', region: '中东' },
  { supplierId: 'SUP015', name: '南非Sasol', coordinates: [28.04, -26.2], riskLevel: 44.1, category: '化工品', region: '非洲' },
];

function generateTrendData(days: number): RiskTrendPoint[] {
  const data: RiskTrendPoint[] = [];
  const now = new Date('2026-06-15');
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    data.push({
      date: dateStr,
      riskIndex: Math.round((55 + Math.random() * 30) * 10) / 10,
      alertCount: Math.floor(10 + Math.random() * 20),
    });
  }
  return data;
}

export const mockRiskTrend: RiskTrendPoint[] = generateTrendData(30);

export const mockRiskPaths: RiskPath[] = [
  {
    id: 'RP001', name: '深圳→上海→北京 半导体供应链', supplierId: 'SUP001',
    dimensions: { supplierReputation: 72, onTimeRate: 65, logisticsRisk: 88, tariffCost: 45, exchangeRateVolatility: 30 },
    compositeIndex: 89.5, threshold: 70, status: 'critical',
  },
  {
    id: 'RP002', name: '越南→深圳 纺织品供应链', supplierId: 'SUP002',
    dimensions: { supplierReputation: 78, onTimeRate: 71, logisticsRisk: 82, tariffCost: 55, exchangeRateVolatility: 42 },
    compositeIndex: 78.2, threshold: 70, status: 'severe',
  },
  {
    id: 'RP003', name: '德国→上海 汽车零部件供应链', supplierId: 'SUP003',
    dimensions: { supplierReputation: 85, onTimeRate: 76, logisticsRisk: 60, tariffCost: 78, exchangeRateVolatility: 85 },
    compositeIndex: 75.8, threshold: 70, status: 'severe',
  },
  {
    id: 'RP004', name: '印度→宁波 钢材供应链', supplierId: 'SUP004',
    dimensions: { supplierReputation: 68, onTimeRate: 70, logisticsRisk: 55, tariffCost: 72, exchangeRateVolatility: 48 },
    compositeIndex: 62.4, threshold: 70, status: 'warning',
  },
  {
    id: 'RP005', name: '韩国→苏州 显示面板供应链', supplierId: 'SUP005',
    dimensions: { supplierReputation: 90, onTimeRate: 58, logisticsRisk: 40, tariffCost: 52, exchangeRateVolatility: 35 },
    compositeIndex: 58.1, threshold: 70, status: 'warning',
  },
  {
    id: 'RP006', name: '日本→大连 硅晶圆供应链', supplierId: 'SUP006',
    dimensions: { supplierReputation: 88, onTimeRate: 35, logisticsRisk: 95, tariffCost: 65, exchangeRateVolatility: 78 },
    compositeIndex: 92.1, threshold: 70, status: 'critical',
  },
];

export const mockThresholds: ThresholdConfig[] = [
  { category: '半导体', warning: 50, severe: 65, critical: 80 },
  { category: '纺织品', warning: 45, severe: 60, critical: 75 },
  { category: '汽车零部件', warning: 48, severe: 62, critical: 78 },
  { category: '钢材', warning: 40, severe: 55, critical: 70 },
  { category: '显示面板', warning: 45, severe: 60, critical: 75 },
  { category: '硅晶圆', warning: 50, severe: 65, critical: 80 },
  { category: '铁矿石', warning: 40, severe: 55, critical: 70 },
  { category: '农产品', warning: 42, severe: 58, critical: 72 },
];

export const mockEmergencyPlans: EmergencyPlan[] = [
  {
    id: 'EP001', triggerAlertId: 'ALT001', type: 'supplier_switch',
    title: '切换至台积电备用产线', description: '将订单从深圳精密电子转移至台积电南京工厂，预估产能覆盖85%，交期延长5个工作日',
    costImpact: 12.5, timeImpact: '+5工作日', riskReduction: 35, status: 'under_review',
    relatedHistoricalEvents: ['EVT2024-012', 'EVT2023-088'], createdAt: '2026-06-15T08:45:00',
  },
  {
    id: 'EP002', triggerAlertId: 'ALT001', type: 'route_adjust',
    title: '调整运输路线至广州港', description: '避开深圳港拥堵，改走广州南沙港，增加陆运100km，海运时效不变',
    costImpact: 3.2, timeImpact: '+1工作日', riskReduction: 18, status: 'generated',
    relatedHistoricalEvents: ['EVT2024-045'], createdAt: '2026-06-15T08:46:00',
  },
  {
    id: 'EP003', triggerAlertId: 'ALT003', type: 'fx_lock',
    title: '锁定30天远期欧元汇率', description: '与银行签订30天远期外汇合约，锁定EUR/CNY 7.85，对冲汇率波动风险',
    costImpact: 1.8, timeImpact: '即时生效', riskReduction: 42, status: 'approved',
    relatedHistoricalEvents: ['EVT2025-033', 'EVT2024-078'], createdAt: '2026-06-15T07:00:00',
  },
  {
    id: 'EP004', triggerAlertId: 'ALT006', type: 'supplier_switch',
    title: '启用SK海力士替代供应', description: '将硅晶圆订单转至SK海力士韩国工厂，产能充足但需重新认证，预计10天完成',
    costImpact: 8.7, timeImpact: '+10工作日', riskReduction: 52, status: 'executing',
    relatedHistoricalEvents: ['EVT2023-056'], createdAt: '2026-06-15T03:30:00',
  },
  {
    id: 'EP005', triggerAlertId: 'ALT002', type: 'route_adjust',
    title: '改道柬埔寨西哈努克港', description: '越南台风期间改由柬埔寨港口中转，增加陆运200km，但避免港口关闭损失',
    costImpact: 5.4, timeImpact: '+3工作日', riskReduction: 28, status: 'generated',
    relatedHistoricalEvents: ['EVT2024-091'], createdAt: '2026-06-15T07:30:00',
  },
];

export const mockExecutionSteps: ExecutionStep[] = [
  { id: 'ES001', planId: 'EP004', step: 1, title: '提交供应商变更申请', assignee: '张伟（采购主管）', status: 'completed', deadline: '2026-06-15T06:00:00', completedAt: '2026-06-15T05:45:00' },
  { id: 'ES002', planId: 'EP004', step: 2, title: '财务复核成本影响', assignee: '李芳（财务审核）', status: 'completed', deadline: '2026-06-15T10:00:00', completedAt: '2026-06-15T09:30:00' },
  { id: 'ES003', planId: 'EP004', step: 3, title: '法务确认合同条款', assignee: '王刚（法务合规）', status: 'completed', deadline: '2026-06-15T14:00:00', completedAt: '2026-06-15T13:15:00' },
  { id: 'ES004', planId: 'EP004', step: 4, title: 'SK海力士工厂认证启动', assignee: '陈明（质量工程师）', status: 'in_progress', deadline: '2026-06-20T18:00:00' },
  { id: 'ES005', planId: 'EP004', step: 5, title: '首批样品检验', assignee: '赵磊（质检专员）', status: 'pending', deadline: '2026-06-25T18:00:00' },
];

export const mockApprovals: ApprovalItem[] = [
  {
    id: 'APR001', planId: 'EP001', type: 'procurement_review', applicant: '张伟',
    summary: '深圳精密电子产能骤降，申请切换至台积电南京工厂', costImpact: 12.5,
    urgency: 'critical', submittedAt: '2026-06-15T08:50:00', deadline: '2026-06-15T20:50:00',
    status: 'pending', currentApprover: '张伟（采购主管）',
  },
  {
    id: 'APR002', planId: 'EP005', type: 'procurement_review', applicant: '刘洋',
    summary: '越南台风预警，申请调整运输路线至柬埔寨西哈努克港', costImpact: 5.4,
    urgency: 'urgent', submittedAt: '2026-06-15T07:35:00', deadline: '2026-06-16T07:35:00',
    status: 'pending', currentApprover: '刘洋（采购主管）',
  },
  {
    id: 'APR003', planId: 'EP003', type: 'finance_review', applicant: '李芳',
    summary: '锁定30天远期欧元汇率，对冲汇率波动风险', costImpact: 1.8,
    urgency: 'urgent', submittedAt: '2026-06-15T07:05:00', deadline: '2026-06-15T19:05:00',
    status: 'approved', currentApprover: '李芳（财务审核）',
  },
  {
    id: 'APR004', planId: 'EP004', type: 'legal_review', applicant: '王刚',
    summary: '硅晶圆供应商切换至SK海力士，需确认新合同条款', costImpact: 8.7,
    urgency: 'critical', submittedAt: '2026-06-15T09:35:00', deadline: '2026-06-15T21:35:00',
    status: 'approved', currentApprover: '王刚（法务合规）',
  },
  {
    id: 'APR005', planId: 'EP001', type: 'finance_review', applicant: '李芳',
    summary: '台积电替代方案成本影响复核', costImpact: 12.5,
    urgency: 'critical', submittedAt: '2026-06-15T10:00:00', deadline: '2026-06-15T22:00:00',
    status: 'escalated', currentApprover: '周明（财务总监）', escalatedFrom: '李芳',
  },
  {
    id: 'APR006', planId: 'EP002', type: 'procurement_review', applicant: '张伟',
    summary: '调整运输路线至广州南沙港', costImpact: 3.2,
    urgency: 'normal', submittedAt: '2026-06-15T08:50:00', deadline: '2026-06-17T08:50:00',
    status: 'pending', currentApprover: '张伟（采购主管）',
  },
];

export const mockEscalationLogs: EscalationLog[] = [
  {
    id: 'ESC001', approvalId: 'APR005', fromApprover: '李芳（财务审核）', toApprover: '周明（财务总监）',
    reason: '审批超时4小时未处理，自动升级', escalatedAt: '2026-06-15T14:00:00',
  },
];

export const mockRiskEvents: RiskEvent[] = [
  { id: 'EVT2026-001', date: '2026-06-15', category: '半导体', supplier: '深圳精密电子', riskType: '产能中断', severity: 92, resolution: '执行中', resolutionTime: 0, relatedEvents: ['EVT2024-012'] },
  { id: 'EVT2026-002', date: '2026-06-15', category: '硅晶圆', supplier: '日本信越化学', riskType: '自然灾害', severity: 95, resolution: '执行中', resolutionTime: 0, relatedEvents: ['EVT2023-056', 'EVT2022-103'] },
  { id: 'EVT2026-003', date: '2026-06-15', category: '纺织品', supplier: '越南星月纺织', riskType: '气象灾害', severity: 78, resolution: '待审批', resolutionTime: 0, relatedEvents: ['EVT2024-091'] },
  { id: 'EVT2026-004', date: '2026-06-15', category: '汽车零部件', supplier: '德国博世汽配', riskType: '汇率波动', severity: 76, resolution: '已完成', resolutionTime: 2.5, relatedEvents: ['EVT2025-033'] },
  { id: 'EVT2025-033', date: '2025-11-20', category: '汽车零部件', supplier: '德国博世汽配', riskType: '汇率波动', severity: 68, resolution: '已锁定远期汇率', resolutionTime: 4.2, relatedEvents: ['EVT2024-078'] },
  { id: 'EVT2024-012', date: '2024-08-15', category: '半导体', supplier: '深圳精密电子', riskType: '产能中断', severity: 85, resolution: '切换至备选供应商', resolutionTime: 36, relatedEvents: [] },
  { id: 'EVT2024-045', date: '2024-10-22', category: '半导体', supplier: '深圳精密电子', riskType: '物流延误', severity: 62, resolution: '调整运输路线', resolutionTime: 12, relatedEvents: [] },
  { id: 'EVT2024-078', date: '2024-12-05', category: '汽车零部件', supplier: '德国博世汽配', riskType: '汇率波动', severity: 55, resolution: '自然恢复', resolutionTime: 8, relatedEvents: [] },
  { id: 'EVT2024-091', date: '2024-09-10', category: '纺织品', supplier: '越南星月纺织', riskType: '气象灾害', severity: 82, resolution: '改道柬埔寨港口', resolutionTime: 48, relatedEvents: [] },
  { id: 'EVT2023-056', date: '2023-04-18', category: '硅晶圆', supplier: '日本信越化学', riskType: '自然灾害', severity: 90, resolution: '切换至SK海力士', resolutionTime: 72, relatedEvents: [] },
  { id: 'EVT2022-103', date: '2022-07-30', category: '硅晶圆', supplier: '日本信越化学', riskType: '自然灾害', severity: 88, resolution: '临时产能调配', resolutionTime: 96, relatedEvents: [] },
];

export const mockDailyReport: DailyReport = {
  date: '2026-06-15',
  categorySummaries: [
    { category: '半导体', onTimeRate: 85.3, costDeviation: 6.2, riskEventCount: 3, avgResolutionTime: 18.5 },
    { category: '纺织品', onTimeRate: 92.1, costDeviation: 3.1, riskEventCount: 1, avgResolutionTime: 24.0 },
    { category: '汽车零部件', onTimeRate: 94.5, costDeviation: 5.8, riskEventCount: 1, avgResolutionTime: 3.3 },
    { category: '钢材', onTimeRate: 88.7, costDeviation: 7.4, riskEventCount: 1, avgResolutionTime: 0 },
    { category: '显示面板', onTimeRate: 82.0, costDeviation: 2.3, riskEventCount: 1, avgResolutionTime: 0 },
    { category: '硅晶圆', onTimeRate: 68.5, costDeviation: 9.1, riskEventCount: 1, avgResolutionTime: 0 },
    { category: '铁矿石', onTimeRate: 90.2, costDeviation: 4.5, riskEventCount: 1, avgResolutionTime: 0 },
    { category: '农产品', onTimeRate: 87.6, costDeviation: 5.2, riskEventCount: 1, avgResolutionTime: 0 },
  ],
  trendData: generateTrendData(30).map((p, i) => ({
    date: p.date,
    onTimeRate: Math.round((88 + Math.sin(i / 5) * 5 + Math.random() * 3) * 10) / 10,
    costDeviation: Math.round((4.5 + Math.cos(i / 7) * 2 + Math.random()) * 10) / 10,
    riskEvents: Math.floor(2 + Math.random() * 5),
  })),
};

export const mockSuppliers: Supplier[] = [
  { id: 'SUP001', name: '深圳精密电子', region: '华南', category: '半导体', reputationScore: 78, onTimeRate: 65 },
  { id: 'SUP002', name: '越南星月纺织', region: '东南亚', category: '纺织品', reputationScore: 72, onTimeRate: 71 },
  { id: 'SUP003', name: '德国博世汽配', region: '欧洲', category: '汽车零部件', reputationScore: 88, onTimeRate: 76 },
  { id: 'SUP004', name: '印度塔塔钢铁', region: '南亚', category: '钢材', reputationScore: 70, onTimeRate: 70 },
  { id: 'SUP005', name: '韩国三星显示', region: '东亚', category: '显示面板', reputationScore: 92, onTimeRate: 58 },
  { id: 'SUP006', name: '日本信越化学', region: '东亚', category: '硅晶圆', reputationScore: 90, onTimeRate: 35 },
  { id: 'SUP007', name: '巴西淡水河谷', region: '南美', category: '铁矿石', reputationScore: 75, onTimeRate: 82 },
  { id: 'SUP008', name: '泰国正大集团', region: '东南亚', category: '农产品', reputationScore: 80, onTimeRate: 73 },
];

export const mockSupplyRecords: SupplyChainRecord[] = [
  { id: 'REC001', supplier: '深圳精密电子', category: '半导体', orderDate: '2026-05-20', deliveryDate: '2026-06-18', status: '延迟风险', riskEvents: ['EVT2026-001'], cost: 1250000, path: ['深圳', '上海', '北京'] },
  { id: 'REC002', supplier: '越南星月纺织', category: '纺织品', orderDate: '2026-05-25', deliveryDate: '2026-06-20', status: '运输中', riskEvents: ['EVT2026-003'], cost: 450000, path: ['胡志明市', '深圳'] },
  { id: 'REC003', supplier: '德国博世汽配', category: '汽车零部件', orderDate: '2026-06-01', deliveryDate: '2026-06-28', status: '生产中', riskEvents: ['EVT2026-004'], cost: 2100000, path: ['斯图加特', '汉堡', '上海'] },
  { id: 'REC004', supplier: '印度塔塔钢铁', category: '钢材', orderDate: '2026-05-15', deliveryDate: '2026-06-25', status: '已发货', riskEvents: [], cost: 800000, path: ['孟买', '宁波'] },
  { id: 'REC005', supplier: '韩国三星显示', category: '显示面板', orderDate: '2026-06-05', deliveryDate: '2026-06-22', status: '生产中', riskEvents: [], cost: 3500000, path: ['首尔', '苏州'] },
  { id: 'REC006', supplier: '日本信越化学', category: '硅晶圆', orderDate: '2026-05-10', deliveryDate: '2026-06-15', status: '延迟风险', riskEvents: ['EVT2026-002'], cost: 5200000, path: ['东京', '大连'] },
  { id: 'REC007', supplier: '巴西淡水河谷', category: '铁矿石', orderDate: '2026-05-28', deliveryDate: '2026-07-10', status: '已发货', riskEvents: [], cost: 950000, path: ['里约热内卢', '上海'] },
  { id: 'REC008', supplier: '泰国正大集团', category: '农产品', orderDate: '2026-06-03', deliveryDate: '2026-06-17', status: '运输中', riskEvents: [], cost: 320000, path: ['曼谷', '广州'] },
];

export const mockFlowRecords: ApprovalFlowRecord[] = [
  {
    id: 'FR001', approvalId: 'APR003', type: 'finance_review', approver: '李芳（财务审核）',
    action: 'pending', timestamp: '2026-06-15T07:05:00', comment: '提交审批',
  },
  {
    id: 'FR002', approvalId: 'APR003', type: 'finance_review', approver: '李芳（财务审核）',
    action: 'approved', timestamp: '2026-06-15T09:15:00', comment: '成本影响可控，同意执行',
  },
  {
    id: 'FR003', approvalId: 'APR004', type: 'legal_review', approver: '王刚（法务合规）',
    action: 'pending', timestamp: '2026-06-15T09:35:00', comment: '提交审批',
  },
  {
    id: 'FR004', approvalId: 'APR004', type: 'legal_review', approver: '王刚（法务合规）',
    action: 'approved', timestamp: '2026-06-15T11:20:00', comment: '合同条款审核通过',
  },
  {
    id: 'FR005', approvalId: 'APR005', type: 'finance_review', approver: '李芳（财务审核）',
    action: 'pending', timestamp: '2026-06-15T10:00:00', comment: '提交审批',
  },
  {
    id: 'FR006', approvalId: 'APR005', type: 'finance_review', approver: '李芳（财务审核）',
    action: 'escalated', timestamp: '2026-06-15T14:00:00', comment: '审批超时4小时未处理，自动升级',
  },
];
