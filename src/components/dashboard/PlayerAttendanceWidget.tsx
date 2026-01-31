import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPlayerAttendanceRates, type PlayerAttendanceRate, type DateRange } from '@/services/analytics.service';

interface PlayerAttendanceWidgetProps {
  teamId: string;
  limit?: number;
  dateRange?: DateRange;
}

export function PlayerAttendanceWidget({ teamId, limit = 10, dateRange }: PlayerAttendanceWidgetProps) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<PlayerAttendanceRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPlayerAttendanceRates(teamId, dateRange);
      setPlayers(data.slice(0, limit));
    } catch (error) {
      console.error('Error loading player attendance:', error);
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
          <CardTitle>{t('dashboard.widgets.playerAttendance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('common.messages.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.widgets.playerAttendance')}</CardTitle>
        <CardDescription>
          {players.length === 0
            ? t('player.noPlayers')
            : t('dashboard.widgets.sortedByAttendance')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('player.noPlayersDescription')}
          </p>
        ) : (
          <div className="space-y-4">
            {players.map((player) => (
              <div key={player.playerId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.playerName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{player.playerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.totalEvents} {t('dashboard.widgets.events')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${getAttendanceColor(player.attendanceRate)}`}>
                      {player.attendanceRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${getProgressBarColor(player.attendanceRate)} transition-all`}
                    style={{ width: `${Math.min(player.attendanceRate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
