import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { AggregatedStats } from '@/services/player-stats.service';

interface StatSnapshotsProps {
  currentMonthStats: AggregatedStats | null;
  previousMonthStats: AggregatedStats | null;
  attendanceRate: number;
}

interface MetricCard {
  label: string;
  current: number | null;
  previous: number | null;
  format: (v: number) => string;
}

export function StatSnapshots({ currentMonthStats, previousMonthStats, attendanceRate }: StatSnapshotsProps) {
  const { t } = useTranslation();

  const metrics: MetricCard[] = [
    {
      label: t('playerExperience.progress.killPct'),
      current: currentMonthStats?.gamesPlayed ? currentMonthStats.killPercentage * 100 : null,
      previous: previousMonthStats?.gamesPlayed ? previousMonthStats.killPercentage * 100 : null,
      format: (v) => `${v.toFixed(1)}%`,
    },
    {
      label: t('playerExperience.progress.servePct'),
      current: currentMonthStats?.gamesPlayed ? currentMonthStats.servePercentage * 100 : null,
      previous: previousMonthStats?.gamesPlayed ? previousMonthStats.servePercentage * 100 : null,
      format: (v) => `${v.toFixed(1)}%`,
    },
    {
      label: t('playerExperience.progress.passRating'),
      current: currentMonthStats?.gamesPlayed ? currentMonthStats.passRating : null,
      previous: previousMonthStats?.gamesPlayed ? previousMonthStats.passRating : null,
      format: (v) => v.toFixed(2),
    },
    {
      label: t('playerExperience.progress.attendancePct'),
      current: attendanceRate,
      previous: null,
      format: (v) => `${v}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const delta = metric.current != null && metric.previous != null
          ? metric.current - metric.previous
          : null;

        return (
          <Card key={metric.label}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">{metric.label}</p>
              {metric.current != null ? (
                <>
                  <div className="text-2xl text-stat font-bold">{metric.format(metric.current)}</div>
                  {delta != null && (
                    <div className={`flex items-center gap-1 mt-1 text-xs ${delta >= 0 ? 'text-emerald-400' : 'text-club-primary'}`}>
                      {delta >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{delta >= 0 ? '+' : ''}{metric.format(delta)}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t('playerExperience.progress.noGamesYet')}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
