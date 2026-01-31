import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableColumnProps {
  id: string;
  title: string;
  bgColor: string;
  textColor: string;
  count: number;
  children: React.ReactNode;
  isDisabled?: boolean;
}

export function DroppableColumn({
  id,
  title,
  bgColor,
  textColor,
  count,
  children,
  isDisabled = false,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: isDisabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border-2 transition-all',
        bgColor,
        isOver && !isDisabled
          ? 'border-primary border-dashed shadow-lg scale-[1.02]'
          : 'border-transparent'
      )}
    >
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className={cn('font-semibold text-xs', textColor)}>{title}</h3>
          <span
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              bgColor,
              textColor
            )}
          >
            {count}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
