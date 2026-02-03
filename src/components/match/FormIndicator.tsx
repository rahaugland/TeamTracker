import { cn } from '@/lib/utils';

export type FormStatus = 'good' | 'average' | 'poor';

const formStyles: Record<FormStatus, string> = {
  good: 'bg-green-500',
  average: 'bg-yellow-500',
  poor: 'bg-red-500',
};

const formTooltips: Record<FormStatus, string> = {
  good: 'Good form',
  average: 'Average form',
  poor: 'Below average form',
};

export interface FormIndicatorProps {
  form: FormStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

/**
 * FormIndicator component
 * Displays a colored dot indicating player form (good/average/poor)
 * Based on recent performance metrics
 */
export function FormIndicator({
  form,
  size = 'md',
  className,
  showTooltip = true,
}: FormIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full shrink-0',
        formStyles[form],
        sizeClasses[size],
        className
      )}
      title={showTooltip ? formTooltips[form] : undefined}
      aria-label={formTooltips[form]}
    />
  );
}
