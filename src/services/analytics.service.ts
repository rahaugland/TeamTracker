import { supabase } from '@/lib/supabase';
import type { AttendanceStatus, EventType } from '@/types/database.types';

/**
 * Analytics service
 * Computes statistics and metrics for dashboard widgets
 */

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface PlayerAttendanceRate {
  playerId: string;
  playerName: string;
  photoUrl?: string;
  totalEvents: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number; // percentage (0-100)
}

export interface TeamAttendanceRate {
  teamId: string;
  teamName: string;
  totalEvents: number;
  averageAttendanceRate: number; // percentage (0-100)
  trend: 'up' | 'down' | 'stable';
}

export interface DrillUsage {
  drillId: string;
  drillName: string;
  executionCount: number;
  averageRating?: number;
  lastExecuted?: string;
}

export interface PracticeFrequency {
  totalPractices: number;
  practicesPerWeek: number;
  practicesPerMonth: number;
}

export interface RecentActivity {
  id: string;
  type: 'player_added' | 'event_created' | 'team_created';
  title: string;
  description: string;
  timestamp: string;
}

export interface EventWithRSVPs {
  id: string;
  type: EventType;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  rsvpCounts: {
    attending: number;
    not_attending: number;
    maybe: number;
    pending: number;
  };
  totalRSVPs: number;
}

/**
 * Get attendance rate per player over a date range
 */
export async function getPlayerAttendanceRates(
  teamId: string,
  dateRange?: DateRange
): Promise<PlayerAttendanceRate[]> {
  try {
    // Get all active team members
    const { data: memberships, error: memberError } = await supabase
      .from('team_memberships')
      .select(`
        player_id,
        player:players(
          id,
          name,
          photo_url
        )
      `)
      .eq('team_id', teamId)
      .eq('is_active', true);

    if (memberError) throw memberError;

    // Get events in the date range
    let eventsQuery = supabase
      .from('events')
      .select('id, start_time')
      .eq('team_id', teamId)
      .order('start_time', { ascending: false });

    if (dateRange) {
      eventsQuery = eventsQuery
        .gte('start_time', dateRange.startDate)
        .lte('start_time', dateRange.endDate);
    }

    const { data: events, error: eventsError } = await eventsQuery;
    if (eventsError) throw eventsError;

    if (!events || events.length === 0) {
      return [];
    }

    const eventIds = events.map((e) => e.id);

    // Get all attendance records for these events
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('player_id, status')
      .in('event_id', eventIds);

    if (attendanceError) throw attendanceError;

    // Calculate rates for each player
    const playerRates: PlayerAttendanceRate[] = (memberships || []).map((membership: any) => {
      const playerId = membership.player_id;
      const playerRecords = (attendanceRecords || []).filter(
        (r) => r.player_id === playerId
      );

      const presentCount = playerRecords.filter((r) => r.status === 'present').length;
      const lateCount = playerRecords.filter((r) => r.status === 'late').length;
      const absentCount = playerRecords.filter((r) => r.status === 'absent').length;
      const excusedCount = playerRecords.filter((r) => r.status === 'excused').length;
      const totalEvents = playerRecords.length;

      // Attendance rate: (present + late) / total events
      const attendanceRate =
        totalEvents > 0 ? ((presentCount + lateCount) / totalEvents) * 100 : 0;

      return {
        playerId,
        playerName: membership.player?.name || 'Unknown',
        photoUrl: membership.player?.photo_url,
        totalEvents,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        attendanceRate: Math.round(attendanceRate * 10) / 10, // Round to 1 decimal
      };
    });

    return playerRates.sort((a, b) => b.attendanceRate - a.attendanceRate);
  } catch (error) {
    console.error('Error calculating player attendance rates:', error);
    throw error;
  }
}

/**
 * Get team attendance rate with trend
 */
