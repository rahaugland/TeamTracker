import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePlayers, useTeams } from '@/store';
import { getPlayers, deletePlayer, getPlayersByTeam } from '@/services/players.service';
import { getPlayerAttendance } from '@/services/attendance.service';
import { getPlayerStats, calculatePlayerRating } from '@/services/player-stats.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PlayerAvatar } from '@/components/player';
import { POSITION_NAMES, type VolleyballPosition, type Player } from '@/types/database.types';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'position';
type SortField = 'name' | 'attendance' | 'rating' | 'games';
type SortOrder = 'asc' | 'desc';

interface PlayerWithStats extends Player {
  attendancePercent: number;
  gamesPlayed: number;
  rating: number;
}

/**
 * Get position abbreviation for display
 */
function getPositionAbbr(position: VolleyballPosition): string {
  const abbr: Record<VolleyballPosition, string> = {
    setter: 'SET',
    outside_hitter: 'OH',
    middle_blocker: 'MB',
    opposite: 'OPP',
    libero: 'LIB',
    defensive_specialist: 'DS',
    all_around: 'ALL',
  };
  return abbr[position];
}

/**
 * Get player initials from name
 */
function getPlayerInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * PlayersPage component
 * Lists all players with search functionality
 */
export function PlayersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { players, setPlayers } = usePlayers();
  const { getActiveTeam, activeTeamId } = useTeams();
  const currentTeam = getActiveTeam();

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; playerId: string | null }>({
    open: false,
    playerId: null,
  });
  const [playersWithStats, setPlayersWithStats] = useState<PlayerWithStats[]>([]);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const loadPlayers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get players - either by team or all
      let playersData: Player[];
      if (activeTeamId) {
        playersData = await getPlayersByTeam(activeTeamId);
      } else {
        playersData = await getPlayers();
      }
      setPlayers(playersData);

      // Load stats for each player in parallel
      const playersStats = await Promise.all(
        playersData.map(async (player) => {
          try {
            // Get attendance data
            const attendanceRecords = await getPlayerAttendance(player.id);
            const recentRecords = attendanceRecords.slice(0, 20); // Last 20 events
            const presentCount = recentRecords.filter(
              r => r.status === 'present' || r.status === 'late'
            ).length;
            const attendancePercent = recentRecords.length > 0
              ? Math.round((presentCount / recentRecords.length) * 100)
              : 0;

            // Get game stats and rating
            const primaryPosition = player.positions?.[0] || 'all_around';
            const gameStats = await getPlayerStats(player.id, 'career', undefined, activeTeamId || undefined);
            const gamesPlayed = gameStats.length;

            let rating = 0;
            if (gameStats.length > 0) {
              const playerRating = calculatePlayerRating(gameStats, primaryPosition);
              rating = playerRating.overall;
            }

            return {
              ...player,
              attendancePercent,
              gamesPlayed,
              rating,
            };
          } catch (error) {
            console.error(`Error loading stats for player ${player.id}:`, error);
            return {
              ...player,
              attendancePercent: 0,
              gamesPlayed: 0,
              rating: 0,
            };
          }
        })
      );

      setPlayersWithStats(playersStats);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setPlayers, activeTeamId]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleDeletePlayer = async () => {
    if (!deleteConfirm.playerId) return;

    try {
      await deletePlayer(deleteConfirm.playerId);
      setPlayers(players.filter((p) => p.id !== deleteConfirm.playerId));
      setPlayersWithStats(playersWithStats.filter((p) => p.id !== deleteConfirm.playerId));
      setDeleteConfirm({ open: false, playerId: null });
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc'); // Default desc for numeric, asc for name
    }
  };

  const filteredAndSortedPlayers = useMemo(() => {
    const filtered = playersWithStats.filter((player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'attendance':
          comparison = a.attendancePercent - b.attendancePercent;
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'games':
          comparison = a.gamesPlayed - b.gamesPlayed;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [playersWithStats, searchQuery, sortField, sortOrder]);

  // Group players by position for position view
  const playersByPosition = filteredAndSortedPlayers.reduce((acc, player) => {
    player.positions.forEach(pos => {
      if (!acc[pos]) acc[pos] = [];
      acc[pos].push(player);
    });
    return acc;
  }, {} as Record<VolleyballPosition, PlayerWithStats[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-[32px] uppercase tracking-tight text-white mb-1">
          {t('navigation.players')}
        </h1>
        <p className="text-sm text-gray-400">
          {currentTeam?.name} • {filteredAndSortedPlayers.length} {filteredAndSortedPlayers.length === 1 ? 'player' : 'players'}
        </p>
      </div>

      {/* Search Bar and Add Button */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder={t('player.searchPlayers')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-navy-90 border-white/10 text-white placeholder:text-gray-400 focus:border-club-primary"
        />
        <Button
          onClick={() => navigate('/players/new')}
          className="bg-club-primary hover:bg-club-primary-dim text-white font-display font-semibold uppercase tracking-wide"
        >
          {t('player.addPlayer')}
        </Button>
      </div>

      {/* Filter Tabs and Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/[0.06] pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'font-display font-semibold text-[13px] uppercase tracking-wide px-4 py-2 rounded-md transition-all',
              activeTab === 'all'
                ? 'bg-club-primary text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            All Players
          </button>
          <button
            onClick={() => setActiveTab('position')}
            className={cn(
              'font-display font-semibold text-[13px] uppercase tracking-wide px-4 py-2 rounded-md transition-all',
              activeTab === 'position'
                ? 'bg-club-primary text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            By Position
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Sort by:</span>
          <button
            onClick={() => handleSort('name')}
            className={cn(
              'font-display font-semibold text-[11px] uppercase tracking-wide px-3 py-1.5 rounded transition-all',
              sortField === 'name'
                ? 'bg-vq-teal/20 text-vq-teal'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('attendance')}
            className={cn(
              'font-display font-semibold text-[11px] uppercase tracking-wide px-3 py-1.5 rounded transition-all',
              sortField === 'attendance'
                ? 'bg-vq-teal/20 text-vq-teal'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            Attendance {sortField === 'attendance' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('rating')}
            className={cn(
              'font-display font-semibold text-[11px] uppercase tracking-wide px-3 py-1.5 rounded transition-all',
              sortField === 'rating'
                ? 'bg-vq-teal/20 text-vq-teal'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            Rating {sortField === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('games')}
            className={cn(
              'font-display font-semibold text-[11px] uppercase tracking-wide px-3 py-1.5 rounded transition-all',
              sortField === 'games'
                ? 'bg-vq-teal/20 text-vq-teal'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            Games {sortField === 'games' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Players Grid or Empty State */}
      {filteredAndSortedPlayers.length === 0 ? (
        <EmptyState
          title={players.length === 0 ? t('player.noPlayers') : t('player.search.noResults')}
          description={players.length === 0 ? t('player.noPlayersDescription') : t('player.search.tryDifferentQuery')}
          action={
            players.length === 0
              ? {
                  label: t('player.addPlayer'),
                  onClick: () => navigate('/players/new'),
                }
              : undefined
          }
        />
      ) : activeTab === 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onView={() => navigate(`/players/${player.id}`)}
              onDelete={() => setDeleteConfirm({ open: true, playerId: player.id })}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(playersByPosition).map(([position, posPlayers]) => (
            <div key={position}>
              <h2 className="font-display font-bold text-xl uppercase tracking-tight text-white mb-4">
                {POSITION_NAMES[position as VolleyballPosition]} ({posPlayers.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onView={() => navigate(`/players/${player.id}`)}
                    onDelete={() => setDeleteConfirm({ open: true, playerId: player.id })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, playerId: null })}
        title={t('player.deletePlayer')}
        description={t('player.deleteConfirm')}
        onConfirm={handleDeletePlayer}
        variant="destructive"
      />
    </div>
  );
}

/**
 * PlayerCard component - individual player card for the grid
 */
interface PlayerCardProps {
  player: PlayerWithStats;
  onView: () => void;
  onDelete: () => void;
}

function PlayerCard({ player, onView, onDelete }: PlayerCardProps) {
  const initials = getPlayerInitials(player.name);
  const primaryPosition = player.positions[0];
  const positionAbbr = primaryPosition ? getPositionAbbr(primaryPosition) : '';

  // Get jersey number from team membership if available
  const jerseyNumber = (player as any).team_memberships?.[0]?.jersey_number;

  return (
    <div
      className="bg-navy-90 border border-white/[0.06] rounded-lg p-4 hover:border-white/[0.12] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      onClick={onView}
    >
      {/* Player Card Top - Avatar and Info */}
      <div className="flex items-center gap-4 mb-4">
        <PlayerAvatar
          initials={initials}
          imageUrl={player.photo_url}
          position={positionAbbr}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-base text-white truncate">
            {player.name}
          </p>
          <p className="text-xs text-gray-400">
            {POSITION_NAMES[primaryPosition]} {jerseyNumber ? `• #${jerseyNumber}` : ''}
          </p>
        </div>
      </div>

      {/* Player Card Stats */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/[0.06]">
        <div className="text-center">
          <p className={cn(
            "font-mono font-bold text-lg",
            player.attendancePercent >= 80 ? "text-green-400" :
            player.attendancePercent >= 60 ? "text-yellow-400" :
            player.attendancePercent > 0 ? "text-red-400" : "text-gray-500"
          )}>
            {player.attendancePercent > 0 ? `${player.attendancePercent}%` : '-'}
          </p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">
            Attendance
          </p>
        </div>
        <div className="text-center">
          <p className="font-mono font-bold text-lg text-gray-300">
            {player.gamesPlayed || '-'}
          </p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">
            Games
          </p>
        </div>
        <div className="text-center">
          <p className={cn(
            "font-mono font-bold text-lg",
            player.rating >= 80 ? "text-green-400" :
            player.rating >= 60 ? "text-yellow-400" :
            player.rating > 0 ? "text-gray-300" : "text-gray-500"
          )}>
            {player.rating || '-'}
          </p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">
            Rating
          </p>
        </div>
      </div>

      {/* Quick Actions - Stop propagation to prevent navigation when deleting */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          View Profile
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-gray-400 hover:text-club-primary"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
