import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { POSITION_NAMES, type VolleyballPosition } from '@/types/database.types';
import type { PlayerWithMemberships } from '@/services/players.service';
import type { PlayerRating } from '@/services/player-stats.service';

interface PlayerWithRating extends PlayerWithMemberships {
  rating?: number;
  jerseyNumber?: number;
}

interface SquadRosterProps {
  players: PlayerWithRating[];
  isLoading?: boolean;
}

type SortOption = 'rating' | 'name' | 'number';

/**
 * SquadRoster component
 * Displays team roster with player ratings, sortable
 */
export function SquadRoster({ players, isLoading = false }: SquadRosterProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>('rating');

  const sortedPlayers = [...players].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'number':
        return (a.jerseyNumber || 999) - (b.jerseyNumber || 999);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('team.dashboard.squadRoster')}</CardTitle>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('team.dashboard.squadRoster')}</CardTitle>
            <CardDescription>
              {t('team.dashboard.allPlayers')} ({players.length})
            </CardDescription>
          </div>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('team.dashboard.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">{t('team.dashboard.sortByRating')}</SelectItem>
              <SelectItem value="name">{t('team.dashboard.sortByName')}</SelectItem>
              <SelectItem value="number">{t('team.dashboard.sortByNumber')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('player.noPlayers')}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => navigate(`/players/${player.id}`)}
              >
                <div className="flex items-center gap-3">
                  {/* Jersey Number */}
                  {player.jerseyNumber && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                      {player.jerseyNumber}
                    </div>
                  )}

                  {/* Player Photo */}
                  {player.photo_url ? (
                    <img
                      src={player.photo_url}
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {player.name.charAt(0)}
                    </div>
                  )}

                  {/* Player Info */}
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <div className="flex gap-1 mt-1">
                      {player.positions.slice(0, 2).map((pos) => (
                        <Badge key={pos} variant="secondary" className="text-xs">
                          {POSITION_NAMES[pos as VolleyballPosition]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="text-right">
                  {player.rating ? (
                    <>
                      <div className="text-2xl font-bold">{player.rating}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('team.dashboard.rating')}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {t('player.stats.noData')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
