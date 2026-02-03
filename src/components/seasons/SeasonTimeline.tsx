import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeamGameStat } from '@/services/team-stats.service';

interface SeasonTimelineProps {
  gameStats: TeamGameStat[];
  isLoading?: boolean;
}

export function SeasonTimeline({ gameStats, isLoading }: SeasonTimelineProps) {
  const { t } = useTranslation();

  const { chartData, wins, losses } = useMemo(() => {
    let w = 0;
    let l = 0;
    const data = gameStats
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((g) => {
        const isWin = g.result === 'W';
        if (isWin) w++;
        else l++;
        return {
          date: new Date(g.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: isWin ? 1 : -1,
          isWin,
          opponent: g.opponent ?? '—',
          score: `${g.setsWon}–${g.setsLost}`,
        };
      });
    return { chartData: data, wins: w, losses: l };
  }, [gameStats]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('awards.seasonTimeline.title')}</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            {t('common.messages.loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) return null;

  const total = wins + losses;
  const pct = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('awards.seasonTimeline.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[-1.5, 1.5]} hide />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-md shadow-md px-3 py-2 text-sm">
                    <p className="font-medium">{d.opponent}</p>
                    <p className="text-muted-foreground">{d.score}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.isWin ? '#34D399' : '#E63946'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-sm text-muted-foreground text-center mt-2">
          {t('awards.seasonTimeline.record', { wins, losses, pct })}
        </p>
      </CardContent>
    </Card>
  );
}
