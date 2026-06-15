import { Users, Route, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EmergencyPlan } from '@/types';
import { getPlanTypeLabel, getPlanStatusLabel } from '@/utils/format';
import clsx from 'clsx';

interface PlanCardProps {
  plan: EmergencyPlan;
  selected: boolean;
  onSelect: (id: string) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  supplier_switch: Users,
  route_adjust: Route,
  fx_lock: DollarSign,
};

const typeColors: Record<string, string> = {
  supplier_switch: 'text-amber-warn',
  route_adjust: 'text-neon-cyan',
  fx_lock: 'text-purple-400',
};

const statusColors: Record<string, string> = {
  generated: 'bg-slate-dim/20 text-slate-dim border-slate-dim/30',
  under_review: 'risk-badge-warning',
  approved: 'risk-badge-normal',
  executing: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  const Icon = typeIcons[plan.type] || Users;
  const color = typeColors[plan.type] || 'text-neon-cyan';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => onSelect(plan.id)}
      className={clsx(
        'glass-card-hover p-4 cursor-pointer transition-all duration-300 relative',
        selected && 'border-neon-cyan/60 shadow-[0_0_20px_rgba(0,245,212,0.25)]'
      )}
    >
      {selected && (
        <div className="absolute inset-0 rounded-xl border-2 border-neon-cyan/40 pointer-events-none animate-pulse-glow" />
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className={color} />
          <span className="text-xs text-steel font-medium">{getPlanTypeLabel(plan.type)}</span>
        </div>
        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium border', statusColors[plan.status])}>
          {getPlanStatusLabel(plan.status)}
        </span>
      </div>

      <h3 className="text-white font-semibold text-sm mb-1 truncate">{plan.title}</h3>
      <p className="text-steel text-xs mb-3 line-clamp-2">{plan.description}</p>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-dim">成本影响</span>
          <span className="text-rose-critical font-mono font-semibold">+{plan.costImpact}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-dim">时效影响</span>
          <span className="text-amber-warn font-mono font-semibold">{plan.timeImpact}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-dim">风险降低</span>
          <span className="text-neon-cyan font-mono font-semibold">{plan.riskReduction}%</span>
        </div>
      </div>

      <button
        className={clsx('w-full text-center text-xs', selected ? 'btn-primary' : 'btn-ghost')}
        onClick={(e) => { e.stopPropagation(); onSelect(plan.id); }}
      >
        {selected ? '查看详情' : '选择方案'}
      </button>
    </motion.div>
  );
}
