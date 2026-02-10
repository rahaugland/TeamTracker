import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { useTeamOverview } from '@/hooks/useTeamOverview';
import type { DateRange } from '@/services/analytics.service';

interface TeamOverviewTabProps {
  teamId: string;
  dateRange?: DateRange;
}

export function TeamOverviewTab({ teamId, dateRange }: TeamOverviewTabProps) {
  const { t } = useTranslation();
  const { teamRating, formStreak, attendance, practiceFrequency, seasonSummary, isLoading } =
    useTeamOverview(teamId, dateRange);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-28 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="animate-pulse h-48 bg-muted rounded-lg" />
      </div>
    );
  }

  const winRate = seasonSummary
    ? seasonSummary.wins + seasonSummary.losses > 0
      ? Math.round((seasonSummary.wins / (seasonSummary.wins + seasonSummary.losses)) * 100)
      : 0
    : formStreak?.winRate ?? 0;

  const record = seasonSummary
    ? `${seasonSummary.wins}W - ${seasonSummary.losses}L`
    : undefined;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={t('reports.overview.winRate')}
          value={`${winRate}%`}
          delta={record}
          deltaType={winRate >= 50 ? 'positive' : winRate > 0 ? 'negative' : 'neutral'}
          accent="success"
        />
        <StatCard
          label={t('reports.overview.attendance')}
          value={`${Math.round(attendance?.averageAttendanceRate ?? 0)}%`}
          delta={
            attendance?.trend === 'up'
              ? t('reports.overview.trendUp')
              : attendance?.trend === 'down'
                ? t('reports.overview.trendDown')
                : t('reports.overview.trendStable')
          }
          deltaType={
            attendance?.trend === 'up' ? 'positive' : attendance?.trend === 'down' ? 'negative' : 'neutral'
          }
          accent="teal"
        />
        <StatCard
          label={t('reports.overview.practiceFreq')}
          value={practiceFrequency?.practicesPerWeek?.toFixed(1) ?? '0'}
          delta={`${practiceFrequency?.totalPractices ?? 0} ${t('reports.overview.totalPractices')}`}
          accent="primary"
        />
        <StatCard
          label={t('reports.overview.teamRating')}
          value={teamRating?.overall ?? '-'}
          delta={
            teamRating?.isProvisional
              ? t('reports.overview.provisional')
              : `${teamRating?.playerCount ?? 0} ${t('reports.overview.playersRated')}`
          }
          deltaType={teamRating?.isProvisional ? 'neutral' : 'positive'}
          accent="secondary"
        />
      </div>

      {/* Form Streak */}
      {formStreak && formStreak.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.overview.formStreak')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {formStreak.results.map((result, i) => (
                <Badge
                  key={i}
                  variant={result === 'W' ? 'default' : result === 'L' ? 'destructive' : 'secondary'}
                  className={
                    result === 'W'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : result === 'L'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : ''
                  }
                >
                  {result}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Season Summary */}
      {seasonSummary && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.overview.seasonSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{seasonSummary.wins}</div>
                <div className="text-xs text-muted-foreground">{t('reports.overview.wins')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{seasonSummary.losses}</div>
                <div className="text-xs text-muted-foreground">{t('reports.overview.losses')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {seasonSummary.aggregatedStats.killPct != null
                    ? `${seasonSummary.aggregatedStats.killPct.toFixed(1)}%`
                    : '-'}
                </div>
                <div className="text-xs text-muted-foreground">{t('reports.overview.killPct')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(seasonSummary.avgAttendanceRate)}%
                </div>
                <div className="text-xs text-muted-foreground">{t('reports.overview.avgAttendance')}</div>
              </div>
            </div>

            {/* Recent Matches */}
            {seasonSummary.recentMatches.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">{t('reports.overview.recentMatches')}</h4>
                <div className="space-y-1">
                  {seasonSummary.recentMatches.slice(0, 5).map((match) => (
                    <div
                      key={match.eventId}
                      className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-0"
                    >
                      <span className="text-muted-foreground">
                        {match.opponent ?? t('reports.overview.unknownOpponent')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>
                          {match.setsWon}-{match.setsLost}
                        </span>
                        <Badge
                          variant={match.won ? 'default' : 'destructive'}
                          className={
                            match.won
                              ? 'bg-green-500/20 text-green-400 border-green-500/30 text-xs'
                              : 'bg-red-500/20 text-red-400 border-red-500/30 text-xs'
                          }
                        >
                          {match.won ? 'W' : 'L'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Sub-Ratings */}
      {teamRating && teamRating.overall > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.overview.subRatings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['attack', 'serve', 'reception', 'consistency'] as const).map((key) => (
                <div key={key} className="text-center p-3 border rounded-lg border-white/10">
                  <div className="text-2xl font-bold">{teamRating.subRatings[key]}</div>
                  <div className="text-xs text-muted-foreground capitalize">{t(`team.dashboard.${key}`)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
