import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';
import type { TeamGameStat } from '@/services/team-stats.service';

interface TeamGameLogProps {
  gameStats: TeamGameStat[];
  isLoading?: boolean;
}

/**
 * TeamGameLog component
 * Displays list of game results with stats
 */
export function TeamGameLog({ gameStats, isLoading = false }: TeamGameLogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [opponentFilter, setOpponentFilter] = useState('');

  const filteredStats = useMemo(() => {
    if (!opponentFilter.trim()) return gameStats;
    const query = opponentFilter.toLowerCase().trim();
    return gameStats.filter(
      (g) => g.opponent?.toLowerCase().includes(query)
    );
  }, [gameStats, opponentFilter]);

  const h2hRecord = useMemo(() => {
    if (!opponentFilter.trim() || filteredStats.length === 0) return null;
    const w = filteredStats.filter((g) => g.result === 'W').length;
    const l = filteredStats.filter((g) => g.result === 'L').length;
    const d = filteredStats.filter((g) => g.result === 'D').length;
    return { w, l, d };
  }, [filteredStats, opponentFilter]);

  const getResultBadge = (result: 'W' | 'L' | 'D') => {
    if (result === 'W') {
      return <Badge className="bg-emerald-500 text-white">W</Badge>;
    }
    if (result === 'L') {
      return <Badge className="bg-club-primary text-white">L</Badge>;
    }
    return <Badge variant="secondary">D</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('team.dashboard.gameLog')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('team.dashboard.gameLog')}</CardTitle>
            <CardDescription>
              {t('player.stats.trends.lastGames', { count: gameStats.length })}
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('team.dashboard.searchOpponent')}
              value={opponentFilter}
              onChange={(e) => setOpponentFilter(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        {h2hRecord && (
          <div className="flex items-center gap-2 mt-2 text-sm">
            <span className="text-muted-foreground">{t('team.dashboard.headToHead')}:</span>
            <Badge className="bg-emerald-500 text-white">{h2hRecord.w}W</Badge>
            <Badge className="bg-club-primary text-white">{h2hRecord.l}L</Badge>
            {h2hRecord.d > 0 && <Badge variant="secondary">{h2hRecord.d}D</Badge>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredStats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('team.dashboard.noGames')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('team.dashboard.date')}</TableHead>
                  <TableHead>{t('team.dashboard.opponent')}</TableHead>
                  <TableHead className="text-center">{t('team.dashboard.result')}</TableHead>
                  <TableHead className="text-center">{t('team.dashboard.score')}</TableHead>
                  <TableHead className="text-right">{t('team.dashboard.killPct')}</TableHead>
                  <TableHead className="text-right">{t('team.dashboard.servePct')}</TableHead>
                  <TableHead className="text-right">{t('team.dashboard.passRtg')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStats.map((game) => (
                  <TableRow
                    key={game.eventId}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => navigate(`/events/${game.eventId}`)}
                  >
                    <TableCell className="font-medium">{formatDate(game.date)}</TableCell>
                    <TableCell>{game.opponent || 'Unknown'}</TableCell>
                    <TableCell className="text-center">{getResultBadge(game.result)}</TableCell>
                    <TableCell className="text-center">
                      {game.setsWon}-{game.setsLost}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(game.killPercentage)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(game.servePercentage)}
                    </TableCell>
                    <TableCell className="text-right">{game.passRating.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
