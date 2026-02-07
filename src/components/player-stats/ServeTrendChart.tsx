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
function ServeCustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { opponent: string; date: string; aces: number; errors: number } }> }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-white/10 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm text-foreground">{data.opponent}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(data.date), 'MMM d, yyyy')}
        </p>
        <p className="text-sm mt-1 text-foreground">
          <span className="font-medium text-emerald-400">Aces:</span> {data.aces}
        </p>
        <p className="text-sm text-foreground">
          <span className="font-medium text-club-primary">Errors:</span> {data.errors}
        </p>
      </div>
    );
  }
  return null;
}

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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="game"
              tick={{ fontSize: 12, fill: '#8B95A5' }}
              stroke="#8B95A5"
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#8B95A5' }}
              stroke="#8B95A5"
              label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#8B95A5' } }}
            />
            <Tooltip content={<ServeCustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#8B95A5' }} />
            <Bar dataKey="aces" fill="#34D399" name="Aces" />
            <Bar dataKey="errors" fill="#E63946" name="Errors" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
