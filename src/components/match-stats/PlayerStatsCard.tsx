import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatCategoryCard } from './StatCategoryCard';
import { PlayingTimeCard } from './PlayingTimeCard';
import { STAT_CATEGORIES } from './stat-categories';
import type { PlayerStatRow, PlayerInfo } from './types';

export interface PlayerStatsCardProps {
  player: PlayerStatRow;
  playerInfo?: PlayerInfo;
  onStatChange: (field: keyof PlayerStatRow, value: number) => void;
  onRotationChange: (rotation: number | null) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  className?: string;
}

/**
 * PlayerStatsCard component
 * Individual player stats display with all 6 categories and playing time
 */
export function PlayerStatsCard({
  player,
  playerInfo,
  onStatChange,
  onRotationChange,
  onNavigate,
  canNavigatePrev,
  canNavigateNext,
  className,
}: PlayerStatsCardProps) {
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(player.playerName);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Player Header Card */}
      <div className="bg-navy-90 border border-white/5 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-navy-70 flex items-center justify-center">
              <span className="font-display font-bold text-lg text-vq-teal">
                {initials}
              </span>
            </div>
            <div>
              <h3 className="font-display font-bold text-lg uppercase text-white">
                {player.playerName}
              </h3>
              <p className="text-sm text-gray-400">
                {playerInfo?.position || 'Player'}
                {playerInfo?.jerseyNumber && ` \u2022 #${playerInfo.jerseyNumber}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('prev')}
              disabled={!canNavigatePrev}
              className={cn(
                'w-9 h-9 rounded flex items-center justify-center',
                'bg-navy-80 border border-white/10',
                'text-white transition-all',
                canNavigatePrev
                  ? 'hover:bg-navy-70 hover:border-white/20'
                  : 'opacity-30 cursor-not-allowed'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('next')}
              disabled={!canNavigateNext}
              className={cn(
                'w-9 h-9 rounded flex items-center justify-center',
                'bg-navy-80 border border-white/10',
                'text-white transition-all',
                canNavigateNext
                  ? 'hover:bg-navy-70 hover:border-white/20'
                  : 'opacity-30 cursor-not-allowed'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stat Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STAT_CATEGORIES.map((category) => {
          const calculatedStat = category.calculated
            ? {
                label: category.calculated.label,
                value: category.calculated.compute(player),
                status: category.calculated.getStatus?.(player) || 'neutral',
              }
            : undefined;

          return (
            <StatCategoryCard
              key={category.id}
              title={category.title}
              icon={category.icon}
              color={category.color}
              stats={category.stats}
              values={player}
              calculatedStat={calculatedStat as any}
              onStatChange={onStatChange}
            />
          );
        })}
      </div>

      {/* Playing Time Card */}
      <PlayingTimeCard
        rotation={player.rotation}
        setsPlayed={player.setsPlayed}
        rotationsPlayed={player.rotationsPlayed}
        onRotationChange={onRotationChange}
        onSetsPlayedChange={(value) => onStatChange('setsPlayed', value)}
        onRotationsPlayedChange={(value) => onStatChange('rotationsPlayed', value)}
        className="max-w-md"
      />
    </div>
  );
}
