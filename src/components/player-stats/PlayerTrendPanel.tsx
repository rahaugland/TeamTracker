import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimePeriodSelector } from './TimePeriodSelector';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  GameStatLine,
  PlayerForm,
  AggregatedStats,
  TimePeriod,
  CustomDateRange,
} from '@/services/player-stats.service';

interface PlayerTrendPanelProps {
  gameStatLines: GameStatLine[];
  playerForm: PlayerForm | null;
  aggregatedStats: AggregatedStats | null;
  period: TimePeriod;
  customRange?: CustomDateRange;
  onPeriodChange: (period: TimePeriod, customRange?: CustomDateRange) => void;
  isLoading: boolean;
}

interface TrendData {
  direction: 'up' | 'down' | 'stable';
  delta: number;
  recentAvg: number;
}

interface TrendMetrics {
  killPct: TrendData;
  servePct: TrendData;
  passRating: TrendData;
  errorRate: TrendData;
  overall: TrendData;
}

/**
 * Calculate trends by comparing last 5 games vs previous 5 games
 */
function calculateTrends(gameStatLines: GameStatLine[]): TrendMetrics {
  if (gameStatLines.length < 2) {
    return {
      killPct: { direction: 'stable', delta: 0, recentAvg: 0 },
      servePct: { direction: 'stable', delta: 0, recentAvg: 0 },
      passRating: { direction: 'stable', delta: 0, recentAvg: 0 },
      errorRate: { direction: 'stable', delta: 0, recentAvg: 0 },
      overall: { direction: 'stable', delta: 0, recentAvg: 0 },
    };
  }

  const recent = gameStatLines.slice(0, Math.min(5, gameStatLines.length));
  const previous = gameStatLines.slice(5, Math.min(10, gameStatLines.length));

  // If no previous games, compare to zero baseline
  const hasPrevious = previous.length > 0;

  // Calculate averages
  const recentKillPct = recent.reduce((sum, g) => sum + g.killPercentage, 0) / recent.length;
  const previousKillPct = hasPrevious
    ? previous.reduce((sum, g) => sum + g.killPercentage, 0) / previous.length
    : 0;

  const recentServePct = recent.reduce((sum, g) => sum + g.servePercentage, 0) / recent.length;
  const previousServePct = hasPrevious
    ? previous.reduce((sum, g) => sum + g.servePercentage, 0) / previous.length
    : 0;

  const recentPassRating = recent.reduce((sum, g) => sum + g.passRating, 0) / recent.length;
  const previousPassRating = hasPrevious
    ? previous.reduce((sum, g) => sum + g.passRating, 0) / previous.length
    : 0;

  // Error rate calculation
  const recentErrorRate = recent.reduce((sum, g) => {
    const totalAttempts = g.attack_attempts + g.serve_attempts + g.pass_attempts;
    const totalErrors = g.attack_errors + g.service_errors + g.ball_handling_errors;
    return sum + (totalAttempts > 0 ? totalErrors / totalAttempts : 0);
  }, 0) / recent.length;

  const previousErrorRate = hasPrevious
    ? previous.reduce((sum, g) => {
        const totalAttempts = g.attack_attempts + g.serve_attempts + g.pass_attempts;
        const totalErrors = g.attack_errors + g.service_errors + g.ball_handling_errors;
        return sum + (totalAttempts > 0 ? totalErrors / totalAttempts : 0);
      }, 0) / previous.length
    : 0.15; // baseline error rate

  // Calculate overall trend (weighted average of sub-ratings)
  const recentOverallScore = (recentKillPct + recentServePct + recentPassRating / 3) / 2.67;
  const previousOverallScore = hasPrevious
    ? (previousKillPct + previousServePct + previousPassRating / 3) / 2.67
    : 0;

  // Helper to determine trend direction
  const getTrend = (recent: number, previous: number, threshold: number, invertDirection = false): TrendData => {
    const delta = recent - previous;
    const percentChange = previous !== 0 ? Math.abs(delta / previous) : Math.abs(delta);

    let direction: 'up' | 'down' | 'stable';
    if (percentChange > threshold) {
      if (invertDirection) {
        direction = delta > 0 ? 'down' : 'up';
      } else {
        direction = delta > 0 ? 'up' : 'down';
      }
    } else {
      direction = 'stable';
    }

    return { direction, delta, recentAvg: recent };
  };

  return {
    killPct: getTrend(recentKillPct, previousKillPct, 0.05),
    servePct: getTrend(recentServePct, previousServePct, 0.05),
    passRating: getTrend(recentPassRating, previousPassRating, 0.05),
    errorRate: getTrend(recentErrorRate, previousErrorRate, 0.05, true), // inverted - lower is better
    overall: getTrend(recentOverallScore, previousOverallScore, 0.05),
  };
}

/**
 * Get sparkline character based on rating (0-99 scale)
 */
