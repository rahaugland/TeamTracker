import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ActionBarProps {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onCancel: () => void;
  onSaveAll: () => void;
  onFinalize: () => void;
  canFinalize: boolean;
  className?: string;
}

/**
 * ActionBar component
 * Sticky bottom action bar with save status and action buttons
 */
export function ActionBar({
  isSaving,
  hasUnsavedChanges,
  onCancel,
  onSaveAll,
  onFinalize,
  canFinalize,
  className,
}: ActionBarProps) {
  const getSaveStatus = () => {
    if (isSaving) return { text: 'Saving...', dotClass: 'bg-yellow-500 animate-pulse' };
    if (hasUnsavedChanges) return { text: 'Unsaved changes', dotClass: 'bg-yellow-500' };
    return { text: 'All changes saved', dotClass: 'bg-green-500' };
  };

  const status = getSaveStatus();

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4',
        'bg-navy-90 border border-white/5 rounded-lg',
        'sticky bottom-6',
        className
      )}
    >
      {/* Save Status */}
      <div className="flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full', status.dotClass)} />
        <span className="text-sm text-gray-400">{status.text}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onSaveAll}
          disabled={isSaving || !hasUnsavedChanges}
          className="bg-vq-teal hover:bg-vq-teal/90"
        >
          {isSaving ? 'Saving...' : 'Save All Stats'}
        </Button>
        <Button
          onClick={onFinalize}
          disabled={!canFinalize || isSaving}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Finalize Match
        </Button>
      </div>
    </div>
  );
}