export async function getTeamAttendanceRate(
  teamId: string,
  dateRange?: DateRange
): Promise<TeamAttendanceRate | null> {
  try {
    // Get team info
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    // Get player attendance rates
    const playerRates = await getPlayerAttendanceRates(teamId, dateRange);

    if (playerRates.length === 0) {
      return {
        teamId,
        teamName: team.name,
        totalEvents: 0,
        averageAttendanceRate: 0,
        trend: 'stable',
      };
    }

    // Calculate average attendance rate
    const averageAttendanceRate =
      playerRates.reduce((sum, p) => sum + p.attendanceRate, 0) / playerRates.length;

    // Calculate trend by comparing with previous period
    let trend: 'up' | 'down' | 'stable' = 'stable';

    if (dateRange) {
      const rangeDuration =
        new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime();
      const previousRange = {
        startDate: new Date(
          new Date(dateRange.startDate).getTime() - rangeDuration
        ).toISOString(),
        endDate: dateRange.startDate,
      };

      const previousRates = await getPlayerAttendanceRates(teamId, previousRange);
      if (previousRates.length > 0) {
        const previousAverage =
          previousRates.reduce((sum, p) => sum + p.attendanceRate, 0) /
          previousRates.length;

        if (averageAttendanceRate > previousAverage + 2) {
          trend = 'up';
        } else if (averageAttendanceRate < previousAverage - 2) {
          trend = 'down';
        }
      }
    }

    const totalEvents = Math.max(...playerRates.map((p) => p.totalEvents));

    return {
      teamId,
      teamName: team.name,
      totalEvents,
      averageAttendanceRate: Math.round(averageAttendanceRate * 10) / 10,
      trend,
    };
  } catch (error) {
    console.error('Error calculating team attendance rate:', error);
    throw error;
  }
}

/**
 * Get practice frequency stats
 */
export async function getPracticeFrequency(
  teamId: string,
  dateRange?: DateRange
): Promise<PracticeFrequency> {
  try {
    let query = supabase
      .from('events')
      .select('id, start_time')
      .eq('team_id', teamId)
      .eq('type', 'practice');

    if (dateRange) {
      query = query
        .gte('start_time', dateRange.startDate)
        .lte('start_time', dateRange.endDate);
    }

    const { data: practices, error } = await query;
    if (error) throw error;

    const totalPractices = practices?.length || 0;

    if (!dateRange || totalPractices === 0) {
      return {
        totalPractices,
        practicesPerWeek: 0,
        practicesPerMonth: 0,
      };
    }

    // Calculate duration in days
    const durationMs =
      new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime();
    const durationDays = durationMs / (1000 * 60 * 60 * 24);
    const durationWeeks = durationDays / 7;
    const durationMonths = durationDays / 30;

    return {
      totalPractices,
      practicesPerWeek: Math.round((totalPractices / durationWeeks) * 10) / 10,
      practicesPerMonth: Math.round((totalPractices / durationMonths) * 10) / 10,
    };
  } catch (error) {
    console.error('Error calculating practice frequency:', error);
    throw error;
  }
}

/**
 * Get most used drills
 */
export async function getTopDrills(
  teamId: string,
  limit: number = 5,
  dateRange?: DateRange
): Promise<DrillUsage[]> {
  try {
    let query = supabase
      .from('drill_executions')
      .select(`
        drill_id,
        coach_rating,
        executed_at,
        drill:drills(
          id,
          name
        )
      `)
      .eq('team_id', teamId);

    if (dateRange) {
      query = query
        .gte('executed_at', dateRange.startDate)
        .lte('executed_at', dateRange.endDate);
    }

    const { data: executions, error } = await query;
    if (error) throw error;

    if (!executions || executions.length === 0) {
      return [];
    }

    // Group by drill and calculate stats
    const drillMap = new Map<string, DrillUsage>();

    executions.forEach((exec: any) => {
      const drillId = exec.drill_id;
      const drillName = exec.drill?.name || 'Unknown Drill';

      if (!drillMap.has(drillId)) {
        drillMap.set(drillId, {
          drillId,
          drillName,
          executionCount: 0,
          averageRating: undefined,
          lastExecuted: exec.executed_at,
        });
      }

      const drill = drillMap.get(drillId)!;
      drill.executionCount++;

      // Track latest execution
      if (!drill.lastExecuted || new Date(exec.executed_at) > new Date(drill.lastExecuted)) {
        drill.lastExecuted = exec.executed_at;
      }

      // Calculate average rating
      if (exec.coach_rating) {
        const currentSum = (drill.averageRating || 0) * (drill.executionCount - 1);
        drill.averageRating = (currentSum + exec.coach_rating) / drill.executionCount;
      }
    });

    // Convert to array and sort by execution count
    const drillUsages = Array.from(drillMap.values())
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, limit);

    // Round average ratings
    drillUsages.forEach((drill) => {
      if (drill.averageRating !== undefined) {
        drill.averageRating = Math.round(drill.averageRating * 10) / 10;
      }
    });

    return drillUsages;
  } catch (error) {
    console.error('Error getting top drills:', error);
    throw error;
  }
}

