import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatInputRowProps {
  label: string;
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

/**
 * StatInputRow component
 * Individual stat input with +/- buttons for incrementing/decrementing values
 */
export function StatInputRow({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  className,
}: StatInputRowProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span className="font-display font-semibold text-xs uppercase tracking-wide text-gray-400 flex-1">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className={cn(
            'w-8 h-8 rounded flex items-center justify-center',
            'bg-navy-80 border border-white/10',
            'text-red-400 hover:bg-navy-70 hover:border-white/20',
            'transition-all active:scale-95',
            'disabled:opacity-30 disabled:cursor-not-allowed'
          )}
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="w-12 h-8 bg-navy-80 border border-white/10 rounded flex items-center justify-center">
          <span className="font-mono font-bold text-base text-white">{value}</span>
        </div>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className={cn(
            'w-8 h-8 rounded flex items-center justify-center',
            'bg-navy-80 border border-white/10',
            'text-green-400 hover:bg-navy-70 hover:border-white/20',
            'transition-all active:scale-95',
            'disabled:opacity-30 disabled:cursor-not-allowed'
          )}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
