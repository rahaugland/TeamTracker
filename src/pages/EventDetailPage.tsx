import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Edit2, Trash2, BarChart3, Users } from 'lucide-react';
import { useEventDetail } from '@/hooks/useEventDetail';
import { getRSVPSummary } from '@/utils/event-helpers';
import { formatDateTimeForInput } from '@/lib/date-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PlayerAvatar } from '@/components/player';
import { RSVPStatusBadge } from '@/components/common';
import { DragDropAttendance } from '@/components/attendance/DragDropAttendance';
import { EventForm } from '@/components/forms/EventForm';
import { MatchAwards } from '@/components/game-awards/MatchAwards';
import { FinalizedParticipantsCard } from '@/components/event-detail/FinalizedParticipantsCard';
import { MatchResultSection } from '@/components/event-detail/MatchResultSection';
import { EventStatsSummary } from '@/components/event-detail/EventStatsSummary';
import { EventPracticePlanCard } from '@/components/event-detail/EventPracticePlanCard';
import { EventPlayerFeedback } from '@/components/event-detail/EventPlayerFeedback';
import type { EventFormData } from '@/lib/validations/event';
import type { RsvpStatus } from '@/types/database.types';

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

  // Helper to get event type label
  const getEventTypeLabel = () => {
    switch (event.type) {
      case 'practice':
        return 'Practice';
      case 'game':
        return 'Game';
      case 'tournament':
        return 'Tournament';
      default:
        return event.type;
    }
  };

  // Helper to get event type color
  const getEventTypeBadgeClass = () => {
    switch (event.type) {
      case 'practice':
        return 'bg-teal-500/15 text-teal-500';
      case 'game':
      case 'tournament':
        return 'bg-red-500/15 text-red-500';
      default:
        return 'bg-gray-500/15 text-gray-500';
    }
  };

  // Helper to format date/time display
  const formatEventDateTime = () => {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    const dateStr = format(startDate, 'EEEE, MMMM d, yyyy');
    const timeStr = `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`;
    return { dateStr, timeStr };
  };

  const { dateStr, timeStr } = formatEventDateTime();

  // Map RSVP status for badge component
  const mapRSVPStatus = (status: RsvpStatus): 'coming' | 'not-coming' | 'pending' => {
    if (status === 'attending') return 'coming';
    if (status === 'not_attending') return 'not-coming';
    return 'pending';
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Event Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 p-6 md:p-8 mb-6 md:mb-8">
        {/* Decorative blur element */}
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full bg-white/10 blur-[60px]" />

        <div className="relative z-10">
          <span className={`inline-block font-display font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded mb-4 ${getEventTypeBadgeClass()}`}>
            {getEventTypeLabel()}
          </span>

          <h1 className="font-display font-extrabold text-2xl md:text-4xl uppercase tracking-wide mb-4 text-white">
            {event.opponent ? `vs ${event.opponent}` : event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-white/90 mb-6">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="break-words">{dateStr}</span>
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              {timeStr}
            </span>
            {event.location && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="break-words">{event.location}</span>
              </span>
            )}
          </div>

          {isCoach && (
            <div className="flex flex-wrap gap-2 md:gap-3">
              {event.type === 'practice' && practicePlan && (
                <Button
                  variant="secondary"
                  className="bg-white text-gray-900 hover:bg-white/90 text-sm md:text-base"
                  onClick={() => navigate(`/practice-plans/${practicePlan.id}`)}
                >
                  View Practice Plan
                </Button>
              )}
              {(event.type === 'game' || event.type === 'tournament') && !event.is_finalized && (
                <Button
                  variant="secondary"
                  className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-sm md:text-base"
                  onClick={() => navigate(`/events/${id}/lineup`)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Select Roster
                </Button>
              )}
              {(event.type === 'game' || event.type === 'tournament') && !event.is_finalized && (
                <Button
                  variant="secondary"
                  className="bg-vq-teal text-white hover:bg-vq-teal/90 text-sm md:text-base font-display font-bold"
                  onClick={() => navigate(`/events/${id}/stats`)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Log Stats
                </Button>
              )}
              {(event.type === 'game' || event.type === 'tournament') && !event.is_finalized && statEntries.length > 0 && (
                <Button
                  variant="secondary"
                  className="bg-green-600 text-white hover:bg-green-700 text-sm md:text-base"
                  onClick={() => setShowFinalizeConfirm(true)}
                >
                  Finalize Game
                </Button>
              )}
              <Button
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-sm md:text-base"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                <span className="hidden sm:inline">Edit Event</span>
                <span className="sm:hidden">Edit</span>
              </Button>
              {!event.is_finalized && (
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10 text-sm md:text-base"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  <span className="hidden sm:inline">Delete</span>
                  <span className="sm:hidden">Del</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left Column: RSVP Status */}
        <div>
          <h3 className="font-display font-bold text-sm uppercase tracking-wide mb-4">
            RSVP Status
          </h3>

          {/* RSVP Summary Grid */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
            <div className="bg-navy-80 rounded-md p-4 md:p-6 text-center">
              <p className="font-mono font-bold text-2xl md:text-4xl text-green-500 mb-1 md:mb-2">
                {rsvpSummary.attending}
              </p>
              <p className="font-display font-semibold text-[10px] md:text-[11px] uppercase tracking-wider text-gray-400">
                Coming
              </p>
            </div>
            <div className="bg-navy-80 rounded-md p-4 md:p-6 text-center">
              <p className="font-mono font-bold text-2xl md:text-4xl text-red-500 mb-1 md:mb-2">
                {rsvpSummary.not_attending}
              </p>
              <p className="font-display font-semibold text-[10px] md:text-[11px] uppercase tracking-wider text-gray-400">
                Not Coming
              </p>
            </div>
            <div className="bg-navy-80 rounded-md p-4 md:p-6 text-center">
              <p className="font-mono font-bold text-2xl md:text-4xl text-yellow-500 mb-1 md:mb-2">
                {rsvpSummary.pending}
              </p>
              <p className="font-display font-semibold text-[10px] md:text-[11px] uppercase tracking-wider text-gray-400">
                Pending
              </p>
            </div>
          </div>

          {/* Player Responses Card */}
          <Card className="bg-navy-90 border-white/5">
            <div className="p-4 border-b border-white/5">
              <h4 className="font-display font-bold text-sm uppercase tracking-wide">
                Player Responses
              </h4>
            </div>
            <div className="p-4">
              {teamPlayers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No players in the team yet
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                  {teamPlayers.map((player) => {
                    const rsvpStatus = getRSVPStatus(player.id);
                    const mappedStatus = mapRSVPStatus(rsvpStatus);
                    const initials = player.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 p-3 bg-navy-80 rounded"
                      >
                        <PlayerAvatar
                          initials={initials}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {player.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {player.positions?.[0] || 'No position'}
                          </p>
                        </div>
                        <RSVPStatusBadge status={mappedStatus} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Event Details / Practice Plan */}
        <div>
          {event.type === 'practice' && practicePlan ? (
            <>
              <h3 className="font-display font-bold text-sm uppercase tracking-wide mb-4">
                Practice Plan
              </h3>

              <div
                className="flex items-center gap-4 p-6 bg-teal-500/8 border border-teal-500/20 rounded-md cursor-pointer hover:bg-teal-500/12 transition-colors"
                onClick={() => navigate(`/practice-plans/${practicePlan.id}`)}
              >
                <div className="text-3xl">📋</div>
                <div className="flex-1">
                  <p className="font-display font-bold text-base mb-1">
                    {practicePlan.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {practicePlan.practice_blocks?.length || 0} blocks • {practicePlan.practice_blocks?.reduce((acc: number, block: { duration_minutes: number }) => acc + block.duration_minutes, 0) || 0} minutes total
                  </p>
                </div>
                <span className="text-teal-500 text-xl">→</span>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-display font-bold text-sm uppercase tracking-wide mb-4">
                Event Details
              </h3>

              <Card className="bg-navy-90 border-white/5">
                <div className="p-6 space-y-4">
                  {event.notes && (
                    <div>
                      <p className="font-display font-semibold text-xs uppercase tracking-wide text-gray-400 mb-2">
                        Notes
                      </p>
                      <p className="text-sm text-gray-300">{event.notes}</p>
                    </div>
                  )}
                  {event.opponent && (
                    <div>
                      <p className="font-display font-semibold text-xs uppercase tracking-wide text-gray-400 mb-2">
                        Opponent
                      </p>
                      <p className="text-sm text-gray-300">{event.opponent}</p>
                    </div>
                  )}
                  {event.opponent_tier && (
                    <div>
                      <p className="font-display font-semibold text-xs uppercase tracking-wide text-gray-400 mb-2">
                        Tier
                      </p>
                      <p className="text-sm text-gray-300">Tier {event.opponent_tier}</p>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* When finalized: show participants list */}
      {event.is_finalized && (
        <FinalizedParticipantsCard
          attendance={attendance}
          teamPlayers={teamPlayers}
        />
      )}

      {/* Attendance Section (coaches only, not finalized) */}
      {isCoach && !event.is_finalized && (
        <DragDropAttendance
          eventId={id!}
          eventType={event.type}
          teamPlayers={teamPlayers}
          initialAttendance={attendance}
          onSave={handleBatchAttendanceSave}
          isCoach={isCoach}
        />
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
