import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import type { TrainingVolumePoint } from '@/services/player-stats.service';

interface TrainingVolumeChartProps {
  volume: TrainingVolumePoint[];
}

const SKILL_COLORS: Record<string, string> = {
  passing: '#3b82f6',
  setting: '#8b5cf6',
  hitting: '#ef4444',
  blocking: '#f59e0b',
  serving: '#10b981',
  'serve-receive': '#06b6d4',
  defense: '#ec4899',
  transition: '#6366f1',
  footwork: '#84cc16',
  conditioning: '#f97316',
};

/**
 * Stacked area chart showing training minutes per skill per month
 */
export function TrainingVolumeChart({ volume }: TrainingVolumeChartProps) {
  const chartData = useMemo(() => {
    return volume
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(v => ({
        ...v,
        month: v.month.substring(0, 7), // Format as YYYY-MM
      }));
  }, [volume]);

  const skills = useMemo(() => {
    const skillSet = new Set<string>();
    volume.forEach(v => {
      Object.keys(v).forEach(key => {
        if (key !== 'month') {
          skillSet.add(key);
        }
      });
    });
    return Array.from(skillSet).sort();
  }, [volume]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <p className="text-xs text-muted-foreground mb-1">Total: {total} minutes</p>
          {payload
            .filter((entry: any) => entry.value > 0)
            .map((entry: any) => (
              <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
                <span className="font-medium">{entry.name}:</span> {entry.value} min
              </p>
            ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No training data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              stroke="#888"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#888"
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {skills.map(skill => (
              <Area
                key={skill}
                type="monotone"
                dataKey={skill}
                stackId="1"
                stroke={SKILL_COLORS[skill] || '#666'}
                fill={SKILL_COLORS[skill] || '#666'}
                name={skill.charAt(0).toUpperCase() + skill.slice(1)}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
