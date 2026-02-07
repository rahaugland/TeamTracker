import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import type { TrainingVolumePoint } from '@/services/player-stats.service';

interface TrainingVolumeChartProps {
  volume: TrainingVolumePoint[];
}

const SKILL_COLORS: Record<string, string> = {
  passing: '#2EC4B6',
  setting: '#A78BFA',
  hitting: '#E63946',
  blocking: '#FFB703',
  serving: '#34D399',
  'serve-receive': '#38BDF8',
  defense: '#F472B6',
  transition: '#818CF8',
  footwork: '#A3E635',
  conditioning: '#FB923C',
};

/**
 * Stacked area chart showing training minutes per skill per month
 */
interface VolumeTooltipEntry {
  dataKey: string;
  name: string;
  value: number;
  color: string;
}

function VolumeCustomTooltip({ active, payload, label }: { active?: boolean; payload?: VolumeTooltipEntry[]; label?: string }) {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + entry.value, 0);
    return (
      <div className="bg-card border border-white/10 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2 text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mb-1">Total: {total} minutes</p>
        {payload
          .filter((entry) => entry.value > 0)
          .map((entry) => (
            <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {entry.value} min
            </p>
          ))}
      </div>
    );
  }
  return null;
}

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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#8B95A5' }}
              stroke="#8B95A5"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#8B95A5' }}
              stroke="#8B95A5"
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#8B95A5' } }}
            />
            <Tooltip content={<VolumeCustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8B95A5' }} />
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
