import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Bell, Truck, ClipboardList } from 'lucide-react';
import KPICard from '@/components/cards/KPICard';
import RiskTrendChart from '@/components/charts/RiskTrendChart';
import RiskMap from '@/components/charts/RiskMap';
import { mockKPI, mockAlerts, mockMapData, mockRiskTrend } from '@/mock/data';
import { getLevelColor, getLevelLabel, getLevelBadgeClass, formatDateTime, getRiskIndexColor } from '@/utils/format';
import { useAppStore } from '@/stores/appStore';
import type { AlertItem } from '@/types';

function AlertRow({ item, index }: { item: AlertItem; index: number }) {
  const navigate = useNavigate();
  const setSelectedAlert = useAppStore((s) => s.setSelectedAlert);
  const barColor = getLevelColor(item.level);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="animate-slide-in flex items-start gap-3 py-3 border-b border-deep-border/30 last:border-b-0 cursor-pointer hover:bg-white/[0.02] transition-colors"
      onClick={() => { setSelectedAlert(item.id); navigate('/emergency'); }}
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
  const navigate = useNavigate();
  const thresholdVersionSnapshot = useAppStore((s) => s.thresholdVersionSnapshot);
  const setThresholdVersionSnapshot = useAppStore((s) => s.setThresholdVersionSnapshot);

  return (
    <div className="p-6 space-y-6">
      {thresholdVersionSnapshot && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-blue-500/40 bg-blue-500/10">
            <span className="text-blue-300 text-sm font-medium">阈值版本变更</span>
            <span className="text-white font-bold">{thresholdVersionSnapshot.versionName}</span>
            <span className="text-slate-dim text-xs">
              {thresholdVersionSnapshot.appliedAt ? formatDateTime(thresholdVersionSnapshot.appliedAt) : ''}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="glass-card-hover p-4 border border-deep-border/50 bg-deep-bg/30">
              <div className="text-xs text-steel mb-2">风险指数变化</div>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono">{thresholdVersionSnapshot.riskIndexBefore}</span>
                <span className="text-steel">→</span>
                <span className="font-mono" style={{ color: thresholdVersionSnapshot.riskIndexAfter > thresholdVersionSnapshot.riskIndexBefore ? '#ff0040' : '#00f5d4' }}>
                  {thresholdVersionSnapshot.riskIndexAfter}
                </span>
                <span className="text-xs font-mono" style={{ color: thresholdVersionSnapshot.riskIndexAfter > thresholdVersionSnapshot.riskIndexBefore ? '#ff0040' : '#00f5d4' }}>
                  ({thresholdVersionSnapshot.riskIndexAfter > thresholdVersionSnapshot.riskIndexBefore ? '+' : ''}{(thresholdVersionSnapshot.riskIndexAfter - thresholdVersionSnapshot.riskIndexBefore).toFixed(1)})
                </span>
              </div>
            </div>
            <div className="glass-card-hover p-4 border border-deep-border/50 bg-deep-bg/30">
              <div className="text-xs text-steel mb-2">告警数量变化</div>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono">{thresholdVersionSnapshot.alertCountBefore}</span>
                <span className="text-steel">→</span>
                <span className="font-mono" style={{ color: thresholdVersionSnapshot.alertCountAfter > thresholdVersionSnapshot.alertCountBefore ? '#ff0040' : '#00f5d4' }}>
                  {thresholdVersionSnapshot.alertCountAfter}
                </span>
                <span className="text-xs font-mono" style={{ color: thresholdVersionSnapshot.alertCountAfter > thresholdVersionSnapshot.alertCountBefore ? '#ff0040' : '#00f5d4' }}>
                  ({thresholdVersionSnapshot.alertCountAfter > thresholdVersionSnapshot.alertCountBefore ? '+' : ''}{thresholdVersionSnapshot.alertCountAfter - thresholdVersionSnapshot.alertCountBefore})
                </span>
              </div>
            </div>
            <div className="glass-card-hover p-4 border border-deep-border/50 bg-deep-bg/30">
              <div className="text-xs text-steel mb-2">受影响订单金额</div>
              <div className="text-2xl font-bold text-amber-warn">¥{(thresholdVersionSnapshot.affectedAmount / 10000).toFixed(0)}万</div>
            </div>
          </div>
          {thresholdVersionSnapshot.changedPaths.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-white mb-3">变化路径列表</div>
              <div className="space-y-2">
                {thresholdVersionSnapshot.changedPaths.map((cp) => (
                  <div
                    key={cp.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-deep-border/30 bg-deep-bg/20 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => navigate('/risk-monitor')}
                  >
                    <span className="text-sm text-white flex-1">{cp.name}</span>
                    <span className={getLevelBadgeClass(cp.oldStatus)}>{getLevelLabel(cp.oldStatus)}</span>
                    <span className="text-steel text-xs">→</span>
                    <span className={getLevelBadgeClass(cp.newStatus)}>{getLevelLabel(cp.newStatus)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button className="btn-primary text-sm" onClick={() => navigate('/risk-monitor')}>查看详情</button>
            <button className="btn-ghost text-sm" onClick={() => setThresholdVersionSnapshot(null)}>关闭</button>
          </div>
        </div>
      )}
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
