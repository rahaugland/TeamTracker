import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import type { TeamRating } from '@/services/team-stats.service';

interface TeamRatingRadarProps {
  teamRating: TeamRating | null;
  isLoading?: boolean;
}

/**
 * TeamRatingRadar component
 * Radar chart showing team sub-ratings
 */
export function TeamRatingRadar({ teamRating, isLoading = false }: TeamRatingRadarProps) {
  const { t } = useTranslation();

  const chartData = teamRating
    ? [
        {
          category: t('team.dashboard.attack'),
          value: teamRating.subRatings.attack,
        },
        {
          category: t('team.dashboard.serve'),
          value: teamRating.subRatings.serve,
        },
        {
          category: 'Receive',
          value: teamRating.subRatings.receive,
        },
        {
          category: 'Mental',
          value: teamRating.subRatings.mental,
        },
      ]
    : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('team.dashboard.teamRating')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-[300px] bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!teamRating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('team.dashboard.teamRating')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            {t('player.stats.noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('team.dashboard.teamRating')}</CardTitle>
        <CardDescription>
          {t('team.dashboard.subRatings')}
          {teamRating.isProvisional && (
            <span className="text-club-secondary ml-2">({t('team.dashboard.provisional')})</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="rgba(255,255,255,0.2)" />
            <PolarAngleAxis dataKey="category" tick={{ fill: '#8B95A5' }} />
            <PolarRadiusAxis angle={90} domain={[0, 99]} tick={{ fill: '#8B95A5' }} />
            <Radar
              name={t('team.dashboard.teamRating')}
              dataKey="value"
              stroke="#2EC4B6"
              fill="#2EC4B6"
              fillOpacity={0.6}
            />
            <Legend wrapperStyle={{ color: '#8B95A5' }} />
          </RadarChart>
        </ResponsiveContainer>

        {/* Text Summary */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              {t('team.dashboard.attack')}
            </div>
            <div className="text-2xl font-bold">{teamRating.subRatings.attack}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              {t('team.dashboard.serve')}
            </div>
            <div className="text-2xl font-bold">{teamRating.subRatings.serve}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              Receive
            </div>
            <div className="text-2xl font-bold">{teamRating.subRatings.receive}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              Mental
            </div>
            <div className="text-2xl font-bold">{teamRating.subRatings.mental}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
