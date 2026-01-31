import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import type { PlayerWithMemberships } from '@/services/players.service';
import type { PlayerRating } from '@/services/player-stats.service';

interface PlayerWithRating extends PlayerWithMemberships {
  rating?: PlayerRating;
}

interface PlayerComparisonProps {
  players: PlayerWithRating[];
  isLoading?: boolean;
}

/**
 * PlayerComparison component
 * Side-by-side comparison of two players
 */
export function PlayerComparison({ players, isLoading = false }: PlayerComparisonProps) {
  const { t } = useTranslation();

  const [player1Id, setPlayer1Id] = useState<string>('');
  const [player2Id, setPlayer2Id] = useState<string>('');

  const player1 = players.find((p) => p.id === player1Id);
  const player2 = players.find((p) => p.id === player2Id);

  const playersWithRatings = players.filter((p) => p.rating);

  // Prepare radar chart data
  const radarData =
    player1?.rating && player2?.rating
      ? [
          {
            category: t('team.dashboard.attack'),
            player1: player1.rating.subRatings.attack,
            player2: player2.rating.subRatings.attack,
          },
          {
            category: t('team.dashboard.serve'),
            player1: player1.rating.subRatings.serve,
            player2: player2.rating.subRatings.serve,
          },
          {
            category: t('team.dashboard.reception'),
            player1: player1.rating.subRatings.reception,
            player2: player2.rating.subRatings.reception,
          },
          {
            category: t('team.dashboard.consistency'),
            player1: player1.rating.subRatings.consistency,
            player2: player2.rating.subRatings.consistency,
          },
        ]
      : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('team.dashboard.comparePlayers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-[400px] bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('team.dashboard.comparePlayers')}</CardTitle>
        <CardDescription>{t('team.dashboard.selectPlayers')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Player Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('team.dashboard.player1')}
            </label>
            <Select value={player1Id} onValueChange={setPlayer1Id}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.labels.name')} />
              </SelectTrigger>
              <SelectContent>
                {playersWithRatings.map((player) => (
                  <SelectItem key={player.id} value={player.id} disabled={player.id === player2Id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('team.dashboard.player2')}
            </label>
            <Select value={player2Id} onValueChange={setPlayer2Id}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.labels.name')} />
              </SelectTrigger>
              <SelectContent>
                {playersWithRatings.map((player) => (
                  <SelectItem key={player.id} value={player.id} disabled={player.id === player1Id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Content */}
        {!player1 || !player2 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('team.dashboard.noDataToCompare')}
          </div>
        ) : (
          <>
            {/* Overall Rating */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-4xl font-bold">{player1.rating?.overall || '?'}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t('team.dashboard.overallRating')}
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-4xl font-bold">{player2.rating?.overall || '?'}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t('team.dashboard.overallRating')}
                </div>
              </div>
            </div>

            {/* Radar Chart */}
            {radarData.length > 0 && (
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 99]} />
                    <Radar
                      name={player1.name}
                      dataKey="player1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name={player2.name}
                      dataKey="player2"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.5}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sub-Ratings Breakdown */}
            <div className="space-y-3">
              <div className="text-sm font-medium">{t('team.dashboard.subRatings')}</div>

              {/* Attack */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{t('team.dashboard.attack')}</span>
                  <div className="flex gap-4">
                    <span className="text-blue-600 font-medium">
                      {player1.rating?.subRatings.attack || 0}
                    </span>
                    <span className="text-red-600 font-medium">
                      {player2.rating?.subRatings.attack || 0}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Progress value={player1.rating?.subRatings.attack || 0} className="bg-blue-100" />
                  <Progress value={player2.rating?.subRatings.attack || 0} className="bg-red-100" />
                </div>
              </div>

              {/* Serve */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{t('team.dashboard.serve')}</span>
                  <div className="flex gap-4">
                    <span className="text-blue-600 font-medium">
                      {player1.rating?.subRatings.serve || 0}
                    </span>
                    <span className="text-red-600 font-medium">
                      {player2.rating?.subRatings.serve || 0}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Progress value={player1.rating?.subRatings.serve || 0} className="bg-blue-100" />
                  <Progress value={player2.rating?.subRatings.serve || 0} className="bg-red-100" />
                </div>
              </div>

              {/* Reception */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{t('team.dashboard.reception')}</span>
                  <div className="flex gap-4">
                    <span className="text-blue-600 font-medium">
                      {player1.rating?.subRatings.reception || 0}
                    </span>
                    <span className="text-red-600 font-medium">
                      {player2.rating?.subRatings.reception || 0}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Progress value={player1.rating?.subRatings.reception || 0} className="bg-blue-100" />
                  <Progress value={player2.rating?.subRatings.reception || 0} className="bg-red-100" />
                </div>
              </div>

              {/* Consistency */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{t('team.dashboard.consistency')}</span>
                  <div className="flex gap-4">
                    <span className="text-blue-600 font-medium">
                      {player1.rating?.subRatings.consistency || 0}
                    </span>
                    <span className="text-red-600 font-medium">
                      {player2.rating?.subRatings.consistency || 0}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Progress
                    value={player1.rating?.subRatings.consistency || 0}
                    className="bg-blue-100"
                  />
                  <Progress
                    value={player2.rating?.subRatings.consistency || 0}
                    className="bg-red-100"
                  />
                </div>
              </div>

              {/* Games Played */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('player.stats.gamesPlayed')}</span>
                  <div className="flex gap-4">
                    <Badge variant="outline" className="border-blue-600 text-blue-600">
                      {player1.rating?.gamesPlayed || 0}
                    </Badge>
                    <Badge variant="outline" className="border-red-600 text-red-600">
                      {player2.rating?.gamesPlayed || 0}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
