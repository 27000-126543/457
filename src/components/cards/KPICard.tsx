import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  color?: string;
}

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-rose-critical' },
  down: { icon: TrendingDown, color: 'text-neon-cyan' },
  flat: { icon: Minus, color: 'text-steel' },
};

export default function KPICard({
  title, value, unit, icon: Icon, trend = 'flat', trendValue, color = '#00f5d4',
}: KPICardProps) {
  const TrendIcon = trendConfig[trend].icon;
  const trendColor = trendConfig[trend].color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-hover animate-pulse-glow p-5 relative overflow-hidden group"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ boxShadow: `inset 0 0 30px ${color}15, 0 0 20px ${color}10` }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-steel text-sm font-medium">{title}</span>
          <Icon size={20} style={{ color }} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="stat-value font-mono" style={{ color }}>
            {value}
          </span>
          {unit && <span className="text-steel text-sm">{unit}</span>}
        </div>
        {(trendValue || trend !== 'flat') && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trendColor}`}>
            <TrendIcon size={14} />
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
