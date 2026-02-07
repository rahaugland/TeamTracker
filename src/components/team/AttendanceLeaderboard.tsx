import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { PlayerAttendanceRate } from '@/services/analytics.service';

interface AttendanceLeaderboardProps {
  attendanceRates: PlayerAttendanceRate[];
  limit?: number;
  isLoading?: boolean;
}

/**
 * AttendanceLeaderboard component
 * Shows top players by attendance rate
 */
export function AttendanceLeaderboard({
  attendanceRates,
  limit = 10,
  isLoading = false,
}: AttendanceLeaderboardProps) {
  const { t } = useTranslation();

  const topAttendees = attendanceRates.slice(0, limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('team.dashboard.attendance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('team.dashboard.attendance')}</CardTitle>
        <CardDescription>
          {t('team.dashboard.topAttendees', { count: limit })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topAttendees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('player.stats.noData')}
          </div>
        ) : (
          <div className="space-y-4">
            {topAttendees.map((player, index) => (
              <Link
                key={player.playerId}
                to={`/players/${player.playerId}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                {/* Rank */}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>

                {/* Player Photo */}
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl}
                    alt={player.playerName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {player.playerName.charAt(0)}
                  </div>
                )}

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium truncate">{player.playerName}</p>
                    <span className="text-sm font-semibold ml-2">
                      {player.attendanceRate.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={player.attendanceRate} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {player.presentCount + player.lateCount} / {player.totalEvents}{' '}
                    {t('team.dashboard.events')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
