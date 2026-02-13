import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AggregatedStats } from '@/services/player-stats.service';
import type { GameStatLine } from '@/services/player-stats.service';

interface StatSummaryRowProps {
  aggregatedStats: AggregatedStats;
  gameStats: GameStatLine[];
  variant?: '4-card' | '6-card';
  previousStats?: AggregatedStats;
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
    return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  }
  if (direction === 'down') {
    return <TrendingDown className="h-4 w-4 text-club-primary" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

/**
 * Summary row with 4 or 6 key stats and trend indicators
 * variant='4-card': Kill%, Serve%, Pass Rating, Blocks/Game (original)
 * variant='6-card': Total Kills, Kill%, Aces, Pass Rating, Blocks, Digs (wireframe style)
 */
export function StatSummaryRow({
  aggregatedStats,
  gameStats,
  variant = '4-card',
  previousStats,
}: StatSummaryRowProps) {
  const killPctTrend = calculateTrend(gameStats, (g) => g.killPercentage);
  const servePctTrend = calculateTrend(gameStats, (g) => g.servePercentage);
  const passRatingTrend = calculateTrend(gameStats, (g) => g.passRating);
  const blocksPerGameTrend = calculateTrend(gameStats, (g) => g.totalBlocks);

  // For 6-card variant with period comparison
  if (variant === '6-card') {
    const totalBlocks = aggregatedStats.totalBlockSolos + aggregatedStats.totalBlockAssists;
    const prevBlocks = previousStats
      ? previousStats.totalBlockSolos + previousStats.totalBlockAssists
      : null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatBox
          value={aggregatedStats.totalKills}
          label="Total Kills"
          delta={previousStats ? aggregatedStats.totalKills - previousStats.totalKills : null}
        />
        <StatBox
          value={`${(aggregatedStats.killPercentage * 100).toFixed(0)}%`}
          label="Kill %"
          delta={previousStats
            ? parseFloat(((aggregatedStats.killPercentage - previousStats.killPercentage) * 100).toFixed(1))
            : null}
          valueColor="text-vq-teal"
        />
        <StatBox
          value={aggregatedStats.totalAces}
          label="Aces"
          delta={previousStats ? aggregatedStats.totalAces - previousStats.totalAces : null}
        />
        <StatBox
          value={aggregatedStats.passRating.toFixed(1)}
          label="Pass Rating"
          delta={previousStats
            ? parseFloat((aggregatedStats.passRating - previousStats.passRating).toFixed(1))
            : null}
          valueColor="text-club-secondary"
        />
        <StatBox
          value={totalBlocks}
          label="Blocks"
          delta={prevBlocks !== null ? totalBlocks - prevBlocks : null}
        />
        <StatBox
          value={aggregatedStats.totalDigs}
          label="Digs"
          delta={previousStats ? aggregatedStats.totalDigs - previousStats.totalDigs : null}
        />
      </div>
    );
  }

  // Original 4-card variant
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

// Helper component for 6-card variant stat boxes
interface StatBoxProps {
  value: string | number;
  label: string;
  delta?: number | null;
  valueColor?: string;
}

function StatBox({ value, label, delta, valueColor }: StatBoxProps) {
  return (
    <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-4 text-center">
      <p className={cn(
        'font-mono font-bold text-2xl mb-1',
        valueColor || 'text-white'
      )}>
        {value}
      </p>
      <p className="font-display font-semibold text-[9px] uppercase tracking-wider text-gray-500">
        {label}
      </p>
      {delta !== null && delta !== undefined && (
        <p className={cn(
          'font-mono text-[10px] mt-1',
          delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-500'
        )}>
          {delta > 0 ? '+' : ''}{delta} vs last month
        </p>
      )}
    </div>
  );
}
