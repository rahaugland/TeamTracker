import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, UserPlus, CalendarPlus, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRecentActivity, type RecentActivity } from '@/services/analytics.service';

interface RecentActivityWidgetProps {
  teamId: string;
  limit?: number;
}

export function RecentActivityWidget({ teamId, limit = 5 }: RecentActivityWidgetProps) {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecentActivity(teamId, limit);
      setActivities(data);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.widgets.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('common.messages.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'player_added':
        return <UserPlus className="h-4 w-4" />;
      case 'event_created':
        return <CalendarPlus className="h-4 w-4" />;
      case 'team_created':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityIconColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'player_added':
        return 'text-secondary bg-secondary/10';
      case 'event_created':
        return 'text-primary bg-primary/10';
      case 'team_created':
        return 'text-accent bg-accent/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('dashboard.widgets.justNow');
    if (diffMins < 60) return t('dashboard.widgets.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('dashboard.widgets.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('dashboard.widgets.daysAgo', { count: diffDays });

    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.widgets.recentActivity')}</CardTitle>
        <CardDescription>
          {activities.length === 0
            ? t('dashboard.widgets.noRecentActivity')
            : t('dashboard.widgets.latestUpdates')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('dashboard.widgets.noActivityDescription')}
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getActivityIconColor(
                    activity.type
                  )}`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
