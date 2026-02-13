import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/player/PlayerAvatar';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { usePlayerReport } from '@/hooks/usePlayerReport';
import type { DateRange } from '@/services/analytics.service';
import type { VolleyballPosition } from '@/types/database.types';

interface PlayerReportCardProps {
  playerId: string;
  playerName: string;
  photoUrl?: string;
  position: VolleyballPosition;
  teamId: string;
  dateRange?: DateRange;
  onBack: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function RatingBar({ label, value, max = 99 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 text-right">{label}</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-vq-teal rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs w-8 text-right">{value}</span>
    </div>
  );
}

export function PlayerReportCard({
  playerId,
  playerName,
  photoUrl,
  position,
  teamId,
  dateRange,
  onBack,
}: PlayerReportCardProps) {
  const { t } = useTranslation();
  const { rating, aggregated, gameStatLines, perGameRatings, periodDelta, isLoading } =
    usePlayerReport(playerId, teamId, position, dateRange);

  // Build a map of per-game rating deltas (change from previous game)
  const ratingDeltaMap = useMemo(() => {
    const map = new Map<string, { rating: number; delta: number | null }>();
    // perGameRatings is sorted ascending by date
    for (let i = 0; i < perGameRatings.length; i++) {
      const entry = perGameRatings[i];
      const prevRating = i > 0 ? perGameRatings[i - 1].rating : null;
      map.set(entry.date, {
        rating: entry.rating,
        delta: prevRating != null ? entry.rating - prevRating : null,
      });
    }
    return map;
  }, [perGameRatings]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-10 w-40 bg-muted rounded" />
        <div className="animate-pulse h-48 bg-muted rounded-lg" />
        <div className="animate-pulse h-64 bg-muted rounded-lg" />
        <div className="animate-pulse h-48 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        {t('reports.playerReport.back')}
      </Button>

      {/* Header Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <PlayerAvatar
                initials={getInitials(playerName)}
                imageUrl={photoUrl}
                size="lg"
              />
              <div>
                <h2 className="text-xl font-bold">{playerName}</h2>
                <Badge variant="secondary" className="mt-1">
                  {t(`player.positions.${position}`, position)}
                </Badge>
                {rating?.isProvisional && (
                  <Badge variant="outline" className="ml-2 mt-1 text-xs">
                    {t('reports.playerReport.provisional')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Overall Rating */}
            <div className="flex items-center gap-6 md:ml-auto">
              <span className="font-mono text-5xl font-bold text-white">
                {rating?.overall ?? '-'}
              </span>
            </div>
          </div>

          {/* Sub-Rating Bars */}
          {rating && (
            <div className="mt-6 space-y-2 max-w-md">
              <RatingBar label={t('reports.playerReport.attack')} value={rating.subRatings.attack} />
              <RatingBar label={t('reports.playerReport.serve')} value={rating.subRatings.serve} />
              <RatingBar label={t('reports.playerReport.reception')} value={rating.subRatings.reception} />
              <RatingBar label={t('reports.playerReport.consistency')} value={rating.subRatings.consistency} />
            </div>
          )}

          {/* Stat Cards */}
          {aggregated && aggregated.gamesPlayed > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <StatCard
                label={t('reports.playerReport.killPct')}
                value={`${Math.round(aggregated.killPercentage * 1000) / 10}%`}
                accent="teal"
                delta={periodDelta.killPct != null ? `${periodDelta.killPct > 0 ? '+' : ''}${periodDelta.killPct}%` : undefined}
                deltaType={periodDelta.killPct != null ? (periodDelta.killPct > 0 ? 'positive' : periodDelta.killPct < 0 ? 'negative' : 'neutral') : undefined}
              />
              <StatCard
                label={t('reports.playerReport.acesPerGame')}
                value={Math.round(aggregated.acesPerGame * 10) / 10}
                accent="primary"
                delta={periodDelta.acesPerGame != null ? `${periodDelta.acesPerGame > 0 ? '+' : ''}${periodDelta.acesPerGame}` : undefined}
                deltaType={periodDelta.acesPerGame != null ? (periodDelta.acesPerGame > 0 ? 'positive' : periodDelta.acesPerGame < 0 ? 'negative' : 'neutral') : undefined}
              />
              <StatCard
                label={t('reports.playerReport.digsPerGame')}
                value={Math.round(aggregated.digsPerGame * 10) / 10}
                accent="success"
                delta={periodDelta.digsPerGame != null ? `${periodDelta.digsPerGame > 0 ? '+' : ''}${periodDelta.digsPerGame}` : undefined}
                deltaType={periodDelta.digsPerGame != null ? (periodDelta.digsPerGame > 0 ? 'positive' : periodDelta.digsPerGame < 0 ? 'negative' : 'neutral') : undefined}
              />
              <StatCard
                label={t('reports.playerReport.passRating')}
                value={Math.round(aggregated.passRating * 100) / 100}
                accent="secondary"
                delta={periodDelta.passRating != null ? `${periodDelta.passRating > 0 ? '+' : ''}${periodDelta.passRating}` : undefined}
                deltaType={periodDelta.passRating != null ? (periodDelta.passRating > 0 ? 'positive' : periodDelta.passRating < 0 ? 'negative' : 'neutral') : undefined}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Development Trends Chart */}
      {perGameRatings.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.playerReport.trends')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={perGameRatings}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#8B95A5', fontSize: 11 }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis
                  domain={[0, 99]}
                  tick={{ fill: '#8B95A5', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#2EC4B6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Games Table */}
      {gameStatLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.playerReport.recentGames')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.playerReport.date')}</TableHead>
                  <TableHead>{t('reports.playerReport.opponent')}</TableHead>
                  <TableHead className="text-center">{t('reports.playerReport.result')}</TableHead>
                  <TableHead className="text-center">{t('reports.playerReport.kills')}</TableHead>
                  <TableHead className="text-center">{t('reports.playerReport.aces')}</TableHead>
                  <TableHead className="text-center">{t('reports.playerReport.digs')}</TableHead>
                  <TableHead className="text-center">{t('reports.playerReport.blocks')}</TableHead>
                  <TableHead className="text-center">{t('reports.playerReport.killPct')}</TableHead>
                  <TableHead className="text-right">{t('reports.playerReport.rating')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gameStatLines.slice(0, 8).map((line) => {
                  const dateKey = line.event.start_time.substring(0, 10);
                  const ratingInfo = ratingDeltaMap.get(dateKey);
                  const setsWon = line.event.sets_won;
                  const setsLost = line.event.sets_lost;
                  const hasResult = setsWon != null && setsLost != null;
                  const isWin = hasResult && setsWon > setsLost;

                  return (
                    <TableRow key={line.event.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(line.event.start_time).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {line.event.opponent ?? '-'}
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
                      <TableCell className="text-center font-mono">{line.kills}</TableCell>
                      <TableCell className="text-center font-mono">{line.aces}</TableCell>
                      <TableCell className="text-center font-mono">{line.digs}</TableCell>
                      <TableCell className="text-center font-mono">
                        {Math.round(line.totalBlocks)}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {Math.round(line.killPercentage * 1000) / 10}%
                      </TableCell>
                      <TableCell className="text-right">
                        {ratingInfo ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-mono font-semibold">{ratingInfo.rating}</span>
                            {ratingInfo.delta != null && ratingInfo.delta !== 0 && (
                              <span className={cn(
                                'flex items-center text-xs font-mono',
                                ratingInfo.delta > 0 ? 'text-emerald-400' : 'text-club-primary'
                              )}>
                                {ratingInfo.delta > 0 ? (
                                  <TrendingUp className="h-3 w-3 mr-0.5" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-0.5" />
                                )}
                                {ratingInfo.delta > 0 ? '+' : ''}{ratingInfo.delta}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
