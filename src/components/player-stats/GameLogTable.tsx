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
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { GameStatLine } from '@/services/player-stats.service';

interface GameLogTableProps {
  gameStats: GameStatLine[];
}

type SortField = 'date' | 'kills' | 'killPct' | 'aces' | 'digs' | 'blocks' | 'blockTouches' | 'passRating' | 'setRating' | 'setsPlayed';
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
export function GameLogTable({ gameStats }: GameLogTableProps) {
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
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [gameStats, sortField, sortDirection]);

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStats.map((game) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
