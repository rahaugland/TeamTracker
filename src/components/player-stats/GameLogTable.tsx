import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculatePlayerRating, type GameStatLine, type StatEntryWithEvent } from '@/services/player-stats.service';
import type { VolleyballPosition } from '@/types/database.types';

interface GameLogTableProps {
  gameStats: GameStatLine[];
  position?: VolleyballPosition;
}

type SortField = 'date' | 'kills' | 'killPct' | 'aces' | 'digs' | 'blocks' | 'blockTouches' | 'passRating' | 'setRating' | 'setsPlayed' | 'result' | 'rating' | 'ratingChange';
type SortDirection = 'asc' | 'desc';

function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) {
    return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-30" />;
  }
  return sortDirection === 'asc' ? (
    <ArrowUp className="ml-1 h-3 w-3 inline" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3 inline" />
  );
}

/**
 * Sortable table showing full stat line per game
 */
export function GameLogTable({ gameStats, position }: GameLogTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Compute cumulative player rating after each game and the delta from the previous game
  const ratingMap = useMemo(() => {
    if (!position) return new Map<string, { rating: number; delta: number | null }>();

    const byDate = [...gameStats].sort(
      (a, b) => a.event.start_time.localeCompare(b.event.start_time)
    );

    const map = new Map<string, { rating: number; delta: number | null }>();
    let prevRating: number | null = null;

    for (let i = 0; i < byDate.length; i++) {
      // All games up to and including the current one
      const gamesUpToNow = byDate.slice(0, i + 1) as unknown as StatEntryWithEvent[];
      const cumulativeRating = calculatePlayerRating(gamesUpToNow, position);
      const delta = prevRating != null ? cumulativeRating.overall - prevRating : null;
      map.set(byDate[i].id, { rating: cumulativeRating.overall, delta });
      prevRating = cumulativeRating.overall;
    }

    return map;
  }, [gameStats, position]);

  const sortedStats = useMemo(() => {
    return [...gameStats].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.event.start_time).getTime();
          bValue = new Date(b.event.start_time).getTime();
          break;
        case 'kills':
          aValue = a.kills;
          bValue = b.kills;
          break;
        case 'killPct':
          aValue = a.killPercentage;
          bValue = b.killPercentage;
          break;
        case 'aces':
          aValue = a.aces;
          bValue = b.aces;
          break;
        case 'digs':
          aValue = a.digs;
          bValue = b.digs;
          break;
        case 'blocks':
          aValue = a.totalBlocks;
          bValue = b.totalBlocks;
          break;
        case 'blockTouches':
          aValue = a.block_touches;
          bValue = b.block_touches;
          break;
        case 'setsPlayed':
          aValue = a.sets_played;
          bValue = b.sets_played;
          break;
        case 'passRating':
          aValue = a.passRating;
          bValue = b.passRating;
          break;
        case 'setRating':
          aValue = a.setRating ?? 0;
          bValue = b.setRating ?? 0;
          break;
        case 'result':
          aValue = (a.event.sets_won ?? 0) - (a.event.sets_lost ?? 0);
          bValue = (b.event.sets_won ?? 0) - (b.event.sets_lost ?? 0);
          break;
        case 'rating':
          aValue = ratingMap.get(a.id)?.rating ?? 0;
          bValue = ratingMap.get(b.id)?.rating ?? 0;
          break;
        case 'ratingChange':
          aValue = ratingMap.get(a.id)?.delta ?? 0;
          bValue = ratingMap.get(b.id)?.delta ?? 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [gameStats, sortField, sortDirection, ratingMap]);

  if (gameStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Game Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No game data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('date')}
                >
                  Date
                  <SortIcon sortField={sortField} sortDirection={sortDirection} field="date" />
                </TableHead>
                <TableHead>Opponent</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-center"
                  onClick={() => handleSort('result')}
                >
                  Result
                  <SortIcon sortField={sortField} sortDirection={sortDirection} field="result" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort('kills')}
                >
                  K
                  <SortIcon sortField={sortField} sortDirection={sortDirection} field="kills" />
                </TableHead>
                <TableHead className="text-right">E</TableHead>
                <TableHead className="text-right">TA</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort('killPct')}
                >
                  K%
                  <SortIcon sortField={sortField} sortDirection={sortDirection} field="killPct" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort('aces')}
                >
                  Aces
                  <SortIcon sortField={sortField} sortDirection={sortDirection} field="aces" />
                </TableHead>
                <TableHead className="text-right">SE</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort('digs')}
                >
                  Digs
                  <SortIcon sortField={sortField} sortDirection={sortDirection} field="digs" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort('blocks')}
                >
                  Blk
                  <SortIcon sortField={sortField} sortDirection={sortDirection} field="blocks" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort('blockTouches')}
                >
                  BT
                  <SortIcon sortField={sortField} sortDirection={sortDirection} field="blockTouches" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort('passRating')}
                >
                  Pass
                  <SortIcon sortField={sortField} sortDirection={sortDirection} field="passRating" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort('setRating')}
                >
                  Set
                  <SortIcon sortField={sortField} sortDirection={sortDirection} field="setRating" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none text-right"
                  onClick={() => handleSort('setsPlayed')}
                >
                  Sets
                  <SortIcon sortField={sortField} sortDirection={sortDirection} field="setsPlayed" />
                </TableHead>
                {position && (
                  <>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none text-right"
                      onClick={() => handleSort('rating')}
                    >
                      Rating
                      <SortIcon sortField={sortField} sortDirection={sortDirection} field="rating" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none text-right"
                      onClick={() => handleSort('ratingChange')}
                    >
                      +/-
                      <SortIcon sortField={sortField} sortDirection={sortDirection} field="ratingChange" />
                    </TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStats.map((game) => {
                const setsWon = game.event.sets_won;
                const setsLost = game.event.sets_lost;
                const hasResult = setsWon != null && setsLost != null;
                const isWin = hasResult && setsWon > setsLost;
                const ratingInfo = ratingMap.get(game.id);

                return (
                  <TableRow key={game.id}>
                    <TableCell className="font-medium">
                      {format(new Date(game.event.start_time), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        {game.event.opponent || 'Unknown'}
                        {game.event.opponent_tier && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({'\u2605'.repeat(game.event.opponent_tier)})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {hasResult ? (
                        <span className={cn(
                          'font-mono text-sm font-semibold',
                          isWin ? 'text-emerald-400' : 'text-club-primary'
                        )}>
                          {isWin ? 'W' : 'L'} {setsWon}-{setsLost}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{game.kills}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{game.attack_errors}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{game.attack_attempts}</TableCell>
                    <TableCell className="text-right font-medium">
                      {(game.killPercentage * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-semibold text-stat text-emerald-400">{game.aces}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{game.service_errors}</TableCell>
                    <TableCell className="text-right font-semibold text-stat text-vq-teal">{game.digs}</TableCell>
                    <TableCell className="text-right font-medium">{game.totalBlocks.toFixed(1)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{game.block_touches}</TableCell>
                    <TableCell className="text-right font-medium">
                      {game.passRating > 0 ? game.passRating.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {game.setRating && game.setRating > 0 ? game.setRating.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {game.sets_played > 0 ? game.sets_played : '-'}
                    </TableCell>
                    {position && (
                      <>
                        <TableCell className="text-right font-mono font-semibold">
                          {ratingInfo ? ratingInfo.rating : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {ratingInfo?.delta != null && ratingInfo.delta !== 0 ? (
                            <span className={cn(
                              'inline-flex items-center text-xs font-mono font-semibold',
                              ratingInfo.delta > 0 ? 'text-emerald-400' : 'text-club-primary'
                            )}>
                              {ratingInfo.delta > 0 ? (
                                <TrendingUp className="h-3 w-3 mr-0.5" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-0.5" />
                              )}
                              {ratingInfo.delta > 0 ? '+' : ''}{ratingInfo.delta}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
