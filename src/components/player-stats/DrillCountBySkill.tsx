import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DrillParticipation } from '@/services/player-stats.service';

interface DrillCountBySkillProps {
  participation: DrillParticipation[];
}

interface DrillTooltipPayload {
  payload: {
    skill: string;
    count: number;
    minutes: number;
  };
}

function DrillSkillTooltip({ active, payload }: { active?: boolean; payload?: DrillTooltipPayload[] }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-white/10 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm text-foreground">{data.skill}</p>
        <p className="text-sm mt-1 text-foreground">
          <span className="font-medium">Drills:</span> {data.count}
        </p>
        <p className="text-sm text-foreground">
          <span className="font-medium">Minutes:</span> {data.minutes}
        </p>
      </div>
    );
  }
  return null;
}

/**
 * Horizontal bar chart showing drill count per skill tag
 */
export function DrillCountBySkill({ participation }: DrillCountBySkillProps) {
  const chartData = participation
    .sort((a, b) => b.drillCount - a.drillCount)
    .map(p => ({
      skill: p.skillTag.charAt(0).toUpperCase() + p.skillTag.slice(1),
      count: p.drillCount,
      minutes: p.totalMinutes,
    }));

  if (participation.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drill Participation by Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No drill data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drill Participation by Skill</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#8B95A5' }}
              stroke="#8B95A5"
            />
            <YAxis
              type="category"
              dataKey="skill"
              tick={{ fontSize: 12, fill: '#8B95A5' }}
              stroke="#8B95A5"
              width={70}
            />
            <Tooltip content={<DrillSkillTooltip />} />
            <Bar dataKey="count" fill="#2EC4B6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
