import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useGameAnalysis } from '@/hooks/useGameAnalysis';
import type { DateRange } from '@/services/analytics.service';

interface GameAnalysisTabProps {
  teamId: string;
  dateRange?: DateRange;
}

export function GameAnalysisTab({ teamId, dateRange }: GameAnalysisTabProps) {
  const { t } = useTranslation();
  const { gameStats, tierAnalysis, setAnalysis, opponentHistory, isLoading } =
    useGameAnalysis(teamId, dateRange);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-28 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="animate-pulse h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  const wins = gameStats.filter((g) => g.result === 'W').length;
  const losses = gameStats.filter((g) => g.result === 'L').length;
  const totalGames = gameStats.length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {setAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label={t('reports.games.record')}
            value={`${wins}-${losses}`}
            delta={totalGames > 0 ? `${Math.round((wins / totalGames) * 100)}% win rate` : undefined}
            deltaType={wins > losses ? 'positive' : 'negative'}
            accent="success"
          />
          <StatCard
            label={t('reports.games.setsRecord')}
            value={`${setAnalysis.totalSetsWon}-${setAnalysis.totalSetsLost}`}
            accent="teal"
          />
          <StatCard
            label={t('reports.games.closeSets')}
            value={`${setAnalysis.closeSetsWon}-${setAnalysis.closeSetsLost}`}
            delta={t('reports.games.closeSetsDescription')}
            accent="primary"
          />
          <StatCard
            label={t('reports.games.pointDiff')}
            value={setAnalysis.avgPointDifferential > 0
              ? `+${setAnalysis.avgPointDifferential}`
              : `${setAnalysis.avgPointDifferential}`}
            deltaType={setAnalysis.avgPointDifferential > 0 ? 'positive' : 'negative'}
            accent="secondary"
          />
        </div>
      )}

      {/* Game Results Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.games.results')}</CardTitle>
        </CardHeader>
        <CardContent>
          {gameStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('reports.games.noGames')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.games.date')}</TableHead>
                  <TableHead>{t('reports.games.opponent')}</TableHead>
                  <TableHead className="text-center">{t('reports.games.score')}</TableHead>
                  <TableHead className="text-center">{t('reports.games.result')}</TableHead>
                  <TableHead className="text-right">{t('reports.games.killPct')}</TableHead>
                  <TableHead className="text-right">{t('reports.games.servePct')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gameStats.slice(0, 20).map((game) => (
                  <TableRow key={game.eventId}>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(game.date), 'MMM d')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {game.opponent || t('reports.games.unknownOpponent')}
                    </TableCell>
                    <TableCell className="text-center">
                      {game.setsWon}-{game.setsLost}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={game.result === 'W' ? 'default' : 'destructive'}
                        className={
                          game.result === 'W'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : game.result === 'L'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : ''
                        }
                      >
                        {game.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(game.killPercentage * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(game.servePercentage * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Performance by Opponent Tier */}
      {tierAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.games.tierAnalysis')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tierAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="tierLabel" tick={{ fill: '#8B95A5', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8B95A5' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Legend wrapperStyle={{ color: '#8B95A5' }} />
                <Bar dataKey="winPct" name={t('reports.games.winPct')} fill="#2EC4B6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgKillPct" name={t('reports.games.avgKillPct')} fill="#F4A261" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Opponent History */}
      {opponentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.games.opponentHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.games.opponent')}</TableHead>
                  <TableHead className="text-center">{t('reports.games.record')}</TableHead>
                  <TableHead className="text-center">{t('reports.games.gamesPlayed')}</TableHead>
                  <TableHead className="text-right">{t('reports.games.lastPlayed')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opponentHistory.map((opp) => (
                  <TableRow key={opp.opponent}>
                    <TableCell className="font-medium">{opp.opponent}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-400">{opp.wins}W</span>
                      {' - '}
                      <span className="text-red-400">{opp.losses}L</span>
                    </TableCell>
                    <TableCell className="text-center">{opp.gamesPlayed}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {format(parseISO(opp.lastPlayed), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
