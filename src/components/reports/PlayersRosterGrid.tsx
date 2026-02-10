import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/player/PlayerAvatar';
import { usePlayerRankings } from '@/hooks/usePlayerRankings';
import type { DateRange } from '@/services/analytics.service';
import type { VolleyballPosition } from '@/types/database.types';

type SortBy = 'rating' | 'name' | 'attendance';

interface SelectedPlayer {
  id: string;
  name: string;
  photoUrl?: string;
  position: VolleyballPosition;
}

interface PlayersRosterGridProps {
  teamId: string;
  dateRange?: DateRange;
  onSelectPlayer: (player: SelectedPlayer) => void;
}

const POSITIONS: VolleyballPosition[] = [
  'setter',
  'outside_hitter',
  'middle_blocker',
  'opposite',
  'libero',
  'defensive_specialist',
  'all_around',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function PlayersRosterGrid({ teamId, dateRange, onSelectPlayer }: PlayersRosterGridProps) {
  const { t } = useTranslation();
  const { rankings, attendanceRates, isLoading } = usePlayerRankings(teamId, dateRange);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('rating');

  const attendanceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of attendanceRates) {
      map.set(a.playerId, a.attendanceRate);
    }
    return map;
  }, [attendanceRates]);

  const filteredPlayers = useMemo(() => {
    let list = rankings;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => r.playerName.toLowerCase().includes(q));
    }

    if (positionFilter !== 'all') {
      list = list.filter((r) => r.position === positionFilter);
    }

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating.overall - a.rating.overall;
        case 'name':
          return a.playerName.localeCompare(b.playerName);
        case 'attendance':
          return (attendanceMap.get(b.playerId) ?? 0) - (attendanceMap.get(a.playerId) ?? 0);
        default:
          return 0;
      }
    });
  }, [rankings, searchQuery, positionFilter, sortBy, attendanceMap]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="animate-pulse h-10 flex-1 bg-muted rounded" />
          <div className="animate-pulse h-10 w-40 bg-muted rounded" />
          <div className="animate-pulse h-10 w-40 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse h-36 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('reports.players.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('reports.players.allPositions')}</SelectItem>
            {POSITIONS.map((pos) => (
              <SelectItem key={pos} value={pos}>
                {t(`player.positions.${pos}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">{t('reports.players.sortRating')}</SelectItem>
            <SelectItem value="name">{t('reports.players.sortName')}</SelectItem>
            <SelectItem value="attendance">{t('reports.players.sortAttendance')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Player Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {t('reports.players.noPlayers')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => {
            const att = attendanceMap.get(player.playerId) ?? 0;
            return (
              <button
                key={player.playerId}
                type="button"
                className="bg-navy-90 border border-white/[0.06] rounded-lg p-5 text-left transition-all duration-200 hover:border-white/[0.12] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vq-teal"
                onClick={() =>
                  onSelectPlayer({
                    id: player.playerId,
                    name: player.playerName,
                    photoUrl: player.photoUrl,
                    position: player.position,
                  })
                }
              >
                <div className="flex items-start gap-3">
                  <PlayerAvatar
                    initials={getInitials(player.playerName)}
                    imageUrl={player.photoUrl}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{player.playerName}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {t(`player.positions.${player.position}`, player.position)}
                    </Badge>
                  </div>
                  <span className="font-mono text-3xl font-bold text-white leading-none">
                    {player.rating.overall}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>
                    {player.rating.gamesPlayed} {t('reports.players.gamesPlayed')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        att >= 80
                          ? 'bg-green-500'
                          : att >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                    />
                    {Math.round(att)}% {t('reports.players.attendance')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
