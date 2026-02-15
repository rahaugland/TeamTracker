import { cn } from '@/lib/utils';

interface SkillBarEnhancedProps {
  label: string;
  value: number;
  trend?: number;
  color: string;
}

/** Gradient classes keyed by skill color identifier */
const GRADIENT_MAP: Record<string, string> = {
  red:    'from-club-primary to-red-400',
  teal:   'from-teal-500 to-teal-300',
  gold:   'from-amber-500 to-yellow-300',
  purple: 'from-violet-500 to-violet-400',
  green:  'from-emerald-500 to-emerald-300',
  pink:   'from-pink-500 to-pink-400',
};

export function SkillBarEnhanced({ label, value, trend, color }: SkillBarEnhancedProps) {
  const gradientClass = GRADIENT_MAP[color] || GRADIENT_MAP.teal;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-display font-semibold uppercase tracking-wider text-white/60 w-20 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-6 bg-white/[0.06] rounded-lg overflow-hidden relative">
        <div
          className={cn('h-full bg-gradient-to-r rounded-lg transition-all duration-500', gradientClass)}
          style={{ width: `${Math.max(value, 2)}%` }}
        />
        <span className="absolute inset-y-0 left-2 flex items-center text-xs font-mono font-bold text-white drop-shadow-sm">
          {value}
        </span>
      </div>
      <TrendIndicator trend={trend} />
    </div>
  );
}

function TrendIndicator({ trend }: { trend?: number }) {
  if (trend === undefined || trend === 0) {
    return (
      <span className="w-10 text-right text-xs font-mono text-white/30 flex-shrink-0">
        —
      </span>
    );
  }

  const isPositive = trend > 0;
  return (
    <span
      className={cn(
        'w-10 text-right text-xs font-mono font-semibold flex-shrink-0',
        isPositive ? 'text-emerald-400' : 'text-red-400'
      )}
    >
      {isPositive ? '+' : ''}{trend}
    </span>
  );
}
