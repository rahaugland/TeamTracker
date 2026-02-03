import * as React from 'react';
import { cn } from '@/lib/utils';

export type PlayerAvatarSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<PlayerAvatarSize, string> = {
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
};

const positionTagSizes: Record<PlayerAvatarSize, string> = {
  sm: 'text-[8px] px-1.5 py-0.5 -bottom-1 -right-1',
  md: 'text-[9px] px-2 py-0.5 -bottom-1.5 -right-1.5',
  lg: 'text-[10px] px-2.5 py-1 -bottom-2 -right-2',
};

export interface PlayerAvatarProps {
  initials: string;
  imageUrl?: string;
  position?: string;
  size?: PlayerAvatarSize;
  className?: string;
}

export function PlayerAvatar({
  initials,
  imageUrl,
  position,
  size = 'sm',
  className,
}: PlayerAvatarProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      {/* Avatar Circle */}
      <div
        className={cn(
          'rounded-full bg-navy-70 flex items-center justify-center font-display font-bold text-vq-teal',
          sizeClasses[size]
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={initials}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Position Tag */}
      {position && (
        <span
          className={cn(
            'absolute font-display font-bold uppercase tracking-wide rounded bg-navy-80 text-gray-300 border border-white/10',
            positionTagSizes[size]
          )}
        >
          {position}
        </span>
      )}
    </div>
  );
}
