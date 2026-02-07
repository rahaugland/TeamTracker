import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/store';
import { getEvent, deleteEvent, updateEvent, finalizeGame } from '@/services/events.service';
import { getAwardsForEvent } from '@/services/game-awards.service';
import { getEventAttendance, batchMarkAttendance } from '@/services/attendance.service';
import { getPlayersByTeam } from '@/services/players.service';
import { getPracticePlan } from '@/services/practice-plans.service';
import {
  createDrillExecution,
  updateDrillExecution,
  getExecutionByEventAndDrill,
} from '@/services/drill-executions.service';
import { getEventRSVPs, submitRSVP } from '@/services/rsvp.service';
import { getStatEntriesForEvent } from '@/services/player-stats.service';
import { formatDateTimeForDatabase } from '@/lib/date-utils';
import type { EventWithDetails } from '@/services/events.service';
import type { AttendanceRecordWithPlayer } from '@/services/attendance.service';
import type { PlayerWithMemberships } from '@/services/players.service';
import type { PracticePlanWithBlocks } from '@/services/practice-plans.service';
import type { RsvpWithPlayer } from '@/services/rsvp.service';
import type { AttendanceStatus, DrillExecution, GameAward, RsvpStatus, StatEntry } from '@/types/database.types';
import type { EventFormData } from '@/lib/validations/event';
import type { MatchResultData } from '@/components/forms/MatchResultForm';

interface UseEventDetailReturn {
  // Data state
  event: EventWithDetails | null;
  attendance: AttendanceRecordWithPlayer[];
  rsvps: RsvpWithPlayer[];
  teamPlayers: PlayerWithMemberships[];
  practicePlan: PracticePlanWithBlocks | null;
  drillExecutions: Record<string, DrillExecution>;
  executionNotes: Record<string, string>;
  statEntries: StatEntry[];
  gameAwards: GameAward[];

  // Loading & UI state
  isLoading: boolean;
  isSubmitting: boolean;
  isFinalizing: boolean;
  showDeleteConfirm: boolean;
  showEditDialog: boolean;
  showMatchResultForm: boolean;
  showFinalizeConfirm: boolean;
  rsvpCollapsed: boolean;

  // UI state setters
  setShowDeleteConfirm: (show: boolean) => void;
  setShowEditDialog: (show: boolean) => void;
  setShowMatchResultForm: (show: boolean) => void;
  setShowFinalizeConfirm: (show: boolean) => void;
  setRsvpCollapsed: (collapsed: boolean) => void;
  setExecutionNotes: (notes: Record<string, string>) => void;

  // Handlers
  handleRSVPChange: (playerId: string, status: RsvpStatus) => Promise<void>;
  handleBatchAttendanceSave: (changes: Map<string, AttendanceStatus>) => Promise<void>;
  handleFinalizeGame: () => Promise<void>;
  handleDeleteEvent: () => Promise<void>;
  handleEditEvent: (data: EventFormData) => Promise<void>;
  handleSaveMatchResult: (data: MatchResultData) => Promise<void>;
  handleMarkDrillExecuted: (drillId: string, rating: number) => Promise<void>;

  // Utilities
  getRSVPStatus: (playerId: string) => RsvpStatus;
  getAttendanceStatus: (playerId: string) => AttendanceStatus | undefined;

  // Computed values
  isCoach: boolean;
}

/**
 * Hook for managing event detail page state and data fetching
 */
