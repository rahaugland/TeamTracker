import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import type { SkillProgressionPoint } from '@/services/player-stats.service';

interface SkillProgressionChartProps {
  progression: SkillProgressionPoint[];
}

// Match FIFA card skill colors
const SKILL_COLORS: Record<string, string> = {
  serve: '#E63946',     // club-primary red
  receive: '#2EC4B6',   // vq-teal
  set: '#FFB703',       // club-secondary yellow
  block: '#3B82F6',     // blue
  attack: '#22C55E',    // green
  dig: '#9333EA',       // purple
  mental: '#EC4899',    // pink
  physique: '#F97316',  // orange
};

// Skill display names
const SKILL_LABELS: Record<string, string> = {
  serve: 'Serve',
  receive: 'Receive',
  set: 'Set',
  block: 'Block',
  attack: 'Attack',
  dig: 'Dig',
  mental: 'Mental',
  physique: 'Physique',
};

/**
 * Multi-line chart showing average progression level over time per skill
 */
export function SkillProgressionChart({ progression }: SkillProgressionChartProps) {
  const chartData = useMemo(() => {
    if (progression.length === 0) return [];

    // Group by month
    const monthMap: Record<string, Record<string, number[]>> = {};

    progression.forEach(point => {
      if (!monthMap[point.date]) {
        monthMap[point.date] = {};
      }
      if (!monthMap[point.date][point.skillTag]) {
        monthMap[point.date][point.skillTag] = [];
      }
      monthMap[point.date][point.skillTag].push(point.avgLevel);
    });

    // Convert to chart format
    return Object.entries(monthMap)
      .map(([month, skills]) => {
        const dataPoint: any = { month };
        Object.entries(skills).forEach(([skill, levels]) => {
          dataPoint[skill] = levels.reduce((a, b) => a + b, 0) / levels.length;
        });
        return dataPoint;
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [progression]);

  const skills = useMemo(() => {
    const skillSet = new Set<string>();
    progression.forEach(p => skillSet.add(p.skillTag));
    return Array.from(skillSet).sort();
  }, [progression]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-white/10 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-2 text-foreground">{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {Math.round(entry.value)}
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
          <CardTitle>Skill Progression Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No progression data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill Progression Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#8B95A5' }}
              stroke="#8B95A5"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#8B95A5' }}
              stroke="#8B95A5"
              domain={[0, 99]}
              ticks={[0, 25, 50, 75, 99]}
              label={{ value: 'Rating', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#8B95A5' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8B95A5' }} />
            {skills.map(skill => (
              <Line
                key={skill}
                type="monotone"
                dataKey={skill}
                stroke={SKILL_COLORS[skill] || '#666'}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={SKILL_LABELS[skill] || skill.charAt(0).toUpperCase() + skill.slice(1)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
