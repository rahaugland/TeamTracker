import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/player/PlayerAvatar';
import { usePlayerRankings } from '@/hooks/usePlayerRankings';
import type { DateRange } from '@/services/analytics.service';

type RankingCategory = 'overall' | 'attack' | 'serve' | 'defense' | 'reception' | 'attendance';

interface RankingRow {
  rank: number;
  playerId: string;
  playerName: string;
  photoUrl?: string;
  position: string;
  value: number;
  label: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

interface PlayerRankingsTabProps {
  teamId: string;
  dateRange?: DateRange;
}

export function PlayerRankingsTab({ teamId, dateRange }: PlayerRankingsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { rankings, attendanceRates, isLoading } = usePlayerRankings(teamId, dateRange);
  const [category, setCategory] = useState<RankingCategory>('overall');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-10 w-48 bg-muted rounded" />
        <div className="animate-pulse h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  const getSortedData = (): RankingRow[] => {
    switch (category) {
      case 'overall':
        return rankings.map((r, i) => ({
          rank: i + 1,
          playerId: r.playerId,
          playerName: r.playerName,
          photoUrl: r.photoUrl,
          position: r.position,
          value: r.rating.overall,
          label: '',
        }));
      case 'attack':
        return [...rankings]
          .sort((a, b) => b.aggregated.killPercentage - a.aggregated.killPercentage)
          .map((r, i) => ({
            rank: i + 1,
            playerId: r.playerId,
            playerName: r.playerName,
            photoUrl: r.photoUrl,
            position: r.position,
            value: Math.round(r.aggregated.killPercentage * 1000) / 10,
            label: '%',
          }));
      case 'serve':
        return [...rankings]
          .sort((a, b) => b.aggregated.acesPerGame - a.aggregated.acesPerGame)
          .map((r, i) => ({
            rank: i + 1,
            playerId: r.playerId,
            playerName: r.playerName,
            photoUrl: r.photoUrl,
            position: r.position,
            value: Math.round(r.aggregated.acesPerGame * 10) / 10,
            label: '/gm',
          }));
      case 'defense':
        return [...rankings]
          .sort((a, b) => b.aggregated.digsPerGame - a.aggregated.digsPerGame)
          .map((r, i) => ({
            rank: i + 1,
            playerId: r.playerId,
            playerName: r.playerName,
            photoUrl: r.photoUrl,
            position: r.position,
            value: Math.round(r.aggregated.digsPerGame * 10) / 10,
            label: '/gm',
          }));
      case 'reception':
        return [...rankings]
          .sort((a, b) => b.aggregated.passRating - a.aggregated.passRating)
          .map((r, i) => ({
            rank: i + 1,
            playerId: r.playerId,
            playerName: r.playerName,
            photoUrl: r.photoUrl,
            position: r.position,
            value: Math.round(r.aggregated.passRating * 100) / 100,
            label: '',
          }));
      case 'attendance':
        return attendanceRates.map((a, i) => ({
          rank: i + 1,
          playerId: a.playerId,
          playerName: a.playerName,
          photoUrl: a.photoUrl,
          position: '',
          value: a.attendanceRate,
          label: '%',
        }));
      default:
        return [];
    }
  };

  const sortedData = getSortedData();

  const categoryLabel: Record<RankingCategory, string> = {
    overall: t('reports.rankings.overall'),
    attack: t('reports.rankings.attack'),
    serve: t('reports.rankings.serve'),
    defense: t('reports.rankings.defense'),
    reception: t('reports.rankings.reception'),
    attendance: t('reports.rankings.attendance'),
  };

  const metricHeader: Record<RankingCategory, string> = {
    overall: t('reports.rankings.rating'),
    attack: t('reports.rankings.killPct'),
    serve: t('reports.rankings.acesPerGame'),
    defense: t('reports.rankings.digsPerGame'),
    reception: t('reports.rankings.passRating'),
    attendance: t('reports.rankings.attendanceRate'),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={category} onValueChange={(v) => setCategory(v as RankingCategory)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(categoryLabel) as RankingCategory[]).map((key) => (
              <SelectItem key={key} value={key}>
                {categoryLabel[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{categoryLabel[category]}</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('reports.rankings.noData')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>{t('reports.rankings.player')}</TableHead>
                  {category !== 'attendance' && (
                    <TableHead>{t('reports.rankings.position')}</TableHead>
                  )}
                  <TableHead className="text-right">{metricHeader[category]}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row) => (
                  <TableRow
                    key={row.playerId}
                    className="cursor-pointer"
                    onClick={() => navigate(`/players/${row.playerId}/stats`)}
                  >
                    <TableCell className="font-mono text-muted-foreground">
                      {row.rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PlayerAvatar
                          initials={getInitials(row.playerName)}
                          imageUrl={row.photoUrl}
                          size="sm"
                        />
                        <span className="font-medium">{row.playerName}</span>
                      </div>
                    </TableCell>
                    {category !== 'attendance' && (
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {t(`player.positions.${row.position}`, row.position)}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-right font-mono font-bold">
                      {row.value}{row.label}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