/**
 * Get upcoming events with RSVP counts
 */
export async function getUpcomingEventsWithRSVPs(
  teamId: string,
  limit: number = 5
): Promise<EventWithRSVPs[]> {
  try {
    const now = new Date().toISOString();

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        type,
        title,
        start_time,
        end_time,
        location
      `)
      .eq('team_id', teamId)
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(limit);

    if (eventsError) throw eventsError;

    if (!events || events.length === 0) {
      return [];
    }

    // Get RSVP counts for each event
    const eventsWithRSVPs = await Promise.all(
      events.map(async (event) => {
        const { data: rsvps, error: rsvpError } = await supabase
          .from('rsvps')
          .select('status')
          .eq('event_id', event.id);

        if (rsvpError) {
          console.error('Error fetching RSVPs:', rsvpError);
          return { ...event, rsvpCounts: { attending: 0, not_attending: 0, maybe: 0, pending: 0 } };
        }

        const rsvpCounts = {
          attending: rsvps?.filter((r) => r.status === 'attending').length || 0,
          not_attending: rsvps?.filter((r) => r.status === 'not_attending').length || 0,
          maybe: rsvps?.filter((r) => r.status === 'maybe').length || 0,
          pending: rsvps?.filter((r) => r.status === 'pending').length || 0,
        };

        return {
          ...event,
          rsvpCounts,
          totalRSVPs: rsvps?.length || 0,
        };
      })
    );

    return eventsWithRSVPs;
  } catch (error) {
    console.error('Error getting upcoming events with RSVPs:', error);
    throw error;
  }
}

/**
 * Get recent activity
 */
export async function getRecentActivity(
  teamId: string,
  limit: number = 5
): Promise<RecentActivity[]> {
  try {
    const activities: RecentActivity[] = [];

    // Get recent players added to the team
    const { data: recentPlayers, error: playersError } = await supabase
      .from('team_memberships')
      .select(`
        id,
        joined_at,
        player:players(
          name
        )
      `)
      .eq('team_id', teamId)
      .order('joined_at', { ascending: false })
      .limit(3);

    if (!playersError && recentPlayers) {
      recentPlayers.forEach((membership: any) => {
        activities.push({
          id: membership.id,
          type: 'player_added',
          title: 'New Player',
          description: `${membership.player?.name || 'Unknown'} joined the team`,
          timestamp: membership.joined_at,
        });
      });
    }

    // Get recent events created
    const { data: recentEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, type, title, created_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!eventsError && recentEvents) {
      recentEvents.forEach((event) => {
        activities.push({
          id: event.id,
          type: 'event_created',
          title: `New ${event.type}`,
          description: event.title,
          timestamp: event.created_at,
        });
      });
    }

    // Sort all activities by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent activity:', error);
    throw error;
  }
}

/**
 * Helper: Get date range for common periods
 */
export function getDateRangePreset(preset: 'week' | 'month' | 'season'): DateRange {
  const now = new Date();
  const endDate = now.toISOString();

  let startDate: string;

  switch (preset) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'season':
      // Default to 6 months for season
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
      break;
  }

  return { startDate, endDate };
}
