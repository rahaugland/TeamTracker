import { cn } from '@/lib/utils';

export type ViewMode = 'card' | 'spreadsheet';

export interface ViewToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  className?: string;
}

/**
 * ViewToggle component
 * Toggle between Player Cards view and Spreadsheet view
 */
export function ViewToggle({ mode, onModeChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex gap-1 p-1 bg-navy-90 rounded-lg',
        className
      )}
    >
      <button
        onClick={() => onModeChange('card')}
        className={cn(
          'font-display font-semibold text-xs uppercase tracking-wider',
          'px-4 py-2 rounded transition-all',
          mode === 'card'
            ? 'bg-vq-teal text-white'
            : 'text-gray-400 hover:text-white'
        )}
      >
        Player Cards
      </button>
      <button
        onClick={() => onModeChange('spreadsheet')}
        className={cn(
          'font-display font-semibold text-xs uppercase tracking-wider',
          'px-4 py-2 rounded transition-all',
          mode === 'spreadsheet'
            ? 'bg-vq-teal text-white'
            : 'text-gray-400 hover:text-white'
        )}
      >
        Spreadsheet
      </button>
    </div>
  );
}
