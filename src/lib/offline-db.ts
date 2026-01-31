import Dexie, { type Table } from 'dexie';
import type {
  Season,
  Team,
  Player,
  TeamMembership,
  Event,
  Rsvp,
  AttendanceRecord,
  Drill,
  PracticePlan,
  PracticeBlock,
  CoachNote,
} from '@/types/database.types';

/**
 * Offline database using Dexie.js
 * Mirrors Supabase schema with additional sync metadata
 */

// Extended types with sync metadata
export interface SyncMetadata {
  _synced: boolean;
  _lastModified: number; // timestamp
  _deleted?: boolean;
}

export interface OfflineSeason extends Season, SyncMetadata {}
export interface OfflineTeam extends Team, SyncMetadata {}
export interface OfflinePlayer extends Player, SyncMetadata {}
export interface OfflineTeamMembership extends TeamMembership, SyncMetadata {}
export interface OfflineEvent extends Event, SyncMetadata {}
export interface OfflineRsvp extends Rsvp, SyncMetadata {}
export interface OfflineAttendanceRecord extends AttendanceRecord, SyncMetadata {}
export interface OfflineDrill extends Drill, SyncMetadata {}
export interface OfflinePracticePlan extends PracticePlan, SyncMetadata {}
export interface OfflinePracticeBlock extends PracticeBlock, SyncMetadata {}
export interface OfflineCoachNote extends CoachNote, SyncMetadata {}

/**
 * Dexie database class
 */
export class TeamTrackerDB extends Dexie {
  // Tables
  seasons!: Table<OfflineSeason>;
  teams!: Table<OfflineTeam>;
  players!: Table<OfflinePlayer>;
  team_memberships!: Table<OfflineTeamMembership>;
  events!: Table<OfflineEvent>;
  rsvps!: Table<OfflineRsvp>;
  attendance_records!: Table<OfflineAttendanceRecord>;
  drills!: Table<OfflineDrill>;
  practice_plans!: Table<OfflinePracticePlan>;
  practice_blocks!: Table<OfflinePracticeBlock>;
  coach_notes!: Table<OfflineCoachNote>;

  constructor() {
    super('TeamTrackerDB');

    this.version(1).stores({
      // Define indexes for each table
      // Primary key is always 'id'
      // Additional indexes for common queries
      seasons: 'id, is_active, archived, _synced, _lastModified, _deleted',
      teams: 'id, season_id, _synced, _lastModified, _deleted',
      players: 'id, name, created_by, _synced, _lastModified, _deleted',
      team_memberships:
        'id, player_id, team_id, [player_id+team_id], is_active, _synced, _lastModified, _deleted',
      events: 'id, team_id, type, start_time, _synced, _lastModified, _deleted',
      rsvps: 'id, event_id, player_id, status, _synced, _lastModified, _deleted',
      attendance_records: 'id, event_id, player_id, status, _synced, _lastModified, _deleted',
      drills: 'id, name, created_by, is_system_drill, _synced, _lastModified, _deleted',
      practice_plans: 'id, team_id, date, created_by, _synced, _lastModified, _deleted',
      practice_blocks:
        'id, practice_plan_id, order_index, drill_id, _synced, _lastModified, _deleted',
      coach_notes: 'id, player_id, author_id, _synced, _lastModified, _deleted',
    });
  }
}

// Create singleton instance
export const db = new TeamTrackerDB();

/**
 * Helper function to add sync metadata to records
 */
export function addSyncMetadata<T>(
  record: T,
  synced: boolean = false
): T & SyncMetadata {
  return {
    ...record,
    _synced: synced,
    _lastModified: Date.now(),
    _deleted: false,
  };
}

/**
 * Helper function to mark record as deleted (soft delete)
 */
export async function softDelete<T extends { id: string }>(
  table: Table<T & SyncMetadata>,
  id: string
): Promise<void> {
  await table.update(id, {
    _deleted: true,
    _synced: false,
    _lastModified: Date.now(),
  } as any);
}

/**
 * Helper function to get unsynced records
 */
export async function getUnsyncedRecords<T extends SyncMetadata>(
  table: Table<T>
): Promise<T[]> {
  return table.where('_synced').equals(0).toArray();
}

/**
 * Helper function to mark records as synced
 */
export async function markAsSynced<T extends { id: string } & SyncMetadata>(
  table: Table<T>,
  ids: string[]
): Promise<void> {
  await Promise.all(
    ids.map((id) =>
      table.update(id, {
        _synced: true,
        _lastModified: Date.now(),
      } as any)
    )
  );
}

/**
 * Helper function to clear all data (for logout/reset)
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
}

/**
 * Helper function to get sync status
 */
export async function getSyncStatus(): Promise<{
  totalRecords: number;
  unsyncedRecords: number;
  lastSync: number | null;
}> {
  let totalRecords = 0;
  let unsyncedRecords = 0;

  for (const table of db.tables) {
    const count = await table.count();
    totalRecords += count;

    const unsynced = await table.where('_synced').equals(0).count();
    unsyncedRecords += unsynced;
  }

  // Get last sync time from most recently modified synced record
  let lastSync: number | null = null;
  for (const table of db.tables) {
    const records = await table
      .where('_synced')
      .equals(1)
      .reverse()
      .sortBy('_lastModified');

    if (records.length > 0) {
      const timestamp = records[0]._lastModified;
      if (lastSync === null || timestamp > lastSync) {
        lastSync = timestamp;
      }
    }
  }

  return { totalRecords, unsyncedRecords, lastSync };
}
