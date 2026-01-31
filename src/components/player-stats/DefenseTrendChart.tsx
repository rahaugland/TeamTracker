import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import type { GameStatLine } from '@/services/player-stats.service';

interface DefenseTrendChartProps {
  gameStats: GameStatLine[];
}

/**
 * Combo chart showing digs (bars) and pass rating (line)
 */
export function DefenseTrendChart({ gameStats }: DefenseTrendChartProps) {
  // Prepare data in chronological order
  const chartData = gameStats
    .slice()
    .reverse()
    .map((game, index) => ({
      game: `Game ${index + 1}`,
      date: game.event.start_time,
      digs: game.digs,
      passRating: Math.round(game.passRating * 10) / 10, // 1 decimal
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
            <span className="font-medium text-blue-600">Digs:</span> {data.digs}
          </p>
          <p className="text-sm">
            <span className="font-medium text-purple-600">Pass Rating:</span> {data.passRating.toFixed(1)}
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
          <CardTitle>Defense Trend</CardTitle>
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
        <CardTitle>Defense Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="game"
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              stroke="#888"
              label={{ value: 'Digs', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              stroke="#888"
              label={{ value: 'Pass Rating', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
              domain={[0, 3]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="digs" fill="#3b82f6" name="Digs" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="passRating"
              stroke="#9333ea"
              strokeWidth={2}
              dot={{ fill: '#9333ea', r: 4 }}
              name="Pass Rating"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
