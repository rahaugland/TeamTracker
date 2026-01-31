import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import type { SkillProgressionPoint } from '@/services/player-stats.service';

interface SkillProgressionChartProps {
  progression: SkillProgressionPoint[];
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {entry.value.toFixed(2)}
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              stroke="#888"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#888"
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              label={{ value: 'Level', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {skills.map(skill => (
              <Line
                key={skill}
                type="monotone"
                dataKey={skill}
                stroke={SKILL_COLORS[skill] || '#666'}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={skill.charAt(0).toUpperCase() + skill.slice(1)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
