import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AggregatedStats } from '@/services/player-stats.service';
import type { GameStatLine } from '@/services/player-stats.service';

interface StatSummaryRowProps {
  aggregatedStats: AggregatedStats;
  gameStats: GameStatLine[];
}

/**
 * Calculate trend direction by comparing recent games to earlier games
 */
function calculateTrend(
  gameStats: GameStatLine[],
  getValue: (game: GameStatLine) => number
): 'up' | 'down' | 'neutral' {
  if (gameStats.length < 4) return 'neutral';

  const recent = gameStats.slice(0, Math.floor(gameStats.length / 2));
  const earlier = gameStats.slice(Math.floor(gameStats.length / 2));

  const recentAvg = recent.reduce((sum, g) => sum + getValue(g), 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, g) => sum + getValue(g), 0) / earlier.length;

  const diff = recentAvg - earlierAvg;
  const threshold = Math.abs(earlierAvg) * 0.05; // 5% change threshold

  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'neutral';
}

/**
 * Render trend icon based on direction
 */
function TrendIcon({ direction }: { direction: 'up' | 'down' | 'neutral' }) {
  if (direction === 'up') {
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  }
  if (direction === 'down') {
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  }
  return <Minus className="h-4 w-4 text-gray-400" />;
}

/**
 * Summary row with 4 key stats and trend indicators
 */
export function StatSummaryRow({ aggregatedStats, gameStats }: StatSummaryRowProps) {
  const killPctTrend = calculateTrend(gameStats, (g) => g.killPercentage);
  const servePctTrend = calculateTrend(gameStats, (g) => g.servePercentage);
  const passRatingTrend = calculateTrend(gameStats, (g) => g.passRating);
  const blocksPerGameTrend = calculateTrend(gameStats, (g) => g.totalBlocks);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Kill Percentage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {(aggregatedStats.killPercentage * 100).toFixed(1)}%
            </div>
            <TrendIcon direction={killPctTrend} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {aggregatedStats.totalKills}K - {aggregatedStats.totalAttackErrors}E / {aggregatedStats.totalAttackAttempts}TA
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Serve Percentage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {(aggregatedStats.servePercentage * 100).toFixed(1)}%
            </div>
            <TrendIcon direction={servePctTrend} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {aggregatedStats.totalAces} Aces, {aggregatedStats.totalServiceErrors} Errors
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {aggregatedStats.passRating.toFixed(2)}
            </div>
            <TrendIcon direction={passRatingTrend} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {aggregatedStats.totalPassAttempts} Attempts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Blocks Per Game</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {aggregatedStats.blocksPerGame.toFixed(1)}
            </div>
            <TrendIcon direction={blocksPerGameTrend} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {aggregatedStats.totalBlockSolos} Solo, {aggregatedStats.totalBlockAssists} Assist
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
