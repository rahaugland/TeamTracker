import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useDrillEffectiveness } from '@/hooks/useDrillEffectiveness';
import type { DateRange } from '@/services/analytics.service';

interface DrillEffectivenessTabProps {
  teamId: string;
  dateRange?: DateRange;
}

const SKILL_COLORS: Record<string, string> = {
  passing: '#2EC4B6',
  serving: '#E63946',
  hitting: '#F4A261',
  blocking: '#6C63FF',
  defense: '#4CAF50',
  setting: '#FF6B6B',
  servereceive: '#26C6DA',
  transition: '#AB47BC',
  footwork: '#FF7043',
  conditioning: '#78909C',
};

export function DrillEffectivenessTab({ teamId, dateRange }: DrillEffectivenessTabProps) {
  const { t } = useTranslation();
  const { drills, trainingVolume, progression, isLoading } = useDrillEffectiveness(teamId, dateRange);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-64 bg-muted rounded-lg" />
        <div className="animate-pulse h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  // Get unique skill tags for the area chart
  const allSkillTags = new Set<string>();
  for (const vol of trainingVolume) {
    for (const key of Object.keys(vol)) {
      if (key !== 'month') allSkillTags.add(key);
    }
  }
  const skillTags = Array.from(allSkillTags);

  // Group progression entries by drill name for the line chart
  const progressionDrills = new Set<string>();
  for (const p of progression) {
    progressionDrills.add(p.drillName);
  }
  const progressionMonths = [...new Set(progression.map((p) => p.month))].sort();
  const progressionChartData = progressionMonths.map((month) => {
    const point: Record<string, any> = { month };
    for (const drill of progressionDrills) {
      const entry = progression.find((p) => p.month === month && p.drillName === drill);
      if (entry) point[drill] = entry.avgRating;
    }
    return point;
  });
  const progressionDrillNames = Array.from(progressionDrills).slice(0, 5);
  const lineColors = ['#2EC4B6', '#E63946', '#F4A261', '#6C63FF', '#4CAF50'];

  return (
    <div className="space-y-6">
      {/* Top Drills Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.drills.topDrills')}</CardTitle>
        </CardHeader>
        <CardContent>
          {drills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('reports.drills.noData')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.drills.name')}</TableHead>
                  <TableHead className="text-center">{t('reports.drills.count')}</TableHead>
                  <TableHead className="text-center">{t('reports.drills.avgRating')}</TableHead>
                  <TableHead className="text-center">{t('reports.drills.totalMinutes')}</TableHead>
                  <TableHead>{t('reports.drills.skills')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drills.slice(0, 15).map((drill) => (
                  <TableRow key={drill.drillId}>
                    <TableCell className="font-medium">{drill.drillName}</TableCell>
                    <TableCell className="text-center">{drill.executionCount}</TableCell>
                    <TableCell className="text-center">
                      {drill.avgCoachRating != null ? drill.avgCoachRating : '-'}
                    </TableCell>
                    <TableCell className="text-center">{drill.totalMinutes}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {drill.skillTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {t(`drill.skills.${tag}`, tag)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Training Volume Chart */}
      {trainingVolume.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.drills.trainingVolume')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trainingVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#8B95A5', fontSize: 12 }} />
                <YAxis tick={{ fill: '#8B95A5' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Legend wrapperStyle={{ color: '#8B95A5' }} />
                {skillTags.map((tag) => (
                  <Area
                    key={tag}
                    type="monotone"
                    dataKey={tag}
                    stackId="1"
                    fill={SKILL_COLORS[tag] || '#8B95A5'}
                    stroke={SKILL_COLORS[tag] || '#8B95A5'}
                    fillOpacity={0.6}
                    name={t(`drill.skills.${tag}`, tag)}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Drill Progression Chart */}
      {progressionChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.drills.progression')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#8B95A5', fontSize: 12 }} />
                <YAxis tick={{ fill: '#8B95A5' }} domain={[0, 5]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Legend wrapperStyle={{ color: '#8B95A5' }} />
                {progressionDrillNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={lineColors[i % lineColors.length]}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
