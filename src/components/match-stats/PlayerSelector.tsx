import { cn } from '@/lib/utils';
import type { PlayerStatRow, PlayerInfo } from './types';

export interface PlayerSelectorProps {
  players: Array<PlayerStatRow & { info?: PlayerInfo }>;
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
  className?: string;
}

/**
 * PlayerSelector component
 * Horizontal scrollable list of player chips for selecting active player
 */
export function PlayerSelector({
  players,
  selectedPlayerId,
  onSelectPlayer,
  className,
}: PlayerSelectorProps) {
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10',
        className
      )}
    >
      {players.map((player) => {
        const isActive = player.playerId === selectedPlayerId;
        const initials = getInitials(player.playerName);

        return (
          <button
            key={player.playerId}
            onClick={() => onSelectPlayer(player.playerId)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0',
              'border transition-all',
              isActive
                ? 'bg-vq-teal border-vq-teal text-white'
                : 'bg-navy-90 border-white/5 hover:border-white/15 text-white'
            )}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center',
                'font-display font-bold text-[10px]',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-navy-70 text-vq-teal'
              )}
            >
              {initials}
            </div>
            <span className="font-display font-semibold text-sm">
              {player.playerName}
            </span>
            {player.info?.jerseyNumber && (
              <span
                className={cn(
                  'font-mono text-xs',
                  isActive ? 'text-white/70' : 'text-gray-500'
                )}
              >
                #{player.info.jerseyNumber}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
