import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTopDrills, type DrillUsage, type DateRange } from '@/services/analytics.service';

interface TopDrillsWidgetProps {
  teamId: string;
  limit?: number;
  dateRange?: DateRange;
}

export function TopDrillsWidget({ teamId, limit = 5, dateRange }: TopDrillsWidgetProps) {
  const { t } = useTranslation();
  const [drills, setDrills] = useState<DrillUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTopDrills(teamId, limit, dateRange);
      setDrills(data);
    } catch (error) {
      console.error('Error loading top drills:', error);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, limit, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.widgets.topDrills')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('common.messages.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  const formatLastExecuted = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('dashboard.widgets.today');
    if (diffDays === 1) return t('dashboard.widgets.yesterday');
    if (diffDays < 7) return t('dashboard.widgets.daysAgo', { count: diffDays });
    if (diffDays < 30) return t('dashboard.widgets.weeksAgo', { count: Math.floor(diffDays / 7) });
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.widgets.topDrills')}</CardTitle>
        <CardDescription>
          {drills.length === 0
            ? t('drill.noDrills')
            : t('dashboard.widgets.mostUsedDrills')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {drills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('drill.noDrillsDescription')}
          </p>
        ) : (
          <div className="space-y-3">
            {drills.map((drill, index) => (
              <div
                key={drill.drillId}
                className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex-shrink-0">
                  {index === 0 ? (
                    <Trophy className="h-5 w-5 text-club-secondary" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{drill.drillName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {t('dashboard.widgets.executedCount', { count: drill.executionCount })}
                    </p>
                    {drill.averageRating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-club-secondary text-club-secondary" />
                        <span className="text-xs text-muted-foreground">
                          {drill.averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {drill.lastExecuted && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('dashboard.widgets.lastUsed')}: {formatLastExecuted(drill.lastExecuted)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
