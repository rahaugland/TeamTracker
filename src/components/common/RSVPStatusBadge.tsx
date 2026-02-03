import * as React from 'react';
import { cn } from '@/lib/utils';

export type RSVPStatus = 'coming' | 'not-coming' | 'pending';

const statusStyles: Record<RSVPStatus, string> = {
  coming: 'bg-green-500/15 text-green-500',
  'not-coming': 'bg-red-500/15 text-red-500',
  pending: 'bg-yellow-500/15 text-yellow-500',
};

const statusLabels: Record<RSVPStatus, string> = {
  coming: 'Coming',
  'not-coming': 'Not Coming',
  pending: 'Pending',
};

export interface RSVPStatusBadgeProps {
  status: RSVPStatus;
  label?: string;
  className?: string;
}

export function RSVPStatusBadge({
  status,
  label,
  className,
}: RSVPStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-display font-bold text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full',
        statusStyles[status],
        className
      )}
    >
      {label || statusLabels[status]}
    </span>
  );
}
