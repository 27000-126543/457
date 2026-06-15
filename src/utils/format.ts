import type { RiskLevel } from '@/types';

export function getLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'normal': return '#00f5d4';
    case 'warning': return '#ff6b35';
    case 'severe': return '#f72585';
    case 'critical': return '#ff0040';
    default: return '#8892b0';
  }
}

export function getLevelLabel(level: RiskLevel): string {
  switch (level) {
    case 'normal': return '正常';
    case 'warning': return '预警';
    case 'severe': return '严重';
    case 'critical': return '紧急';
    default: return '未知';
  }
}

export function getLevelBadgeClass(level: RiskLevel): string {
  switch (level) {
    case 'normal': return 'risk-badge-normal';
    case 'warning': return 'risk-badge-warning';
    case 'severe': return 'risk-badge-severe';
    case 'critical': return 'risk-badge-severe';
    default: return 'risk-badge-normal';
  }
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN');
}

export function getApprovalTypeLabel(type: string): string {
  switch (type) {
    case 'procurement_review': return '采购审核';
    case 'finance_review': return '财务复核';
    case 'legal_review': return '法务确认';
    default: return type;
  }
}

export function getUrgencyLabel(u: string): string {
  switch (u) {
    case 'normal': return '常规';
    case 'urgent': return '紧急';
    case 'critical': return '特急';
    default: return u;
  }
}

export function getPlanTypeLabel(type: string): string {
  switch (type) {
    case 'supplier_switch': return '切换供应商';
    case 'route_adjust': return '调整路线';
    case 'fx_lock': return '汇率锁定';
    default: return type;
  }
}

export function getPlanStatusLabel(status: string): string {
  switch (status) {
    case 'generated': return '已生成';
    case 'under_review': return '审核中';
    case 'approved': return '已批准';
    case 'executing': return '执行中';
    case 'completed': return '已完成';
    default: return status;
  }
}

export function getRiskIndexColor(value: number): string {
  if (value >= 80) return '#ff0040';
  if (value >= 65) return '#f72585';
  if (value >= 50) return '#ff6b35';
  return '#00f5d4';
}
