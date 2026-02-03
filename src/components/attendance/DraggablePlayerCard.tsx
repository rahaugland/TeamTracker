import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { PlayerWithMemberships } from '@/services/players.service';

interface DraggablePlayerCardProps {
  player: PlayerWithMemberships;
  isDraggingDisabled?: boolean;
}

export function DraggablePlayerCard({
  player,
  isDraggingDisabled = false,
}: DraggablePlayerCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
    disabled: isDraggingDisabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 p-2 bg-card border border-white/[0.06] rounded-lg shadow-sm transition-all',
        isDraggingDisabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 shadow-lg',
        !isDraggingDisabled && 'hover:shadow-md hover:border-primary/50'
      )}
    >
      {/* Player avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={player.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          player.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{player.name}</p>
      </div>

      {/* Jersey number badge */}
      {player.team_memberships?.[0]?.jersey_number && (
        <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          #{player.team_memberships[0].jersey_number}
        </span>
      )}
    </div>
  );
}
