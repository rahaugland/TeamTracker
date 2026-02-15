import { cn } from '@/lib/utils';

type StatColor = 'teal' | 'gold' | 'red' | 'green';

interface ColorStatCardProps {
  value: string | number;
  label: string;
  color: StatColor;
  subtitle?: string;
  highlight?: boolean;
}

const colorMap: Record<StatColor, string> = {
  teal: 'text-[#2EC4B6]',
  gold: 'text-[#FFB703]',
  red: 'text-[#E63946]',
  green: 'text-[#22C55E]',
};

export function ColorStatCard({ value, label, color, subtitle, highlight }: ColorStatCardProps) {
  return (
    <div
      className={cn(
        'bg-navy-90 border border-white/[0.06] rounded-xl p-5 text-center',
        highlight && 'border-club-primary bg-gradient-to-b from-club-primary/[0.08] to-navy-90'
      )}
    >
      <div className={cn('font-mono font-bold text-3xl', colorMap[color])}>
        {value}
      </div>
      <div className="font-display font-semibold text-[11px] uppercase tracking-wider text-white/50 mt-1">
        {label}
      </div>
      {subtitle && (
        <div className="text-[11px] text-white/50 mt-1">{subtitle}</div>
      )}
    </div>
  );
}