function getSparklineBar(rating: number): { char: string; color: string } {
  const normalized = Math.min(99, Math.max(1, rating));

  // Determine color based on rating tier
  let color = 'bg-club-primary';
  if (normalized >= 70) color = 'bg-emerald-400';
  else if (normalized >= 50) color = 'bg-club-secondary';

  // Determine height (1-8 scale)
  const height = Math.ceil((normalized / 99) * 8);

  return { char: '▁▂▃▄▅▆▇█'[height - 1] || '▁', color };
}

/**
 * Player Trend Panel - Form, Trends, and Quick Stats
 */
export function PlayerTrendPanel({
  gameStatLines,
  playerForm,
  aggregatedStats,
  period,
  customRange,
  onPeriodChange,
  isLoading,
}: PlayerTrendPanelProps) {
  const { t } = useTranslation();
  const trends = calculateTrends(gameStatLines);

  // Get last 5 games for sparkline (assuming gameStatLines is sorted descending by date)
  const last5Games = gameStatLines.slice(0, 5).reverse();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">{t('common.messages.loading')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Time Period Selector */}
      <TimePeriodSelector
        period={period}
        customRange={customRange}
        onPeriodChange={onPeriodChange}
      />

      {/* Form & Trends Card */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-lg">{t('player.stats.trends.formAndTrends')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Rating */}
          {playerForm && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t('player.stats.trends.recentForm')}</div>
              <div className="flex items-end gap-2">
                <div className="text-4xl font-bold">{playerForm.formRating}</div>
                <div className="text-sm text-muted-foreground pb-1">
                  {playerForm.practicesAttended}/{playerForm.practicesTotal} {t('player.stats.trends.practices')}
                </div>
              </div>
              {/* Form bar */}
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-vq-teal h-2 rounded-full transition-all"
                  style={{ width: `${(playerForm.formRating / 99) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Overall Trend */}
          {gameStatLines.length >= 2 && (
            <div className="space-y-2 pt-4 border-t">
              <div className="text-sm text-muted-foreground">{t('player.stats.trends.overallTrend')}</div>
              <div className="flex items-center gap-3">
                <TrendIcon direction={trends.overall.direction} />
                <div className="flex-1">
                  <div className="text-lg font-semibold">
                    {trends.overall.direction === 'up' && t('player.stats.trends.improving')}
                    {trends.overall.direction === 'down' && t('player.stats.trends.declining')}
                    {trends.overall.direction === 'stable' && t('player.stats.trends.stable')}
                  </div>
                  {trends.overall.delta !== 0 && (
                    <div className="text-xs text-muted-foreground">
                      {trends.overall.delta > 0 ? '+' : ''}
                      {(trends.overall.delta * 100).toFixed(1)}% {t('player.stats.trends.vs5Games')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats with Trends */}
          {aggregatedStats && gameStatLines.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="text-sm font-medium">{t('player.stats.trends.quickStats')}</div>

              {/* Kill % */}
              <StatRow
                label={t('player.stats.trends.killPercent')}
                value={`${(aggregatedStats.killPercentage * 100).toFixed(1)}%`}
                trend={trends.killPct}
              />

              {/* Serve % */}
              <StatRow
                label={t('player.stats.trends.servePercent')}
                value={`${(aggregatedStats.servePercentage * 100).toFixed(1)}%`}
                trend={trends.servePct}
              />

              {/* Pass Rating */}
              <StatRow
                label={t('player.stats.trends.passRating')}
                value={aggregatedStats.passRating.toFixed(2)}
                trend={trends.passRating}
              />

              {/* Error Rate */}
              <StatRow
                label={t('player.stats.trends.errorRate')}
                value={`${(aggregatedStats.errorRate * 100).toFixed(1)}%`}
                trend={trends.errorRate}
              />
            </div>
          )}

          {/* Last 5 Games Sparkline */}
          {last5Games.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {t('player.stats.trends.lastGames', { count: last5Games.length })}
              </div>
              <div className="flex gap-1">
                {last5Games.map((game, idx) => {
                  // Calculate a simple game rating (0-99 based on performance)
                  const gameRating = Math.round(
                    (game.killPercentage * 50 + game.servePercentage * 30 + (game.passRating / 3) * 20)
                  );
                  const bar = getSparklineBar(gameRating);

                  return (
                    <div
                      key={game.id || idx}
                      className="flex-1 flex items-end justify-center"
                      title={`${game.event.title}: ${gameRating}`}
                    >
                      <div
                        className={`${bar.color} rounded-sm w-full transition-all`}
                        style={{ height: `${(gameRating / 99) * 80}px`, minHeight: '8px' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {gameStatLines.length === 0 && !playerForm && (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('player.stats.noData')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Stat Row Component with Trend Arrow
 */
function StatRow({ label, value, trend }: { label: string; value: string; trend: TrendData }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold">{value}</div>
        <TrendIcon direction={trend.direction} />
      </div>
    </div>
  );
}

/**
 * Trend Icon Component
 */
function TrendIcon({ direction }: { direction: 'up' | 'down' | 'stable' }) {
  if (direction === 'up') {
    return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  }
  if (direction === 'down') {
    return <TrendingDown className="h-4 w-4 text-club-primary" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}
