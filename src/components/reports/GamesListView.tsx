import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { useGameAnalysis } from '@/hooks/useGameAnalysis';
import type { DateRange } from '@/services/analytics.service';

interface GamesListViewProps {
  teamId: string;
  dateRange?: DateRange;
  onSelectGame: (eventId: string) => void;
}

export function GamesListView({ teamId, dateRange, onSelectGame }: GamesListViewProps) {
  const { t } = useTranslation();
  const { gameStats, isLoading } = useGameAnalysis(teamId, dateRange);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse h-20 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  // Already filtered to past games and sorted by most recent first from the hook
  const games = gameStats;

  if (games.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        {t('reports.games.noGames')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {games.map((game) => {
        const date = new Date(game.date);
        const monthStr = date.toLocaleDateString(undefined, { month: 'short' });
        const dayStr = date.getDate();
        const won = game.result === 'W';

        return (
          <button
            key={game.eventId}
            type="button"
            className="w-full bg-navy-90 border border-white/[0.06] rounded-lg p-4 text-left transition-all duration-200 hover:border-white/[0.12] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vq-teal"
            onClick={() => onSelectGame(game.eventId)}
          >
            <div className="flex items-center gap-4">
              {/* Date Column */}
              <div className="text-center w-14 flex-shrink-0">
                <div className="text-xs text-muted-foreground uppercase">{monthStr}</div>
                <div className="text-xl font-bold">{dayStr}</div>
              </div>

              {/* Opponent */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {game.opponent || t('reports.games.unknownOpponent')}
                </p>
              </div>

              {/* Score */}
              <span className="font-mono text-lg font-bold">
                {game.setsWon}-{game.setsLost}
              </span>

              {/* Result Badge */}
              <Badge
                variant={won ? 'default' : 'destructive'}
                className={
                  won
                    ? 'bg-green-500/20 text-green-400 border-green-500/30 min-w-[28px] justify-center'
                    : 'bg-red-500/20 text-red-400 border-red-500/30 min-w-[28px] justify-center'
                }
              >
                {won ? t('reports.postMatch.won') : t('reports.postMatch.lost')}
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
}
