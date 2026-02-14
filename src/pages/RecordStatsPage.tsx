import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { useAuth, useUI } from '@/store';
import { getEvent, updateEvent, finalizeGame } from '@/services/events.service';
import { getEventAttendance } from '@/services/attendance.service';
import { getPlayersByTeam } from '@/services/players.service';
import {
  getStatEntriesForEvent,
  createStatEntry,
  updateStatEntry,
} from '@/services/player-stats.service';
import type { EventWithDetails } from '@/services/events.service';
import type { AttendanceRecordWithPlayer } from '@/services/attendance.service';
import type { PlayerWithMemberships } from '@/services/players.service';
import type { StatEntry } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  MatchStatsHeader,
  QuickStatsSummary,
  ViewToggle,
  PlayerSelector,
  PlayerStatsCard,
  ActionBar,
  type PlayerStatRow,
  type ViewMode,
  type TeamTotals,
  type SetScore,
} from '@/components/match-stats';
import { SpreadsheetView } from './RecordStatsPage.Spreadsheet';

/**
 * RecordStatsPage component
 * Enhanced stat recording interface with player cards and spreadsheet views
 */
export function RecordStatsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addNotification } = useUI();

  // Data state
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecordWithPlayer[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<PlayerWithMemberships[]>([]);
  const [statEntries, setStatEntries] = useState<StatEntry[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStatRow[]>([]);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  // Match score state
  const [setsWon, setSetsWon] = useState(0);
  const [setsLost, setSetsLost] = useState(0);
  const [setScores, setSetScores] = useState<SetScore[]>([]);

  const isCoach = user?.role === 'head_coach' || user?.role === 'assistant_coach';

  useEffect(() => {
    if (id) {
      loadEventData(id);
    }
  }, [id]);

  const loadEventData = async (eventId: string) => {
    setIsLoading(true);
    try {
      const [eventData, attendanceData] = await Promise.all([
        getEvent(eventId),
        getEventAttendance(eventId),
      ]);

      if (eventData) {
        setEvent(eventData);
        setAttendance(attendanceData);
        setSetsWon(eventData.sets_won || 0);
        setSetsLost(eventData.sets_lost || 0);
        // Convert set_scores from number[][] to SetScore[]
        const scores: SetScore[] = (eventData.set_scores || []).map((s: number[]) => ({
          home: s[0] || 0,
          away: s[1] || 0,
        }));
        setSetScores(scores);

        const players = await getPlayersByTeam(eventData.team_id);
        setTeamPlayers(players);

        const stats = await getStatEntriesForEvent(eventId);
        setStatEntries(stats);

        const rows = initializePlayerStats(players, attendanceData, stats);
        setPlayerStats(rows);

        // Select first player by default
        if (rows.length > 0) {
          setSelectedPlayerId(rows[0].playerId);
        }
      }
    } catch (err) {
      console.error('Error loading event data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const initializePlayerStats = (
    players: PlayerWithMemberships[],
    attendanceRecords: AttendanceRecordWithPlayer[],
    stats: StatEntry[]
  ): PlayerStatRow[] => {
    const attendedPlayerIds = attendanceRecords
      .filter((record) => record.status === 'present' || record.status === 'late')
      .map((record) => record.player_id);

    const attendedPlayers = players.filter((player) =>
      attendedPlayerIds.includes(player.id)
    );

    return attendedPlayers.map((player) => {
      const existingEntry = stats.find((entry) => entry.player_id === player.id);

      return {
        playerId: player.id,
        playerName: player.name,
        statEntryId: existingEntry?.id,
        kills: existingEntry?.kills || 0,
        attackErrors: existingEntry?.attack_errors || 0,
        attackAttempts: existingEntry?.attack_attempts || 0,
        aces: existingEntry?.aces || 0,
        serviceErrors: existingEntry?.service_errors || 0,
        serveAttempts: existingEntry?.serve_attempts || 0,
        digs: existingEntry?.digs || 0,
        blockSolos: existingEntry?.block_solos || 0,
        blockAssists: existingEntry?.block_assists || 0,
        ballHandlingErrors: existingEntry?.ball_handling_errors || 0,
        passAttempts: existingEntry?.pass_attempts || 0,
        passSum: existingEntry?.pass_sum || 0,
        blockTouches: existingEntry?.block_touches || 0,
        setAttempts: existingEntry?.set_attempts || 0,
        setSum: existingEntry?.set_sum || 0,
        settingErrors: existingEntry?.setting_errors || 0,
        setsPlayed: existingEntry?.sets_played || 0,
        rotationsPlayed: existingEntry?.rotations_played || 0,
        rotation: existingEntry?.rotation ?? null,
      };
    });
  };

  const handleStatChange = useCallback(
    (playerId: string, field: keyof PlayerStatRow, value: number) => {
      setPlayerStats((prev) =>
        prev.map((row) =>
          row.playerId === playerId ? { ...row, [field]: Math.max(0, value) } : row
        )
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleRotationChange = useCallback((playerId: string, rotation: number | null) => {
    setPlayerStats((prev) =>
      prev.map((row) =>
        row.playerId === playerId ? { ...row, rotation } : row
      )
    );
    setHasUnsavedChanges(true);
  }, []);

  const handleScoreChange = useCallback((newSetsWon: number, newSetsLost: number) => {
    setSetsWon(newSetsWon);
    setSetsLost(newSetsLost);
    setHasUnsavedChanges(true);
  }, []);

  const handleSetScoresChange = useCallback((newSetScores: SetScore[]) => {
    setSetScores(newSetScores);
    setHasUnsavedChanges(true);
  }, []);

  const handleSaveAll = async () => {
    if (!id || !user?.id) return;

    setIsSaving(true);
    try {
      // Save match score and set scores
      await updateEvent(id, {
        sets_won: setsWon,
        sets_lost: setsLost,
        set_scores: setScores.map(s => [s.home, s.away]),
      });

      // Save all player stats in parallel so one failure doesn't block the rest
      const saveResults = await Promise.allSettled(
        playerStats.map(async (row) => {
          const statData = {
            kills: row.kills,
            attack_errors: row.attackErrors,
            attack_attempts: row.attackAttempts,
            aces: row.aces,
            service_errors: row.serviceErrors,
            serve_attempts: row.serveAttempts,
            digs: row.digs,
            block_solos: row.blockSolos,
            block_assists: row.blockAssists,
            ball_handling_errors: row.ballHandlingErrors,
            pass_attempts: row.passAttempts,
            pass_sum: row.passSum,
            block_touches: row.blockTouches,
            set_attempts: row.setAttempts,
            set_sum: row.setSum,
            setting_errors: row.settingErrors,
            sets_played: row.setsPlayed,
            rotations_played: row.rotationsPlayed,
            rotation: (row.rotation as 1 | 2 | 3 | 4 | 5 | 6 | undefined) ?? undefined,
          };

          if (row.statEntryId) {
            await updateStatEntry(row.statEntryId, statData);
            return { playerId: row.playerId, playerName: row.playerName };
          } else {
            const created = await createStatEntry({
              player_id: row.playerId,
              event_id: id,
              ...statData,
              recorded_by: user.id,
            });
            setPlayerStats((prev) =>
              prev.map((r) =>
                r.playerId === row.playerId ? { ...r, statEntryId: created.id } : r
              )
            );
            return { playerId: row.playerId, playerName: row.playerName };
          }
        })
      );

      // Check for failures and notify user
      const failures = saveResults.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected'
      );

      if (failures.length > 0) {
        console.error('Failed to save stats for some players:', failures);
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: `Failed to save stats for ${failures.length} player(s). Check console for details.`,
          duration: 8000,
        });
      }

      const stats = await getStatEntriesForEvent(id);
      setStatEntries(stats);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error saving stats:', err);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: t('common.messages.error'),
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!id || !user?.id) return;

    try {
      await handleSaveAll();
      await finalizeGame(id, user.id);
      navigate(`/events/${id}`);
    } catch (err) {
      console.error('Error finalizing match:', err);
    }
  };

  const handleCancel = () => {
    navigate(`/events/${id}`);
  };

  const handleNavigatePlayer = (direction: 'prev' | 'next') => {
    const currentIndex = playerStats.findIndex((p) => p.playerId === selectedPlayerId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < playerStats.length) {
      setSelectedPlayerId(playerStats[newIndex].playerId);
    }
  };

  // Calculate team totals
  const teamTotals: TeamTotals = useMemo(() => {
    return playerStats.reduce(
      (totals, row) => ({
        kills: totals.kills + row.kills,
        attackErrors: totals.attackErrors + row.attackErrors,
        attackAttempts: totals.attackAttempts + row.attackAttempts,
        aces: totals.aces + row.aces,
        serviceErrors: totals.serviceErrors + row.serviceErrors,
        serveAttempts: totals.serveAttempts + row.serveAttempts,
        digs: totals.digs + row.digs,
        blockSolos: totals.blockSolos + row.blockSolos,
        blockAssists: totals.blockAssists + row.blockAssists,
        blockTouches: totals.blockTouches + row.blockTouches,
        ballHandlingErrors: totals.ballHandlingErrors + row.ballHandlingErrors,
        passAttempts: totals.passAttempts + row.passAttempts,
        passSum: totals.passSum + row.passSum,
        setAttempts: totals.setAttempts + row.setAttempts,
        setSum: totals.setSum + row.setSum,
        settingErrors: totals.settingErrors + row.settingErrors,
      }),
      {
        kills: 0,
        attackErrors: 0,
        attackAttempts: 0,
        aces: 0,
        serviceErrors: 0,
        serveAttempts: 0,
        digs: 0,
        blockSolos: 0,
        blockAssists: 0,
        blockTouches: 0,
        ballHandlingErrors: 0,
        passAttempts: 0,
        passSum: 0,
        setAttempts: 0,
        setSum: 0,
        settingErrors: 0,
      }
    );
  }, [playerStats]);

  // Get selected player data
  const selectedPlayer = playerStats.find((p) => p.playerId === selectedPlayerId);
  const selectedPlayerInfo = teamPlayers.find((p) => p.id === selectedPlayerId);
  const selectedPlayerIndex = playerStats.findIndex((p) => p.playerId === selectedPlayerId);

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

  if (!isCoach) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('users.noPermission')}</p>
      </div>
    );
  }

  if (event.is_finalized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">{t('awards.gameFinalized')}</p>
        <Button variant="outline" onClick={() => navigate(`/events/${id}`)}>
          {t('common.buttons.back')}
        </Button>
      </div>
    );
  }

  const teamInitials = event.team?.name?.substring(0, 2).toUpperCase() || 'HM';
  const opponentInitials = event.opponent?.substring(0, 2).toUpperCase() || 'OP';

  return (
    <div className="min-h-screen bg-navy-90 pb-24">
      <div className="container max-w-7xl mx-auto py-6 px-4 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/coach-dashboard"
            className="text-gray-400 hover:text-vq-teal transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
          <Link
            to="/schedule"
            className="text-gray-400 hover:text-vq-teal transition-colors"
          >
            Schedule
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
          <Link
            to={`/events/${id}`}
            className="text-gray-400 hover:text-vq-teal transition-colors"
          >
            vs {event.opponent || 'Opponent'}
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
          <span className="text-white">Record Stats</span>
        </nav>

        {/* Match Header */}
        <MatchStatsHeader
          teamName={event.team?.name || 'Home Team'}
          teamInitials={teamInitials}
          opponent={event.opponent || 'Opponent'}
          opponentInitials={opponentInitials}
          eventType={event.type}
          startTime={event.start_time}
          location={event.location}
          setsWon={setsWon}
          setsLost={setsLost}
          setScores={setScores}
          onScoreChange={handleScoreChange}
          onSetScoresChange={handleSetScoresChange}
        />

        {/* Quick Stats Summary */}
        <QuickStatsSummary totals={teamTotals} />

        {/* View Toggle */}
        <ViewToggle mode={viewMode} onModeChange={setViewMode} />

        {/* Card View */}
        {viewMode === 'card' && (
          <>
            {/* Player Selector */}
            <PlayerSelector
              players={playerStats}
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={setSelectedPlayerId}
            />

            {/* Player Stats Card */}
            {selectedPlayer && (
              <PlayerStatsCard
                player={selectedPlayer}
                playerInfo={
                  selectedPlayerInfo
                    ? {
                        id: selectedPlayerInfo.id,
                        name: selectedPlayerInfo.name,
                        position: selectedPlayerInfo.positions?.[0],
                      }
                    : undefined
                }
                onStatChange={(field, value) =>
                  handleStatChange(selectedPlayer.playerId, field, value)
                }
                onRotationChange={(rotation) =>
                  handleRotationChange(selectedPlayer.playerId, rotation)
                }
                onNavigate={handleNavigatePlayer}
                canNavigatePrev={selectedPlayerIndex > 0}
                canNavigateNext={selectedPlayerIndex < playerStats.length - 1}
              />
            )}

            {playerStats.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No players attended this event. Mark attendance first.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate(`/events/${id}`)}
                >
                  Go to Event
                </Button>
              </div>
            )}
          </>
        )}

        {/* Spreadsheet View */}
        {viewMode === 'spreadsheet' && (
          <SpreadsheetView
            playerStats={playerStats}
            teamTotals={teamTotals}
            onStatChange={handleStatChange}
            onRotationChange={handleRotationChange}
          />
        )}

        {/* Action Bar */}
        <ActionBar
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          onCancel={handleCancel}
          onSaveAll={handleSaveAll}
          onFinalize={() => setShowFinalizeConfirm(true)}
          canFinalize={playerStats.length > 0}
        />
      </div>

      {/* Finalize Confirmation */}
      <ConfirmDialog
        open={showFinalizeConfirm}
        onOpenChange={setShowFinalizeConfirm}
        title="Finalize Match"
        description="This will lock all stats and calculate awards. This action cannot be undone. Are you sure?"
        onConfirm={handleFinalize}
      />
    </div>
  );
}
