import { motion } from 'framer-motion';
import { ShieldAlert, Bell, Truck, ClipboardList } from 'lucide-react';
import KPICard from '@/components/cards/KPICard';
import RiskTrendChart from '@/components/charts/RiskTrendChart';
import RiskMap from '@/components/charts/RiskMap';
import { mockKPI, mockAlerts, mockMapData, mockRiskTrend } from '@/mock/data';
import { getLevelColor, getLevelLabel, formatDateTime, getRiskIndexColor } from '@/utils/format';
import type { AlertItem } from '@/types';

function AlertRow({ item, index }: { item: AlertItem; index: number }) {
  const barColor = getLevelColor(item.level);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="animate-slide-in flex items-start gap-3 py-3 border-b border-deep-border/30 last:border-b-0"
    >
      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: barColor }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white text-sm font-medium truncate">{item.supplier}</span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium border flex-shrink-0"
            style={{
              color: barColor,
              borderColor: `${barColor}50`,
              backgroundColor: `${barColor}15`,
            }}
          >
            {getLevelLabel(item.level)}
          </span>
        </div>
        <p className="text-steel text-xs truncate">{item.message}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-slate-dim text-[11px]">{formatDateTime(item.timestamp)}</span>
          <span className="text-[11px] font-mono font-bold" style={{ color: getRiskIndexColor(item.riskIndex) }}>
            {item.riskIndex}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="全局风险指数"
          value={mockKPI.globalRiskIndex}
          unit="分"
          icon={ShieldAlert}
          trend="up"
          trendValue="+2.3"
          color="#00f5d4"
        />
        <KPICard
          title="活跃告警"
          value={mockKPI.activeAlerts}
          unit="条"
          icon={Bell}
          trend="up"
          trendValue="+5"
          color="#f72585"
        />
        <KPICard
          title="准时交付率"
          value={mockKPI.onTimeDeliveryRate}
          unit="%"
          icon={Truck}
          trend="down"
          trendValue="-1.8%"
          color="#00f5d4"
        />
        <KPICard
          title="待审批数"
          value={mockKPI.pendingApprovals}
          unit="项"
          icon={ClipboardList}
          trend="flat"
          color="#ff6b35"
        />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <RiskTrendChart data={mockRiskTrend} />
        </div>
        <div className="col-span-2 glass-card p-5 flex flex-col">
          <h3 className="section-title mb-3">实时告警</h3>
          <div className="flex-1 overflow-y-auto max-h-[330px] pr-1">
            {mockAlerts.map((alert, i) => (
              <AlertRow key={alert.id} item={alert} index={i} />
            ))}
          </div>
        </div>
      </div>

      <RiskMap data={mockMapData} />
    </div>
  );
}
