import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Check, ChevronRight } from 'lucide-react';
import { getEvent, type EventWithDetails } from '@/services/events.service';
import { getPlayersByTeam } from '@/services/players.service';
import { getEventRSVPs } from '@/services/rsvp.service';
import { getMatchRoster, saveMatchRoster } from '@/services/match-roster.service';
import { getBatchPlayerSelectionStats, type PlayerSelectionStats } from '@/services/player-stats.service';
import { useAuth } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlayerAvatar } from '@/components/player';
import { FormIndicator } from '@/components/match';
import { cn } from '@/lib/utils';
import { POSITION_NAMES } from '@/types/database.types';
import type { Player, Rsvp, VolleyballPosition } from '@/types/database.types';

interface PlayerWithRSVP extends Player {
  rsvpStatus?: Rsvp['status'];
}

/**
 * MatchSelectionPage component
 * Used for coaches to select the starting lineup before a game/match
 */
export function MatchSelectionPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [players, setPlayers] = useState<PlayerWithRSVP[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [playerStats, setPlayerStats] = useState<Map<string, PlayerSelectionStats>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    if (!eventId) return;

    setIsLoading(true);
    setIsLoadingStats(true);
    try {
      // Load event details
      const eventData = await getEvent(eventId);
      setEvent(eventData);

      if (eventData?.team?.id) {
        // Load team players
        const playersData = await getPlayersByTeam(eventData.team.id);

        // Load RSVPs
        const rsvpsData = await getEventRSVPs(eventId);
        const rsvpMap = new Map(rsvpsData.map(r => [r.player_id, r.status]));

        // Combine player data with RSVP status
        const playersWithRSVP = playersData.map(player => ({
          ...player,
          rsvpStatus: rsvpMap.get(player.id),
        }));

        setPlayers(playersWithRSVP);

        // Load existing roster selection
        const existingRoster = await getMatchRoster(eventId);
        setSelectedPlayerIds(new Set(existingRoster));

        // Load player stats in parallel
        const playerList = playersData.map(p => ({
          id: p.id,
          position: p.positions?.[0],
        }));
        const stats = await getBatchPlayerSelectionStats(playerList, eventData.team.id);
        setPlayerStats(stats);
      }
    } catch (error) {
      console.error('Error loading match selection data:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingStats(false);
    }
  };

  const togglePlayerSelection = (playerId: string, isAvailable: boolean) => {
    if (!isAvailable) return;

    setSelectedPlayerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const handleSaveLineup = async () => {
    if (!eventId || !user?.id) return;

    setIsSaving(true);
    try {
      await saveMatchRoster(eventId, Array.from(selectedPlayerIds), user.id);
      navigate(`/events/${eventId}`);
    } catch (error) {
      console.error('Error saving lineup:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedPlayerIds(new Set());
  };

  const getPositionShorthand = (position: VolleyballPosition): string => {
    const shortMap: Record<VolleyballPosition, string> = {
      setter: 'S',
      outside_hitter: 'OH',
      middle_blocker: 'MB',
      opposite: 'OPP',
      libero: 'L',
      defensive_specialist: 'DS',
      all_around: 'AA',
    };
    return shortMap[position] || position.substring(0, 2).toUpperCase();
  };

  const getPlayerInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const isPlayerAvailable = (player: PlayerWithRSVP): boolean => {
    return player.rsvpStatus === 'attending' || player.rsvpStatus === 'maybe' || player.rsvpStatus === 'pending';
  };

  const formatPlayerStats = (player: PlayerWithRSVP): string => {
    const stats = playerStats.get(player.id);
    const primaryPosition = player.positions?.[0];
    const positionShort = primaryPosition ? getPositionShorthand(primaryPosition) : '';

    if (!stats || isLoadingStats) {
      return positionShort ? `${positionShort}` : 'No position';
    }

    const parts = [positionShort];
    if (stats.attendancePercent > 0) {
      parts.push(`${stats.attendancePercent}% att`);
    }
    if (stats.keyStat.value > 0) {
      parts.push(`${stats.keyStat.value} ${stats.keyStat.label}`);
    }

    return parts.join(' \u2022 ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('event.notFound')}</p>
      </div>
    );
  }

  const availablePlayers = players.filter(isPlayerAvailable);
  const unavailablePlayers = players.filter(p => !isPlayerAvailable(p));
  const selectedPlayers = players.filter(p => selectedPlayerIds.has(p.id));

  const formatEventDateTime = () => {
    const startDate = new Date(event.start_time);
    const dateStr = format(startDate, 'EEEE, MMMM d, yyyy');
    const timeStr = format(startDate, 'HH:mm');
    return { dateStr, timeStr };
  };

  const { dateStr, timeStr } = formatEventDateTime();

  return (
    <div className="min-h-screen bg-navy-90">
      {/* Header */}
      <div className="gradient-accent px-4 py-8 mb-6 shadow-lg">
        <div className="container max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-4">
            <Link
              to="/coach-dashboard"
              className="text-white/70 hover:text-white transition-colors"
            >
              {t('nav.dashboard', 'Dashboard')}
            </Link>
            <ChevronRight className="w-4 h-4 text-white/50" />
            <Link
              to="/schedule"
              className="text-white/70 hover:text-white transition-colors"
            >
              {t('nav.schedule', 'Schedule')}
            </Link>
            <ChevronRight className="w-4 h-4 text-white/50" />
            <span className="text-white font-medium">
              vs {event.opponent || t('event.opponent', 'Opponent')}
            </span>
          </nav>

          {/* Match Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-center gap-8 mb-4">
              {/* Home Team */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-vq-teal/20 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-display font-bold text-vq-teal">
                    {event.team?.name?.substring(0, 2).toUpperCase() || 'HM'}
                  </span>
                </div>
                <p className="text-white font-bold">{event.team?.name || 'Home Team'}</p>
              </div>

              {/* VS */}
              <span className="text-3xl font-display font-bold text-white/50">VS</span>

              {/* Opponent */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-display font-bold text-blue-400">
                    {event.opponent?.substring(0, 2).toUpperCase() || 'OP'}
                  </span>
                </div>
                <p className="text-white font-bold">{event.opponent || 'Opponent'}</p>
              </div>
            </div>

            {/* Event Details */}
            <div className="flex items-center justify-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{timeStr}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>

          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white/70 mt-6">
            {t('matchSelection.title', 'Select Match Roster')}
          </h3>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="container max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Players Panel */}
          <Card className="bg-navy-80 border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="font-display font-bold text-white">
                {t('matchSelection.availablePlayers', 'Available Players')}
              </span>
              <span className="text-sm text-gray-400">
                {availablePlayers.length} {t('matchSelection.players', 'players')}
              </span>
            </div>

            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {availablePlayers.map((player) => {
                const isSelected = selectedPlayerIds.has(player.id);
                const primaryPosition = player.positions?.[0];
                const stats = playerStats.get(player.id);

                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayerSelection(player.id, true)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg transition-all',
                      'hover:bg-white/10 border',
                      isSelected
                        ? 'bg-vq-teal/20 border-vq-teal/50'
                        : 'bg-navy-70 border-white/5'
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        'w-5 h-5 rounded flex items-center justify-center border-2 transition-colors',
                        isSelected
                          ? 'bg-vq-teal border-vq-teal'
                          : 'border-gray-600'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-navy-90" />}
                    </div>

                    {/* Avatar */}
                    <PlayerAvatar
                      initials={getPlayerInitials(player.name)}
                      imageUrl={player.photo_url}
                      position={primaryPosition ? getPositionShorthand(primaryPosition) : undefined}
                      size="sm"
                    />

                    {/* Player Info */}
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-white truncate">{player.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {formatPlayerStats(player)}
                      </p>
                    </div>

                    {/* Position Badge */}
                    {primaryPosition && (
                      <span className="px-2 py-1 rounded bg-navy-80 border border-white/10 text-xs font-display font-bold text-gray-300">
                        {getPositionShorthand(primaryPosition)}
                      </span>
                    )}

                    {/* Form Indicator */}
                    {stats && (
                      <FormIndicator form={stats.form} size="md" />
                    )}
                  </button>
                );
              })}

              {/* Unavailable Players */}
              {unavailablePlayers.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-xs font-display font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {t('matchSelection.unavailable', 'Unavailable')}
                  </p>
                  {unavailablePlayers.map((player) => {
                    const primaryPosition = player.positions?.[0];
                    const stats = playerStats.get(player.id);

                    return (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-navy-70/50 border border-white/5 opacity-50 mb-2"
                      >
                        {/* Checkbox (disabled) */}
                        <div className="w-5 h-5 rounded border-2 border-gray-700" />

                        {/* Avatar */}
                        <PlayerAvatar
                          initials={getPlayerInitials(player.name)}
                          imageUrl={player.photo_url}
                          position={primaryPosition ? getPositionShorthand(primaryPosition) : undefined}
                          size="sm"
                        />

                        {/* Player Info */}
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-bold text-gray-500 truncate">{player.name}</p>
                          <p className="text-xs text-gray-600">
                            {primaryPosition ? `${getPositionShorthand(primaryPosition)} \u2022 ` : ''}
                            {t('matchSelection.notAvailable', 'Not available')}
                          </p>
                        </div>

                        {/* Position Badge */}
                        {primaryPosition && (
                          <span className="px-2 py-1 rounded bg-navy-80 border border-white/10 text-xs font-display font-bold text-gray-600">
                            {getPositionShorthand(primaryPosition)}
                          </span>
                        )}

                        {/* Form Indicator */}
                        {stats && (
                          <FormIndicator form={stats.form} size="md" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {availablePlayers.length === 0 && unavailablePlayers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">{t('matchSelection.noPlayers', 'No players available')}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Selected Lineup Panel */}
          <Card className="bg-navy-80 border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="font-display font-bold text-white">
                {t('matchSelection.matchRoster', 'Match Roster')}
              </span>
              <span className={cn(
                'text-sm font-bold',
                selectedPlayerIds.size > 0 ? 'text-vq-teal' : 'text-gray-400'
              )}>
                {selectedPlayerIds.size} {t('matchSelection.selected', 'selected')}
              </span>
            </div>

            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {selectedPlayers.length > 0 ? (
                selectedPlayers.map((player) => {
                  const primaryPosition = player.positions?.[0];

                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-navy-70 border border-white/10"
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => togglePlayerSelection(player.id, true)}
                        className="w-5 h-5 rounded flex items-center justify-center bg-vq-teal border-2 border-vq-teal transition-colors hover:bg-vq-teal/80"
                      >
                        <Check className="w-3 h-3 text-navy-90" />
                      </button>

                      {/* Avatar */}
                      <PlayerAvatar
                        initials={getPlayerInitials(player.name)}
                        imageUrl={player.photo_url}
                        position={primaryPosition ? getPositionShorthand(primaryPosition) : undefined}
                        size="sm"
                      />

                      {/* Player Info - Show full position name in selected panel */}
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-bold text-white truncate">{player.name}</p>
                        <p className="text-xs text-gray-400">
                          {primaryPosition ? POSITION_NAMES[primaryPosition] : 'No position'}
                        </p>
                      </div>

                      {/* Position Badge */}
                      {primaryPosition && (
                        <span className="px-2 py-1 rounded bg-navy-80 border border-white/10 text-xs font-display font-bold text-gray-300">
                          {getPositionShorthand(primaryPosition)}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">
                    {t('matchSelection.noPlayersSelected', 'No players selected yet')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('matchSelection.selectFromLeft', 'Select players from the list on the left')}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/10 space-y-3">
              <Button
                onClick={handleSaveLineup}
                disabled={selectedPlayerIds.size === 0 || isSaving}
                className="w-full"
                size="lg"
              >
                {isSaving
                  ? t('common.actions.saving', 'Saving...')
                  : t('matchSelection.saveRoster', 'Save Match Roster')}
              </Button>

              {selectedPlayerIds.size > 0 && (
                <Button
                  onClick={handleClearSelection}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  {t('matchSelection.clearSelection', 'Clear Selection')}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
