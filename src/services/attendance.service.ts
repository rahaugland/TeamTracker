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

  return {
    total: records.length,
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    excused: records.filter((r) => r.status === 'excused').length,
    not_selected: records.filter((r) => r.status === 'not_selected').length,
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

  // Perform batch update operations
  if (recordsToUpdate.length > 0) {
    for (const record of recordsToUpdate) {
      const { error } = await supabase
        .from('attendance_records')
        .update({
          status: record.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      if (error) {
        console.error('Error updating attendance record:', error);
        throw error;
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
