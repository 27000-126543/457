import { Circle, Loader, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ExecutionStep } from '@/types';
import { formatDateTime } from '@/utils/format';
import clsx from 'clsx';

interface ExecutionTimelineProps {
  steps: ExecutionStep[];
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; glow: string }> = {
  pending: { icon: Circle, color: 'text-slate-dim', glow: '' },
  in_progress: { icon: Loader, color: 'text-amber-warn', glow: 'shadow-[0_0_8px_rgba(255,107,53,0.5)]' },
  completed: { icon: CheckCircle2, color: 'text-neon-cyan', glow: 'shadow-[0_0_8px_rgba(0,245,212,0.4)]' },
};

export default function ExecutionTimeline({ steps }: ExecutionTimelineProps) {
  const sorted = [...steps].sort((a, b) => a.step - b.step);

  return (
    <div className="relative pl-6">
      {sorted.map((step, idx) => {
        const cfg = statusConfig[step.status] || statusConfig.pending;
        const Icon = cfg.icon;
        const isLast = idx === sorted.length - 1;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="relative pb-6"
          >
            {!isLast && (
              <div
                className={clsx(
                  'absolute left-[-18px] top-[28px] w-0.5 h-[calc(100%-20px)]',
                  step.status === 'completed' ? 'bg-neon-cyan/40' : 'bg-deep-border/60'
                )}
              />
            )}

            <div className="absolute left-[-24px] top-0">
              <div className={clsx('w-[22px] h-[22px] rounded-full flex items-center justify-center bg-deep-bg border-2', cfg.color.replace('text-', 'border-'), cfg.glow)}>
                <Icon
                  size={12}
                  className={clsx(cfg.color, step.status === 'in_progress' && 'animate-spin')}
                />
              </div>
            </div>

            <div className="ml-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono text-slate-dim">#{step.step}</span>
                <span className="text-sm text-white font-medium">{step.title}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-steel">
                <span>{step.assignee}</span>
                <span className="text-slate-dim">|</span>
                <span>{formatDateTime(step.deadline)}</span>
              </div>
              {step.completedAt && (
                <span className="text-xs text-neon-cyan/70 mt-0.5 block">
                  完成于 {formatDateTime(step.completedAt)}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
