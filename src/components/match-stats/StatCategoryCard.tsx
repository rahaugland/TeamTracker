import { Swords, Target, Shield, Hand, Pointer, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatInputRow } from './StatInputRow';
import type { PlayerStatRow } from './types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Swords,
  Target,
  Shield,
  Hand,
  Pointer,
  Circle,
};

export interface StatField {
  label: string;
  shortLabel: string;
  field: keyof PlayerStatRow;
}

export interface StatCategoryCardProps {
  title: string;
  icon: string;
  color: string;
  stats: StatField[];
  values: PlayerStatRow;
  calculatedStat?: {
    label: string;
    value: string;
    status: 'good' | 'average' | 'poor' | 'neutral';
  };
  onStatChange: (field: keyof PlayerStatRow, value: number) => void;
  className?: string;
}

/**
 * StatCategoryCard component
 * Displays a group of related stats with +/- inputs and optional calculated value
 */
export function StatCategoryCard({
  title,
  icon,
  color,
  stats,
  values,
  calculatedStat,
  onStatChange,
  className,
}: StatCategoryCardProps) {
  const IconComponent = ICON_MAP[icon] || Circle;

  const statusColors: Record<string, string> = {
    good: 'text-green-400',
    average: 'text-yellow-400',
    poor: 'text-red-400',
    neutral: 'text-gray-400',
  };

  return (
    <div
      className={cn(
        'bg-navy-90 border border-white/5 rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Colored top border */}
      <div className="h-1" style={{ backgroundColor: color }} />

      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <IconComponent className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-sm uppercase tracking-wider text-white">
          {title}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {stats.map((stat) => (
          <StatInputRow
            key={stat.field}
            label={stat.label}
            value={values[stat.field] as number}
            onChange={(newValue) => onStatChange(stat.field, newValue)}
          />
        ))}

        {/* Calculated stat */}
        {calculatedStat && (
          <div className="flex items-center justify-between p-3 bg-white/5 rounded mt-4">
            <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-gray-400">
              {calculatedStat.label}
            </span>
            <span
              className={cn(
                'font-mono font-bold text-xl',
                statusColors[calculatedStat.status]
              )}
            >
              {calculatedStat.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
