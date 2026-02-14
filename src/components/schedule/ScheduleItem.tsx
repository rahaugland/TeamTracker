import * as React from 'react';
import { cn } from '@/lib/utils';

export type ScheduleItemType = 'match' | 'practice' | 'tournament';

export interface ScheduleItemProps {
  day: string;
  month: string;
  title: string;
  meta: string;
  type: ScheduleItemType;
  isToday?: boolean;
  className?: string;
  onClick?: () => void;
  actions?: React.ReactNode;
}

export function ScheduleItem({
  day,
  month,
  title,
  meta,
  type,
  isToday = false,
  className,
  onClick,
  actions,
}: ScheduleItemProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border transition-all duration-200',
        'bg-navy-90 border-white/[0.04]',
        isClickable && 'cursor-pointer hover:border-white/[0.1]',
        isToday && 'border-club-primary bg-club-primary/[0.08]',
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
      {/* Date Badge */}
      <div className="min-w-[48px] text-center">
        <div className="font-display font-extrabold text-[22px] leading-none text-white">
          {day}
        </div>
        <div className="font-display font-semibold text-[10px] uppercase tracking-wider text-white/60 mt-0.5">
          {month}
        </div>
      </div>

      {/* Event Info */}
      <div className="flex-1">
        <p className="font-display font-bold text-sm uppercase tracking-wide text-white leading-tight">
          {title}
        </p>
        <p className="text-xs text-white/60 mt-0.5">{meta}</p>
      </div>

      {/* Type Badge */}
      <span
        className={cn(
          'font-display font-bold text-[9px] uppercase tracking-wide px-2.5 py-1 rounded-full',
          type === 'match' &&
            'bg-club-primary/[0.15] text-club-primary',
          type === 'practice' && 'bg-vq-teal/[0.12] text-vq-teal',
          type === 'tournament' &&
            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          isToday && 'bg-white/90 text-club-primary'
        )}
      >
        {isToday ? 'Today' : type === 'match' ? 'Match' : type === 'tournament' ? 'Tournament' : 'Practice'}
      </span>

      {/* Optional actions slot (e.g. RSVP buttons) */}
      {actions}
    </div>
  );
}
