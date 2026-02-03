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

interface DefenseTooltipPayload {
  payload: {
    opponent: string;
    date: string;
    digs: number;
    passRating: number;
  };
}

function DefenseTooltip({ active, payload }: { active?: boolean; payload?: DefenseTooltipPayload[] }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-white/10 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm text-foreground">{data.opponent}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(data.date), 'MMM d, yyyy')}
        </p>
        <p className="text-sm mt-1 text-foreground">
          <span className="font-medium text-vq-teal">Digs:</span> {data.digs}
        </p>
        <p className="text-sm text-foreground">
          <span className="font-medium text-purple-400">Pass Rating:</span> {data.passRating.toFixed(1)}
        </p>
      </div>
    );
  }
  return null;
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="game"
              tick={{ fontSize: 12, fill: '#8B95A5' }}
              stroke="#8B95A5"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#8B95A5' }}
              stroke="#8B95A5"
              label={{ value: 'Digs', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#8B95A5' } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#8B95A5' }}
              stroke="#8B95A5"
              label={{ value: 'Pass Rating', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#8B95A5' } }}
              domain={[0, 3]}
            />
            <Tooltip content={<DefenseTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#8B95A5' }} />
            <Bar yAxisId="left" dataKey="digs" fill="#2EC4B6" name="Digs" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="passRating"
              stroke="#A78BFA"
              strokeWidth={2}
              dot={{ fill: '#A78BFA', r: 4 }}
              name="Pass Rating"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