export function useEventDetail(eventId: string | undefined, onDelete?: () => void): UseEventDetailReturn {
  const { user } = useAuth();

  // Data state
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecordWithPlayer[]>([]);
  const [rsvps, setRsvps] = useState<RsvpWithPlayer[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<PlayerWithMemberships[]>([]);
  const [practicePlan, setPracticePlan] = useState<PracticePlanWithBlocks | null>(null);
  const [drillExecutions, setDrillExecutions] = useState<Record<string, DrillExecution>>({});
  const [executionNotes, setExecutionNotes] = useState<Record<string, string>>({});
  const [statEntries, setStatEntries] = useState<StatEntry[]>([]);
  const [gameAwards, setGameAwards] = useState<GameAward[]>([]);

  // Loading & UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMatchResultForm, setShowMatchResultForm] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [rsvpCollapsed, setRsvpCollapsed] = useState(false);

  const isCoach = user?.role === 'head_coach' || user?.role === 'assistant_coach';

  const loadEventData = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const [eventData, attendanceData, rsvpData] = await Promise.all([
        getEvent(id),
        getEventAttendance(id),
        getEventRSVPs(id),
      ]);

      if (eventData) {
        setEvent(eventData);
        setAttendance(attendanceData);
        setRsvps(rsvpData);

        // Load independent data in parallel
        const isGameOrTournament = eventData.type === 'game' || eventData.type === 'tournament';
        const [players, stats, awards, planData] = await Promise.all([
          getPlayersByTeam(eventData.team_id),
          isGameOrTournament ? getStatEntriesForEvent(id) : Promise.resolve([]),
          isGameOrTournament && eventData.is_finalized ? getAwardsForEvent(id) : Promise.resolve([]),
          eventData.practice_plan_id ? getPracticePlan(eventData.practice_plan_id) : Promise.resolve(null),
        ]);

        setTeamPlayers(players);
        setStatEntries(stats);
        setGameAwards(awards);
        setPracticePlan(planData);

        // Load drill executions in parallel (not sequentially)
        if (planData) {
          const drillBlocks = planData.practice_blocks.filter(b => b.drill_id);
          const executionResults = await Promise.all(
            drillBlocks.map(block => getExecutionByEventAndDrill(id, block.drill_id!))
          );
          const executions: Record<string, DrillExecution> = {};
          drillBlocks.forEach((block, i) => {
            if (executionResults[i]) {
              executions[block.drill_id!] = executionResults[i];
            }
          });
          setDrillExecutions(executions);
        }
      }
    } catch (err) {
      console.error('Error loading event data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (eventId) {
      loadEventData(eventId);
    }
  }, [eventId, loadEventData]);

  const handleRSVPChange = async (playerId: string, status: RsvpStatus) => {
    if (!eventId || !user?.id) return;

    try {
      await submitRSVP({
        event_id: eventId,
        player_id: playerId,
        status,
        responded_by: user.id,
      });

      // Reload RSVP data
      const updatedRsvps = await getEventRSVPs(eventId);
      setRsvps(updatedRsvps);
    } catch (err) {
      console.error('Error submitting RSVP:', err);
    }
  };

  const handleBatchAttendanceSave = async (changes: Map<string, AttendanceStatus>) => {
    if (!eventId || !user?.id) return;

    try {
      const entries = Array.from(changes.entries()).map(([playerId, status]) => ({
        event_id: eventId,
        player_id: playerId,
        status,
        recorded_by: user.id,
      }));

      await batchMarkAttendance(entries);

      // Reload attendance data
      const updatedAttendance = await getEventAttendance(eventId);
      setAttendance(updatedAttendance);
    } catch (err) {
      console.error('Error batch marking attendance:', err);
    }
  };

  const handleFinalizeGame = async () => {
    if (!eventId || !user?.id) return;
    setIsFinalizing(true);
    try {
      const awards = await finalizeGame(eventId, user.id);
      setGameAwards(awards);
      await loadEventData(eventId);
    } catch (err) {
      console.error('Error finalizing game:', err);
    } finally {
      setIsFinalizing(false);
      setShowFinalizeConfirm(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventId) return;

    try {
      await deleteEvent(eventId);
      onDelete?.();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const handleEditEvent = async (data: EventFormData) => {
    if (!eventId) return;

    setIsSubmitting(true);
    try {
      await updateEvent(eventId, {
        type: data.type,
        title: data.title,
        start_time: formatDateTimeForDatabase(data.startTime),
        end_time: formatDateTimeForDatabase(data.endTime),
        location: data.location || undefined,
        opponent: data.opponent || undefined,
        opponent_tier: data.opponentTier as 1|2|3|4|5|6|7|8|9 | undefined,
        notes: data.notes || undefined,
      });

      // Reload event data
      await loadEventData(eventId);
      setShowEditDialog(false);
    } catch (err) {
      console.error('Error updating event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveMatchResult = async (data: MatchResultData) => {
    if (!eventId) return;

    setIsSubmitting(true);
    try {
      await updateEvent(eventId, {
        sets_won: data.setsWon,
        sets_lost: data.setsLost,
        set_scores: data.setScores,
      });

      // Reload event data
      await loadEventData(eventId);
      setShowMatchResultForm(false);
    } catch (err) {
      console.error('Error saving match result:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDrillExecuted = async (drillId: string, rating: number) => {
    if (!eventId || !user?.id || !event) return;

    try {
      const existingExecution = drillExecutions[drillId];

      if (existingExecution) {
        // Update existing execution
        const updated = await updateDrillExecution(existingExecution.id, {
          coach_rating: rating as 1 | 2 | 3 | 4 | 5,
          notes: executionNotes[drillId] || existingExecution.notes,
        });
        setDrillExecutions({ ...drillExecutions, [drillId]: updated });
      } else {
        // Create new execution
        const drillBlock = practicePlan?.practice_blocks.find((b) => b.drill_id === drillId);
        const newExecution = await createDrillExecution({
          drill_id: drillId,
          event_id: eventId,
          team_id: event.team_id,
          duration_minutes: drillBlock?.duration_minutes || 15,
          coach_rating: rating as 1 | 2 | 3 | 4 | 5,
          notes: executionNotes[drillId],
          recorded_by: user.id,
        });
        setDrillExecutions({ ...drillExecutions, [drillId]: newExecution });
      }
    } catch (err) {
      console.error('Error marking drill execution:', err);
    }
  };

  const getRSVPStatus = (playerId: string): RsvpStatus => {
    const rsvp = rsvps.find((r) => r.player_id === playerId);
    return rsvp?.status || 'pending';
  };

  const getAttendanceStatus = (playerId: string): AttendanceStatus | undefined => {
    const record = attendance.find((a) => a.player_id === playerId);
    return record?.status;
  };

  return {
    // Data state
    event,
    attendance,
    rsvps,
    teamPlayers,
    practicePlan,
    drillExecutions,
    executionNotes,
    statEntries,
    gameAwards,

    // Loading & UI state
    isLoading,
    isSubmitting,
    isFinalizing,
    showDeleteConfirm,
    showEditDialog,
    showMatchResultForm,
    showFinalizeConfirm,
    rsvpCollapsed,

    // UI state setters
    setShowDeleteConfirm,
    setShowEditDialog,
    setShowMatchResultForm,
    setShowFinalizeConfirm,
    setRsvpCollapsed,
    setExecutionNotes,

    // Handlers
    handleRSVPChange,
    handleBatchAttendanceSave,
    handleFinalizeGame,
    handleDeleteEvent,
    handleEditEvent,
    handleSaveMatchResult,
    handleMarkDrillExecuted,

    // Utilities
    getRSVPStatus,
    getAttendanceStatus,

    // Computed values
    isCoach,
  };
}
