import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { usePlayerComparison } from '@/hooks/usePlayerComparison';
import type { DateRange } from '@/services/analytics.service';
import type { VolleyballPosition } from '@/types/database.types';

interface PlayerOption {
  id: string;
  name: string;
  position: VolleyballPosition;
}

interface PlayerComparisonTabProps {
  teamId: string;
  dateRange?: DateRange;
}

export function PlayerComparisonTab({ teamId, dateRange }: PlayerComparisonTabProps) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');

  const player1 = players.find((p) => p.id === player1Id);
  const player2 = players.find((p) => p.id === player2Id);

  const p1 = usePlayerComparison(
    player1Id || undefined,
    teamId,
    player1?.position || 'all_around',
    dateRange
  );
  const p2 = usePlayerComparison(
    player2Id || undefined,
    teamId,
    player2?.position || 'all_around',
    dateRange
  );

  useEffect(() => {
    supabase
      .from('team_memberships')
      .select('player_id, player:players(id, name, positions)')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) {
          setPlayers(
            (data as any[]).map((m) => ({
              id: m.player.id,
              name: m.player.name,
              position: m.player.positions?.[0] || 'all_around',
            }))
          );
        }
      });
  }, [teamId]);

  const isLoading = p1.isLoading || p2.isLoading;
  const bothSelected = player1Id && player2Id && p1.rating && p2.rating;

  const radarData = bothSelected
    ? [
        { category: t('team.dashboard.attack'), player1: p1.rating!.subRatings.attack, player2: p2.rating!.subRatings.attack },
        { category: t('team.dashboard.serve'), player1: p1.rating!.subRatings.serve, player2: p2.rating!.subRatings.serve },
        { category: t('team.dashboard.reception'), player1: p1.rating!.subRatings.reception, player2: p2.rating!.subRatings.reception },
        { category: t('team.dashboard.consistency'), player1: p1.rating!.subRatings.consistency, player2: p2.rating!.subRatings.consistency },
      ]
    : [];

  // Build game-by-game trend data
  const trendData = bothSelected
    ? (() => {
        const allDates = new Set<string>();
        const p1Map = new Map<string, number>();
        const p2Map = new Map<string, number>();

        for (const g of p1.gameLines) {
          const date = g.event.start_time.substring(0, 10);
          allDates.add(date);
          p1Map.set(date, g.killPercentage * 100);
        }
        for (const g of p2.gameLines) {
          const date = g.event.start_time.substring(0, 10);
          allDates.add(date);
          p2Map.set(date, g.killPercentage * 100);
        }

        return Array.from(allDates)
          .sort()
          .map((date) => ({
            date,
            player1: p1Map.get(date) ?? null,
            player2: p2Map.get(date) ?? null,
          }));
      })()
    : [];

  return (
    <div className="space-y-6">
      {/* Player Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">{t('team.dashboard.player1')}</label>
          <Select value={player1Id} onValueChange={setPlayer1Id}>
            <SelectTrigger>
              <SelectValue placeholder={t('common.labels.name')} />
            </SelectTrigger>
            <SelectContent>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.id} disabled={p.id === player2Id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">{t('team.dashboard.player2')}</label>
          <Select value={player2Id} onValueChange={setPlayer2Id}>
            <SelectTrigger>
              <SelectValue placeholder={t('common.labels.name')} />
            </SelectTrigger>
            <SelectContent>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.id} disabled={p.id === player1Id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <div className="animate-pulse h-64 bg-muted rounded-lg" />}

      {!bothSelected && !isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          {t('team.dashboard.noDataToCompare')}
        </div>
      )}

      {bothSelected && !isLoading && (
        <>
          {/* Overall Ratings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-6 border rounded-lg border-white/10">
              <div className="text-4xl font-bold">{p1.rating!.overall}</div>
              <div className="text-sm text-muted-foreground mt-1">{player1!.name}</div>
            </div>
            <div className="text-center p-6 border rounded-lg border-white/10">
              <div className="text-4xl font-bold">{p2.rating!.overall}</div>
              <div className="text-sm text-muted-foreground mt-1">{player2!.name}</div>
            </div>
          </div>

          {/* Radar Chart */}
          {radarData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.comparison.radarTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.2)" />
                    <PolarAngleAxis dataKey="category" tick={{ fill: '#8B95A5' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 99]} tick={{ fill: '#8B95A5' }} />
                    <Radar name={player1!.name} dataKey="player1" stroke="#2EC4B6" fill="#2EC4B6" fillOpacity={0.5} />
                    <Radar name={player2!.name} dataKey="player2" stroke="#E63946" fill="#E63946" fillOpacity={0.5} />
                    <Legend wrapperStyle={{ color: '#8B95A5' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Stats Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.comparison.statsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: t('reports.comparison.kills'), v1: p1.aggregated!.killsPerGame, v2: p2.aggregated!.killsPerGame, fmt: (v: number) => v.toFixed(1) },
                { label: t('reports.comparison.aces'), v1: p1.aggregated!.acesPerGame, v2: p2.aggregated!.acesPerGame, fmt: (v: number) => v.toFixed(1) },
                { label: t('reports.comparison.digs'), v1: p1.aggregated!.digsPerGame, v2: p2.aggregated!.digsPerGame, fmt: (v: number) => v.toFixed(1) },
                { label: t('reports.comparison.blocks'), v1: p1.aggregated!.blocksPerGame, v2: p2.aggregated!.blocksPerGame, fmt: (v: number) => v.toFixed(1) },
                { label: t('reports.comparison.killPct'), v1: p1.aggregated!.killPercentage * 100, v2: p2.aggregated!.killPercentage * 100, fmt: (v: number) => `${v.toFixed(1)}%` },
                { label: t('reports.comparison.passRating'), v1: p1.aggregated!.passRating, v2: p2.aggregated!.passRating, fmt: (v: number) => v.toFixed(2) },
                {
                  label: t('reports.comparison.attendanceRate'),
                  v1: p1.attendance ? Math.round(p1.attendance.attendanceRate * 100) : 0,
                  v2: p2.attendance ? Math.round(p2.attendance.attendanceRate * 100) : 0,
                  fmt: (v: number) => `${v}%`,
                },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{row.label}</span>
                    <div className="flex gap-4">
                      <span className="text-vq-teal font-medium">{row.fmt(row.v1)}</span>
                      <span className="text-club-primary font-medium">{row.fmt(row.v2)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Progress value={Math.min(row.v1, 100)} className="bg-vq-teal/20" />
                    <Progress value={Math.min(row.v2, 100)} className="bg-club-primary/20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Game Trend */}
          {trendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.comparison.trendTitle')}</CardTitle>
                <CardDescription>{t('reports.comparison.trendDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" tick={{ fill: '#8B95A5', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#8B95A5' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <Legend wrapperStyle={{ color: '#8B95A5' }} />
                    <Line type="monotone" dataKey="player1" name={player1!.name} stroke="#2EC4B6" dot={false} connectNulls />
                    <Line type="monotone" dataKey="player2" name={player2!.name} stroke="#E63946" dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Rotation Heatmap */}
          {(p1.rotationStats.length > 0 || p2.rotationStats.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.comparison.rotationTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-vq-teal">{player1!.name}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((r) => {
                        const rs = p1.rotationStats.find((s) => s.rotation === r);
                        return (
                          <div
                            key={r}
                            className="text-center p-2 rounded border border-white/10 text-xs"
                          >
                            <div className="font-bold">R{r}</div>
                            <div>{rs ? `${(rs.killPercentage * 100).toFixed(0)}%` : '-'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-club-primary">{player2!.name}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((r) => {
                        const rs = p2.rotationStats.find((s) => s.rotation === r);
                        return (
                          <div
                            key={r}
                            className="text-center p-2 rounded border border-white/10 text-xs"
                          >
                            <div className="font-bold">R{r}</div>
                            <div>{rs ? `${(rs.killPercentage * 100).toFixed(0)}%` : '-'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
