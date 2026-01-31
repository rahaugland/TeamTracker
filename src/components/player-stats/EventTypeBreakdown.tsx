import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { EventTypeBreakdown as EventTypeBreakdownData } from '@/services/player-stats.service';

interface EventTypeBreakdownProps {
  breakdown: EventTypeBreakdownData;
}

const COLORS = {
  practice: '#3b82f6',
  game: '#ef4444',
  tournament: '#f59e0b',
  other: '#8b5cf6',
};

/**
 * Donut chart showing breakdown of attended events by type
 */
export function EventTypeBreakdown({ breakdown }: EventTypeBreakdownProps) {
  const data = [
    { name: 'Practices', value: breakdown.practice, color: COLORS.practice },
    { name: 'Games', value: breakdown.game, color: COLORS.game },
    { name: 'Tournaments', value: breakdown.tournament, color: COLORS.tournament },
    { name: 'Other', value: breakdown.other, color: COLORS.other },
  ].filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No attendance data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm">{data.name}</p>
          <p className="text-sm">
            {data.value} events ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Type Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={true}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Total: {total} events attended
        </div>
      </CardContent>
    </Card>
  );
}
