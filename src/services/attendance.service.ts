import { supabase } from '@/lib/supabase';
import type { AttendanceRecord, AttendanceStatus } from '@/types/database.types';

/**
 * Attendance service
 * Handles all Supabase operations for attendance tracking
 */

export interface CreateAttendanceInput {
  event_id: string;
  player_id: string;
  status: AttendanceStatus;
  arrived_at?: string;
  left_at?: string;
  notes?: string;
  recorded_by: string;
}

export interface UpdateAttendanceInput {
  status?: AttendanceStatus;
  arrived_at?: string;
  left_at?: string;
  notes?: string;
}

export interface AttendanceRecordWithPlayer extends AttendanceRecord {
  player: {
    id: string;
    name: string;
    photo_url?: string;
  };
}

export interface AttendanceRecordWithEvent extends AttendanceRecord {
  event: {
    id: string;
    title: string;
    type: string;
    start_time: string;
    end_time?: string;
    location?: string;
    team_id?: string;
  };
}

/**
 * Get all attendance records for an event
 */
export async function getEventAttendance(
  eventId: string
): Promise<AttendanceRecordWithPlayer[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      *,
      player:players(
        id,
        name,
        photo_url
      )
    `)
    .eq('event_id', eventId)
    .order('created_at');

  if (error) {
    console.error('Error fetching event attendance:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get attendance records for a specific player
 */
export async function getPlayerAttendance(
  playerId: string
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching player attendance:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get attendance record for a specific player at a specific event
 */
export async function getAttendanceRecord(
  eventId: string,
  playerId: string
): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('event_id', eventId)
    .eq('player_id', playerId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching attendance record:', error);
    throw error;
  }

  return data || null;
}

/**
 * Mark attendance (create or update)
 */
export async function markAttendance(
  input: CreateAttendanceInput
): Promise<AttendanceRecord> {
  // Check if record already exists
  const existing = await getAttendanceRecord(input.event_id, input.player_id);

  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('attendance_records')
      .update({
        status: input.status,
        arrived_at: input.arrived_at,
        left_at: input.left_at,
        notes: input.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }

    return data;
  } else {
    // Create new record
    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        event_id: input.event_id,
        player_id: input.player_id,
        status: input.status,
        arrived_at: input.arrived_at,
        left_at: input.left_at,
        notes: input.notes,
        recorded_by: input.recorded_by,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating attendance:', error);
      throw error;
    }

    return data;
  }
}

/**
 * Delete an attendance record
 */
export async function deleteAttendance(id: string): Promise<void> {
  const { error } = await supabase
    .from('attendance_records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting attendance:', error);
    throw error;
  }
}

/**
 * Get attendance summary for an event
 */
export async function getEventAttendanceSummary(eventId: string): Promise<{
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  not_selected: number;
}> {
  const records = await getEventAttendance(eventId);

  const counts = { present: 0, absent: 0, late: 0, excused: 0, not_selected: 0 };
  for (const r of records) {
    if (r.status in counts) counts[r.status as keyof typeof counts]++;
  }

  return {
    total: records.length,
    ...counts,
  };
}

/**
 * Batch mark attendance for multiple players
 * This is more efficient than calling markAttendance multiple times
 */
export async function batchMarkAttendance(
  entries: Array<{
    event_id: string;
    player_id: string;
    status: AttendanceStatus;
    recorded_by: string;
  }>
): Promise<void> {
  if (entries.length === 0) return;

  // Get all existing attendance records for this event
  const eventId = entries[0].event_id;
  const existingRecords = await getEventAttendance(eventId);
  const existingMap = new Map(
    existingRecords.map((record) => [record.player_id, record])
  );

  const recordsToUpdate: Array<{ id: string; status: AttendanceStatus }> = [];
  const recordsToInsert: Array<{
    event_id: string;
    player_id: string;
    status: AttendanceStatus;
    recorded_by: string;
  }> = [];

  // Separate entries into updates and inserts
  entries.forEach((entry) => {
    const existing = existingMap.get(entry.player_id);
    if (existing) {
      recordsToUpdate.push({
        id: existing.id,
        status: entry.status,
      });
    } else {
      recordsToInsert.push(entry);
    }
  });

  // Perform batch update operations in parallel
  if (recordsToUpdate.length > 0) {
    const updateResults = await Promise.all(
      recordsToUpdate.map(record =>
        supabase
          .from('attendance_records')
          .update({
            status: record.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id)
      )
    );

    for (const result of updateResults) {
      if (result.error) {
        console.error('Error updating attendance record:', result.error);
        throw result.error;
      }
    }
  }

  // Perform batch insert operation
  if (recordsToInsert.length > 0) {
    const { error } = await supabase
      .from('attendance_records')
      .insert(recordsToInsert.map((entry) => ({
        event_id: entry.event_id,
        player_id: entry.player_id,
        status: entry.status,
        recorded_by: entry.recorded_by,
      })));

    if (error) {
      console.error('Error inserting attendance records:', error);
      throw error;
    }
  }
}

/**
 * Get attendance records for a player with full event details
 * Useful for calendar views and detailed attendance breakdown
 */
export async function getAttendanceWithEvents(
  playerId: string,
  teamId?: string
): Promise<AttendanceRecordWithEvent[]> {
  let query = supabase
    .from('attendance_records')
    .select(`
      *,
      event:events(
        id,
        title,
        type,
        start_time,
        end_time,
        location,
        team_id
      )
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching attendance with events:', error);
    throw error;
  }

  // Filter by team if provided (post-query since nested filter)
  let records = (data || []) as AttendanceRecordWithEvent[];
  if (teamId) {
    records = records.filter(r => r.event?.team_id === teamId);
  }

  return records;
}

/**
 * Calendar data structure for attendance display
 */
export interface AttendanceCalendarDay {
  date: string;
  dayOfMonth: number;
  status: AttendanceStatus | null;
  eventTitle?: string;
  eventType?: string;
}

/**
 * Get attendance data formatted for calendar display
 * Returns data for a specific month
 */
export async function getAttendanceCalendar(
  playerId: string,
  year: number,
  month: number,
  teamId?: string
): Promise<AttendanceCalendarDay[]> {
  const records = await getAttendanceWithEvents(playerId, teamId);

  // Filter to specific month
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthRecords = records.filter(r =>
    r.event?.start_time?.startsWith(monthStr)
  );

  // Create map of dates to attendance
  const dateMap = new Map<string, AttendanceRecordWithEvent>();
  for (const record of monthRecords) {
    const dateStr = record.event.start_time.split('T')[0];
    dateMap.set(dateStr, record);
  }

  // Generate all days in the month
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: AttendanceCalendarDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = dateMap.get(dateStr);

    days.push({
      date: dateStr,
      dayOfMonth: day,
      status: record?.status || null,
      eventTitle: record?.event?.title,
      eventType: record?.event?.type,
    });
  }

  return days;
}
