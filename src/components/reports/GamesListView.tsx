import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGameAnalysis } from '@/hooks/useGameAnalysis';
import type { DateRange } from '@/services/analytics.service';

interface GamesListViewProps {
  teamId: string;
  dateRange?: DateRange;
  onSelectGame: (eventId: string) => void;
}

type ResultFilter = 'all' | 'wins' | 'losses';

function getTierLabel(tier: number): { label: string; className: string } {
  if (tier >= 7) return { label: `T${tier}`, className: 'bg-red-500/20 text-red-400 border-red-500/30' };
  if (tier >= 4) return { label: `T${tier}`, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
  return { label: `T${tier}`, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
}

export function GamesListView({ teamId, dateRange, onSelectGame }: GamesListViewProps) {
  const { t } = useTranslation();
  const { gameStats, upcomingGames, mvpMap, isLoading } = useGameAnalysis(teamId, dateRange);
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [opponentFilter, setOpponentFilter] = useState<string>('all');

  // Unique opponents for filter dropdown
  const opponents = useMemo(() => {
    const set = new Set<string>();
    for (const g of gameStats) {
      if (g.opponent) set.add(g.opponent);
    }
    return [...set].sort();
  }, [gameStats]);

  // Filtered completed games
  const filteredGames = useMemo(() => {
    let games = gameStats;
    if (resultFilter === 'wins') games = games.filter((g) => g.result === 'W');
    else if (resultFilter === 'losses') games = games.filter((g) => g.result === 'L');
    if (opponentFilter !== 'all') games = games.filter((g) => g.opponent === opponentFilter);
    return games;
  }, [gameStats, resultFilter, opponentFilter]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse h-20 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  const hasGames = gameStats.length > 0 || upcomingGames.length > 0;

  if (!hasGames) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        {t('reports.games.noGames')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex gap-3 flex-wrap">
        <Select value={resultFilter} onValueChange={(v) => setResultFilter(v as ResultFilter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('reports.games.allResults')}</SelectItem>
            <SelectItem value="wins">{t('reports.games.winsOnly')}</SelectItem>
            <SelectItem value="losses">{t('reports.games.lossesOnly')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={opponentFilter} onValueChange={setOpponentFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('reports.games.allOpponents')}</SelectItem>
            {opponents.map((opp) => (
              <SelectItem key={opp} value={opp}>{opp}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Upcoming Section */}
      {upcomingGames.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('reports.games.upcoming')}
          </h3>
          {upcomingGames.map((game) => {
            const date = new Date(game.start_time);
            const monthStr = date.toLocaleDateString(undefined, { month: 'short' });
            const dayStr = date.getDate();
            return (
              <div
                key={game.id}
                className="w-full bg-navy-90/50 border border-white/[0.04] rounded-lg p-4 opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center w-14 flex-shrink-0">
                    <div className="text-xs text-muted-foreground uppercase">{monthStr}</div>
                    <div className="text-xl font-bold">{dayStr}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {game.opponent || t('reports.games.unknownOpponent')}
                    </p>
                    {game.opponent_tier && (
                      <Badge variant="outline" className={`mt-1 text-[10px] ${getTierLabel(game.opponent_tier).className}`}>
                        {getTierLabel(game.opponent_tier).label}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground italic">
                    {t('reports.games.noReport')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Section */}
      {filteredGames.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('reports.games.completed')}
          </h3>
          {filteredGames.map((game) => {
            const date = new Date(game.date);
            const monthStr = date.toLocaleDateString(undefined, { month: 'short' });
            const dayStr = date.getDate();
            const won = game.result === 'W';
            const mvp = mvpMap.get(game.eventId);
            const tier = game.opponentTier ? getTierLabel(game.opponentTier) : null;

            return (
              <div
                key={game.eventId}
                className="w-full bg-navy-90 border border-white/[0.06] rounded-lg p-4 transition-all duration-200 hover:border-white/[0.12] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  {/* Date Column */}
                  <div className="text-center w-14 flex-shrink-0">
                    <div className="text-xs text-muted-foreground uppercase">{monthStr}</div>
                    <div className="text-xl font-bold">{dayStr}</div>
                  </div>

                  {/* Opponent + Tier */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {game.opponent || t('reports.games.unknownOpponent')}
                      </p>
                      {tier && (
                        <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${tier.className}`}>
                          {tier.label}
                        </Badge>
                      )}
                    </div>
                    {mvp && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-vq-teal" />
                        MVP: {mvp.playerName}{mvp.stat ? ` (${mvp.stat})` : ''}
                      </p>
                    )}
                  </div>

                  {/* Score */}
                  <span className="font-mono text-lg font-bold">
                    {game.setsWon} : {game.setsLost}
                  </span>

                  {/* Result Badge */}
                  <Badge
                    variant={won ? 'default' : 'destructive'}
                    className={
                      won
                        ? 'bg-green-500/20 text-green-400 border-green-500/30 min-w-[48px] justify-center uppercase font-bold text-xs'
                        : 'bg-red-500/20 text-red-400 border-red-500/30 min-w-[48px] justify-center uppercase font-bold text-xs'
                    }
                  >
                    {won ? 'WIN' : 'LOSS'}
                  </Badge>

                  {/* View Report Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-vq-teal hover:text-vq-teal/80 flex-shrink-0"
                    onClick={() => onSelectGame(game.eventId)}
                  >
                    {t('reports.games.viewReport')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredGames.length === 0 && gameStats.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {t('reports.games.noGames')}
        </div>
      )}
    </div>
  );
}
