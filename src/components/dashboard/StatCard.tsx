import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatCardAccent = 'success' | 'primary' | 'secondary' | 'teal' | 'gray';

const accentColors: Record<StatCardAccent, string> = {
  success: 'bg-green-500',
  primary: 'bg-club-primary',
  secondary: 'bg-club-secondary',
  teal: 'bg-vq-teal',
  gray: 'bg-gray-400',
};

export interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  accent?: StatCardAccent;
  isActive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  delta,
  deltaType = 'neutral',
  accent = 'gray',
  isActive = false,
  className,
  onClick,
}: StatCardProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'relative bg-navy-90 border border-white/[0.06] rounded-lg p-6 overflow-hidden transition-all duration-200',
        isClickable && 'cursor-pointer hover:border-white/[0.12] hover:-translate-y-0.5',
        isActive && 'border-vq-teal/40 bg-vq-teal/5 hover:border-vq-teal/40',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Top accent bar */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-[3px]',
          accentColors[accent]
        )}
      />

      {/* Chevron indicator */}
      {isClickable && (
        <ChevronDown
          className={cn(
            'absolute top-3 right-3 w-4 h-4 text-gray-400 transition-transform duration-200',
            isActive && 'rotate-180 text-vq-teal'
          )}
        />
      )}

      {/* Label */}
      <p className="font-display font-semibold text-[11px] uppercase tracking-[2px] text-gray-400 mb-2">
        {label}
      </p>

      {/* Value */}
      <p className="font-mono font-bold text-[32px] leading-none tracking-tight text-white">
        {value}
      </p>

      {/* Delta */}
      {delta && (
        <p
          className={cn(
            'font-mono text-xs mt-1',
            deltaType === 'positive' && 'text-green-500',
            deltaType === 'negative' && 'text-red-500',
            deltaType === 'neutral' && 'text-gray-400'
          )}
        >
          {delta}
        </p>
      )}
    </div>
  );
}
