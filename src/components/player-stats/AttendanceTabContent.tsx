import { useEffect, useState } from 'react';
import { AttendanceStatsRow } from './AttendanceStatsRow';
import { AttendanceCalendar } from './AttendanceCalendar';
import { getAttendanceStats, getEventTypeBreakdown } from '@/services/player-stats.service';
import { getAttendanceWithEvents, type AttendanceRecordWithEvent } from '@/services/attendance.service';
import type { AttendanceStats, EventTypeBreakdown as EventBreakdownType } from '@/services/player-stats.service';

interface AttendanceTabContentProps {
  playerId: string;
  teamId?: string;
}

interface MissedEventDisplay {
  date: string;
  title: string;
  type: string;
  reason?: string;
}

/**
 * Container component for Attendance tab
 * Composes: AttendanceStatsRow, AttendanceStreakCard, EventTypeBreakdown, AttendanceCalendar, MissedEventsTimeline
 */
export function AttendanceTabContent({ playerId, teamId }: AttendanceTabContentProps) {
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [eventBreakdown, setEventBreakdown] = useState<EventBreakdownType | null>(null);
  const [missedEventDetails, setMissedEventDetails] = useState<MissedEventDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [stats, breakdown, detailedRecords] = await Promise.all([
          getAttendanceStats(playerId, teamId),
          getEventTypeBreakdown(playerId, teamId),
          getAttendanceWithEvents(playerId, teamId),
        ]);

        if (!cancelled) {
          setAttendanceStats(stats);
          setEventBreakdown(breakdown);

          // Extract missed event details for display
          const missed = detailedRecords
            .filter((r: AttendanceRecordWithEvent) => r.status === 'absent')
            .slice(0, 5) // Show last 5 missed events
            .map((r: AttendanceRecordWithEvent) => ({
              date: r.event.start_time,
              title: r.event.title,
              type: r.event.type,
              reason: r.notes || undefined,
            }));
          setMissedEventDetails(missed);
        }
      } catch (error) {
        console.error('Error loading attendance data:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [playerId, teamId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading attendance data...</p>
      </div>
    );
  }

  if (!attendanceStats || attendanceStats.totalEvents === 0) {
    return (
      <div className="bg-navy-90 border border-white/[0.06] rounded-lg p-12 text-center">
        <div className="w-16 h-16 rounded-lg bg-navy-80 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl opacity-50">&#128197;</span>
        </div>
        <h3 className="font-display font-bold text-lg uppercase text-white mb-2">
          No Attendance Records
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Attendance will be tracked once the player participates in team events.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row - 4 cards */}
      <AttendanceStatsRow stats={attendanceStats} />

      {/* Streak Card */}
      <div className="bg-gradient-to-br from-green-500/10 to-green-500/[0.02] border border-green-500/20 rounded-lg p-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-lg bg-green-500/15 flex items-center justify-center">
            <span className="text-3xl">&#128293;</span>
          </div>
          <div className="flex-1">
            <p className="font-display font-extrabold text-3xl text-green-400 leading-none">
              {attendanceStats.currentStreak} Events
            </p>
            <p className="font-display font-semibold text-xs uppercase tracking-wider text-gray-500 mt-1">
              Current Attendance Streak
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Best Streak</p>
            <p className="font-mono font-bold text-xl text-white">
              {attendanceStats.longestStreak}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column: Event Breakdown + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Type Breakdown - Bar style */}
        <div className="bg-navy-90 border border-white/[0.06] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
              By Event Type
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {eventBreakdown && (
              <>
                <EventTypeBar
                  label="Practices"
                  count={eventBreakdown.practice}
                  total={attendanceStats.attended}
                  color="bg-vq-teal"
                  textColor="text-vq-teal"
                />
                <EventTypeBar
                  label="Matches"
                  count={eventBreakdown.game}
                  total={attendanceStats.attended}
                  color="bg-club-primary"
                  textColor="text-club-primary"
                />
                <EventTypeBar
                  label="Tournaments"
                  count={eventBreakdown.tournament}
                  total={attendanceStats.attended}
                  color="bg-club-secondary"
                  textColor="text-club-secondary"
                />
              </>
            )}
          </div>
        </div>

        {/* Calendar */}
        <AttendanceCalendar playerId={playerId} teamId={teamId} />
      </div>

      {/* Missed Events */}
      {missedEventDetails.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gray-500 mb-4">
            Missed Events
          </h3>
          <div className="space-y-2">
            {missedEventDetails.map((event, index) => (
              <MissedEventRow key={index} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for event type bar
interface EventTypeBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
  textColor: string;
}

function EventTypeBar({ label, count, total, color, textColor }: EventTypeBarProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4">
      <span className="w-24 font-display font-semibold text-xs uppercase tracking-wide text-white">
        {label}
      </span>
      <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`w-12 text-right font-mono font-semibold text-sm ${textColor}`}>
        {percentage}%
      </span>
    </div>
  );
}

// Helper component for missed event row
interface MissedEventRowProps {
  event: MissedEventDisplay;
}

function MissedEventRow({ event }: MissedEventRowProps) {
  const date = new Date(event.date);
  const day = date.getDate();
  const month = date.toLocaleString('en', { month: 'short' });

  return (
    <div className="flex items-center gap-4 p-4 bg-navy-80 rounded-md border-l-4 border-red-500">
      <div className="text-center min-w-[50px]">
        <p className="font-display font-extrabold text-xl leading-none text-white">{day}</p>
        <p className="font-display font-semibold text-[10px] uppercase tracking-wider text-gray-500">
          {month}
        </p>
      </div>
      <div className="flex-1">
        <p className="font-display font-bold text-sm uppercase text-white">{event.title}</p>
        <p className="text-xs text-gray-500">{event.type}</p>
      </div>
      {event.reason && (
        <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-full">
          {event.reason}
        </span>
      )}
    </div>
  );
}
