import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { GameStatLine } from '@/services/player-stats.service';

interface ServeTrendChartProps {
  gameStats: GameStatLine[];
}

/**
 * Bar chart showing aces vs service errors per game
 */
export function ServeTrendChart({ gameStats }: ServeTrendChartProps) {
  // Prepare data in chronological order
  const chartData = gameStats
    .slice()
    .reverse()
    .map((game, index) => ({
      game: `Game ${index + 1}`,
      date: game.event.start_time,
      aces: game.aces,
      errors: game.service_errors,
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
            <span className="font-medium text-green-600">Aces:</span> {data.aces}
          </p>
          <p className="text-sm">
            <span className="font-medium text-red-600">Errors:</span> {data.errors}
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
          <CardTitle>Serve Trend</CardTitle>
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
        <CardTitle>Serve Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="game"
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#888"
              label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="aces" fill="#22c55e" name="Aces" />
            <Bar dataKey="errors" fill="#ef4444" name="Errors" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
