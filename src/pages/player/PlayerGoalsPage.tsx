import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/store';
import { usePlayerContext } from '@/hooks/usePlayerContext';
import { usePlayerFeedback } from '@/hooks/usePlayerFeedback';
import { useSelfAssessments } from '@/hooks/useSelfAssessments';
import { getPlayerGoals, createPlayerGoal, toggleGoalCompletion, deletePlayerGoal } from '@/services/player-goals.service';
import { getAttendanceStats } from '@/services/player-stats.service';
import { getUpcomingEvents } from '@/services/events.service';
import type { PlayerGoalFormData } from '@/lib/validations/playerGoal';
import { StreaksMilestones } from '@/components/player/StreaksMilestones';
import { GoalTracker } from '@/components/player-stats/GoalTracker';
import { FeedbackSpotlight } from '@/components/player/FeedbackSpotlight';
import { SelfAssessmentForm } from '@/components/player/SelfAssessmentForm';
import type { PlayerGoal, Event } from '@/types/database.types';
import type { AttendanceStats } from '@/services/player-stats.service';

export function PlayerGoalsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { player, teamIds, isLoading: playerLoading } = usePlayerContext();
  const { feedback } = usePlayerFeedback(player?.id);
  const { assessments, submitAssessment } = useSelfAssessments(player?.id);

  const [goals, setGoals] = useState<PlayerGoal[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!player || teamIds.length === 0) {
      setIsLoading(false);
      return;
    }
    loadGoalsData();
  }, [player?.id, teamIds.join(',')]);

  const loadGoalsData = async () => {
    if (!player) return;
    setIsLoading(true);
    try {
      const [goalsData, attStats, eventsResults] = await Promise.all([
        getPlayerGoals(player.id, teamIds[0]).catch(() => [] as PlayerGoal[]),
        getAttendanceStats(player.id).catch(() => null),
        Promise.all(teamIds.map((teamId) => getUpcomingEvents(teamId))),
      ]);
      setGoals(goalsData);
      setAttendanceStats(attStats);

      // Get recent past events for self-assessment
      const now = new Date();
      const allEvents = eventsResults.flat();
      setRecentEvents(
        allEvents.filter((e) => new Date(e.start_time) < now).slice(0, 10)
      );
    } catch (error) {
      console.error('Error loading goals data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (playerLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.messages.loading')}</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-12 text-white/50">
        <p>{t('dashboard.player.noPlayerProfile')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <StreaksMilestones
        goals={goals}
        feedback={feedback}
        assessments={assessments}
        attendanceStats={attendanceStats}
      />

      <GoalTracker
        goals={goals}
        onCreateGoal={async (data: PlayerGoalFormData) => {
          await createPlayerGoal({ ...data, player_id: player.id, team_id: teamIds[0], created_by: user?.id || '' });
          await loadGoalsData();
        }}
        onToggleComplete={async (goalId: string, isCompleted: boolean) => {
          await toggleGoalCompletion(goalId, isCompleted);
          await loadGoalsData();
        }}
        onDeleteGoal={async (goalId: string) => {
          await deletePlayerGoal(goalId);
          await loadGoalsData();
        }}
      />

      <FeedbackSpotlight feedback={feedback} />

      <SelfAssessmentForm
        events={recentEvents}
        playerId={player.id}
        existingAssessments={assessments}
        onSubmit={submitAssessment}
      />
    </div>
  );
}
