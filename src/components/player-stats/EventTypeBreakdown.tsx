import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { EventTypeBreakdown as EventTypeBreakdownData } from '@/services/player-stats.service';

interface EventTypeBreakdownProps {
  breakdown: EventTypeBreakdownData;
}

const COLORS = {
  practice: '#2EC4B6',
  game: '#E63946',
  tournament: '#FFB703',
  other: '#A78BFA',
};

interface EventTooltipPayload {
  name: string;
  value: number;
}

function EventTooltip({ active, payload, total }: { active?: boolean; payload?: EventTooltipPayload[]; total: number }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percentage = ((data.value / total) * 100).toFixed(1);
    return (
      <div className="bg-card border border-white/10 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm text-foreground">{data.name}</p>
        <p className="text-sm text-foreground">
          {data.value} events ({percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

/**
 * Donut chart showing breakdown of attended events by type
 */
export function EventTypeBreakdown({ breakdown }: EventTypeBreakdownProps) {
  const data = useMemo(() => [
    { name: 'Practices', value: breakdown.practice, color: COLORS.practice },
    { name: 'Games', value: breakdown.game, color: COLORS.game },
    { name: 'Tournaments', value: breakdown.tournament, color: COLORS.tournament },
    { name: 'Other', value: breakdown.other, color: COLORS.other },
  ].filter(item => item.value > 0), [breakdown]);

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const tooltipContent = useMemo(() => (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => <EventTooltip {...props} total={total} />
  ), [total]);

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
            <Tooltip content={tooltipContent} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Total: {total} events attended
        </div>
      </CardContent>
    </Card>
  );
}
