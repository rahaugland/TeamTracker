import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEventDetail } from '@/hooks/useEventDetail';
import { getRSVPSummary } from '@/utils/event-helpers';
import { formatDateTimeForInput } from '@/lib/date-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DragDropAttendance } from '@/components/attendance/DragDropAttendance';
import { EventForm } from '@/components/forms/EventForm';
import { MatchAwards } from '@/components/game-awards/MatchAwards';
import { EventHeaderActions } from '@/components/event-detail/EventHeaderActions';
import { EventInfoCard } from '@/components/event-detail/EventInfoCard';
import { EventRSVPSection } from '@/components/event-detail/EventRSVPSection';
import { FinalizedParticipantsCard } from '@/components/event-detail/FinalizedParticipantsCard';
import { MatchResultSection } from '@/components/event-detail/MatchResultSection';
import { EventStatsSummary } from '@/components/event-detail/EventStatsSummary';
import { EventPracticePlanCard } from '@/components/event-detail/EventPracticePlanCard';
import { EventPlayerFeedback } from '@/components/event-detail/EventPlayerFeedback';
import type { EventFormData } from '@/lib/validations/event';

/**
 * EventDetailPage component
 * Shows event details and attendance tracking
 */
export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
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

    // Computed values
    isCoach,
  } = useEventDetail(id, () => navigate('/schedule'));

  const getEventFormDefaults = (): Partial<EventFormData> => {
    if (!event) return {};

    return {
      title: event.title,
      type: event.type,
      startTime: formatDateTimeForInput(event.start_time),
      endTime: formatDateTimeForInput(event.end_time),
      location: event.location || '',
      opponent: event.opponent || '',
      opponentTier: event.opponent_tier ?? undefined,
      notes: event.notes || '',
    };
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

  const rsvpSummary = getRSVPSummary(rsvps, teamPlayers);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <EventHeaderActions
        eventId={id!}
        eventTitle={event.title}
        eventType={event.type}
        opponent={event.opponent}
        isFinalized={event.is_finalized}
        isCoach={isCoach}
        hasStats={statEntries.length > 0}
        onEdit={() => setShowEditDialog(true)}
        onDelete={() => setShowDeleteConfirm(true)}
        onFinalize={() => setShowFinalizeConfirm(true)}
      />

      <EventInfoCard
        startTime={event.start_time}
        endTime={event.end_time}
        location={event.location}
        eventType={event.type}
        opponentTier={event.opponent_tier}
        notes={event.notes}
      />

      {/* When finalized: show participants list instead of RSVP/attendance */}
      {event.is_finalized ? (
        <FinalizedParticipantsCard
          attendance={attendance}
          teamPlayers={teamPlayers}
        />
      ) : (
        <>
          {/* RSVP Section (collapsible) */}
          <EventRSVPSection
            teamPlayers={teamPlayers}
            rsvpSummary={rsvpSummary}
            isCoach={isCoach}
            collapsed={rsvpCollapsed}
            onToggleCollapse={() => setRsvpCollapsed(!rsvpCollapsed)}
            getRSVPStatus={getRSVPStatus}
            onRSVPChange={handleRSVPChange}
          />

          {/* Attendance Section (coaches only) */}
          {isCoach && (
            <DragDropAttendance
              eventId={id!}
              eventType={event.type}
              teamPlayers={teamPlayers}
              initialAttendance={attendance}
              onSave={handleBatchAttendanceSave}
              isCoach={isCoach}
            />
          )}
        </>
      )}

      {/* Player Feedback (coaches only) */}
      {isCoach && (
        <EventPlayerFeedback
          eventId={id!}
          teamPlayers={teamPlayers}
          isCoach={isCoach}
        />
      )}

      {/* Match Result Section (for games and tournaments) */}
      {(event.type === 'game' || event.type === 'tournament') && (
        <MatchResultSection
          setsWon={event.sets_won}
          setsLost={event.sets_lost}
          setScores={event.set_scores}
          isFinalized={event.is_finalized}
          isCoach={isCoach}
          isSubmitting={isSubmitting}
          showForm={showMatchResultForm}
          onToggleForm={() => setShowMatchResultForm(!showMatchResultForm)}
          onSave={handleSaveMatchResult}
        />
      )}

      {/* Stats Summary (for games and tournaments with recorded stats) */}
      {(event.type === 'game' || event.type === 'tournament') && (
        <EventStatsSummary statEntries={statEntries} />
      )}

      {/* Match Awards (shown when finalized) */}
      {event.is_finalized && gameAwards.length > 0 && (
        <MatchAwards
          awards={gameAwards}
          playerNames={Object.fromEntries(teamPlayers.map((p) => [p.id, p.name]))}
        />
      )}

      {/* Practice Plan Section */}
      {event.type === 'practice' && practicePlan && (
        <EventPracticePlanCard
          practicePlan={practicePlan}
          drillExecutions={drillExecutions}
          executionNotes={executionNotes}
          isCoach={isCoach}
          onMarkExecuted={handleMarkDrillExecuted}
          onNotesChange={(drillId, notes) =>
            setExecutionNotes({ ...executionNotes, [drillId]: notes })
          }
        />
      )}

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('event.editEvent')}</DialogTitle>
          </DialogHeader>
          <EventForm
            defaultValues={getEventFormDefaults()}
            onSubmit={handleEditEvent}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('event.deleteEvent')}
        description={t('event.deleteConfirm')}
        onConfirm={handleDeleteEvent}
        variant="destructive"
      />

      <ConfirmDialog
        open={showFinalizeConfirm}
        onOpenChange={setShowFinalizeConfirm}
        title={t('awards.finalizeGame')}
        description={t('awards.finalizeGameConfirm')}
        onConfirm={handleFinalizeGame}
        loading={isFinalizing}
      />
    </div>
  );
}
