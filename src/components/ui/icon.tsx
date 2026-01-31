import { memo } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconProps {
  icon: LucideIcon;
  className?: string;
  size?: number | 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}

/**
 * Optimized Icon wrapper component
 * Memoized to prevent unnecessary re-renders
 * Provides consistent sizing and styling
 */
export const Icon = memo(function Icon({
  icon: IconComponent,
  className,
  size = 'md',
  'aria-label': ariaLabel,
}: IconProps) {
  // Convert size to actual pixels
  const sizeValue = typeof size === 'number'
    ? size
    : size === 'sm'
    ? 16
    : size === 'lg'
    ? 24
    : 20;

  return (
    <IconComponent
      className={cn('flex-shrink-0', className)}
      size={sizeValue}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    />
  );
});

/**
 * Usage examples:
 *
 * import { Calendar } from 'lucide-react';
 * import { Icon } from '@/components/ui/icon';
 *
 * <Icon icon={Calendar} size="sm" />
 * <Icon icon={Calendar} size={18} />
 * <Icon icon={Calendar} className="text-primary" aria-label="Calendar icon" />
 */
