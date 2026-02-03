import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TeamGameStat } from '@/services/team-stats.service';

interface TeamPerformanceTrendsProps {
  gameStats: TeamGameStat[];
  isLoading?: boolean;
}

/**
 * TeamPerformanceTrends component
 * Line chart showing team performance trends over time
 */
export function TeamPerformanceTrends({ gameStats, isLoading = false }: TeamPerformanceTrendsProps) {
  const { t } = useTranslation();

  // Prepare chart data (reverse to show oldest to newest)
  const chartData = [...gameStats].reverse().map((game, index) => {
    const date = new Date(game.date);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;

    return {
      game: formattedDate,
      killPct: (game.killPercentage * 100).toFixed(1),
      servePct: (game.servePercentage * 100).toFixed(1),
      passRtg: game.passRating.toFixed(1),
    };
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('team.dashboard.performance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-[300px] bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (gameStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('team.dashboard.performance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            {t('team.dashboard.noGames')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('team.dashboard.performance')}</CardTitle>
        <CardDescription>
          {t('player.stats.trends.lastGames', { count: gameStats.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="game" tick={{ fill: '#8B95A5' }} stroke="#8B95A5" />
            <YAxis tick={{ fill: '#8B95A5' }} stroke="#8B95A5" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f1e35',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
              }}
            />
            <Legend wrapperStyle={{ color: '#8B95A5' }} />
            <Line
              type="monotone"
              dataKey="killPct"
              stroke="#E63946"
              strokeWidth={2}
              name={t('team.dashboard.killPercentage')}
            />
            <Line
              type="monotone"
              dataKey="servePct"
              stroke="#2EC4B6"
              strokeWidth={2}
              name={t('team.dashboard.servePercentage')}
            />
            <Line
              type="monotone"
              dataKey="passRtg"
              stroke="#34D399"
              strokeWidth={2}
              name={t('team.dashboard.passRating')}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
