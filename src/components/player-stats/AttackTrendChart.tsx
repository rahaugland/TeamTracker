import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { GameStatLine } from '@/services/player-stats.service';

interface AttackTrendChartProps {
  gameStats: GameStatLine[];
}

/**
 * Line chart showing kill percentage trend over games
 */
export function AttackTrendChart({ gameStats }: AttackTrendChartProps) {
  // Prepare data in chronological order
  const chartData = gameStats
    .slice()
    .reverse()
    .map((game, index) => ({
      game: `Game ${index + 1}`,
      date: game.event.start_time,
      killPct: Math.round(game.killPercentage * 1000) / 10, // Convert to percentage with 1 decimal
      opponent: game.event.opponent || 'Unknown',
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm">{data.opponent}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(data.date), 'MMM d, yyyy')}
          </p>
          <p className="text-sm mt-1">
            <span className="font-medium">Kill %:</span> {data.killPct.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attack Trend</CardTitle>
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
        <CardTitle>Attack Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="game"
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#888"
              label={{ value: 'Kill %', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="killPct"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
