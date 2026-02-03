import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTeamAttendanceRate, type TeamAttendanceRate, type DateRange } from '@/services/analytics.service';

interface AttendanceOverviewWidgetProps {
  teamId: string;
  dateRange?: DateRange;
}

export function AttendanceOverviewWidget({ teamId, dateRange }: AttendanceOverviewWidgetProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<TeamAttendanceRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getTeamAttendanceRate(teamId, dateRange);
      setData(result);
    } catch (error) {
      console.error('Error loading attendance overview:', error);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.widgets.attendanceOverview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('common.messages.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const getTrendIcon = () => {
    switch (data.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-club-primary" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (data.trend) {
      case 'up':
        return 'text-emerald-400';
      case 'down':
        return 'text-club-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="card-gradient-teal border-l-4 border-l-vq-teal hover-glow">
      <CardHeader>
        <CardTitle className="text-vq-teal flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {t('dashboard.widgets.attendanceOverview')}
        </CardTitle>
        <CardDescription className="font-medium">{data.teamName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl text-stat font-bold bg-gradient-to-r from-vq-teal to-club-secondary bg-clip-text text-transparent">{data.averageAttendanceRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                {t('dashboard.widgets.averageAttendance')}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vq-teal/10">
              {getTrendIcon()}
              <span className={`text-sm font-bold ${getTrendColor()}`}>
                {t(`dashboard.widgets.trend.${data.trend}`)}
              </span>
            </div>
          </div>
          <div className="pt-4 border-t border-vq-teal/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">{t('dashboard.widgets.totalEvents')}</span>
              <span className="text-stat font-bold text-lg text-vq-teal">{data.totalEvents}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
