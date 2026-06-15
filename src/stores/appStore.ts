import { create } from 'zustand';
import type {
  AlertItem, RiskPath, EmergencyPlan, ApprovalItem, RiskEvent, RiskLevel
} from '@/types';
import {
  mockAlerts, mockRiskPaths, mockEmergencyPlans, mockApprovals, mockRiskEvents
} from '@/mock/data';

interface AppState {
  alerts: AlertItem[];
  riskPaths: RiskPath[];
  emergencyPlans: EmergencyPlan[];
  approvals: ApprovalItem[];
  riskEvents: RiskEvent[];
  selectedAlertId: string | null;
  selectedPlanId: string | null;
  selectedPathId: string | null;
  selectedEventId: string | null;
  sidebarCollapsed: boolean;

  setSelectedAlert: (id: string | null) => void;
  setSelectedPlan: (id: string | null) => void;
  setSelectedPath: (id: string | null) => void;
  setSelectedEvent: (id: string | null) => void;
  toggleSidebar: () => void;
  approveItem: (id: string) => void;
  rejectItem: (id: string) => void;
  updatePlanStatus: (id: string, status: EmergencyPlan['status']) => void;
  getAlertsByLevel: (level: RiskLevel) => AlertItem[];
  getPlansByAlert: (alertId: string) => EmergencyPlan[];
  getApprovalsByPlan: (planId: string) => ApprovalItem[];
  getRelatedEvents: (eventId: string) => RiskEvent[];
}

export const useAppStore = create<AppState>((set, get) => ({
  alerts: mockAlerts,
  riskPaths: mockRiskPaths,
  emergencyPlans: mockEmergencyPlans,
  approvals: mockApprovals,
  riskEvents: mockRiskEvents,
  selectedAlertId: null,
  selectedPlanId: null,
  selectedPathId: null,
  selectedEventId: null,
  sidebarCollapsed: false,

  setSelectedAlert: (id) => set({ selectedAlertId: id }),
  setSelectedPlan: (id) => set({ selectedPlanId: id }),
  setSelectedPath: (id) => set({ selectedPathId: id }),
  setSelectedEvent: (id) => set({ selectedEventId: id }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  approveItem: (id) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === id ? { ...a, status: 'approved' as const } : a
      ),
    })),

  rejectItem: (id) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === id ? { ...a, status: 'rejected' as const } : a
      ),
    })),

  updatePlanStatus: (id, status) =>
    set((s) => ({
      emergencyPlans: s.emergencyPlans.map((p) =>
        p.id === id ? { ...p, status } : p
      ),
    })),

  getAlertsByLevel: (level) => get().alerts.filter((a) => a.level === level),
  getPlansByAlert: (alertId) => get().emergencyPlans.filter((p) => p.triggerAlertId === alertId),
  getApprovalsByPlan: (planId) => get().approvals.filter((a) => a.planId === planId),
  getRelatedEvents: (eventId) => {
    const event = get().riskEvents.find((e) => e.id === eventId);
    if (!event) return [];
    return get().riskEvents.filter((e) => event.relatedEvents.includes(e.id));
  },
}));
