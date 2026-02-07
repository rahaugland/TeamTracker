import { supabase } from '@/lib/supabase';
import { db, addSyncMetadata, markAsSynced, getUnsyncedRecords } from '@/lib/offline-db';

/**
 * Sync service
 * Handles bidirectional sync between Supabase and IndexedDB
 */

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncResult {
  success: boolean;
  pulled: number;
  pushed: number;
  errors: string[];
}

// Track sync state
let currentSyncStatus: SyncStatus = 'idle';
let lastSyncTime: number | null = null;
const syncListeners: Array<(status: SyncStatus) => void> = [];

/**
 * Subscribe to sync status changes
 */
export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  syncListeners.push(listener);
  return () => {
    const index = syncListeners.indexOf(listener);
    if (index > -1) {
      syncListeners.splice(index, 1);
    }
  };
}

/**
 * Update sync status and notify listeners
 */
function setSyncStatus(status: SyncStatus): void {
  currentSyncStatus = status;
  syncListeners.forEach((listener) => listener(status));
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

/**
 * Get last sync time
 */
export function getLastSyncTime(): number | null {
  return lastSyncTime;
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Pull data from Supabase to local IndexedDB
 */
export async function syncToLocal(userId: string): Promise<Partial<SyncResult>> {
  const errors: string[] = [];
  let pulled = 0;

  try {
    // Fetch all tables in parallel for maximum throughput
    const [
      seasonsRes, teamsRes, playersRes, membershipsRes, eventsRes,
      rsvpsRes, attendanceRes, drillsRes, plansRes, blocksRes, notesRes,
    ] = await Promise.all([
      supabase.from('seasons').select('*'),
      supabase.from('teams').select('*'),
      supabase.from('players').select('*'),
      supabase.from('team_memberships').select('*'),
      supabase.from('events').select('*'),
      supabase.from('rsvps').select('*'),
      supabase.from('attendance_records').select('*'),
      supabase.from('drills').select('*'),
      supabase.from('practice_plans').select('*').eq('created_by', userId),
      supabase.from('practice_blocks').select('*'),
      supabase.from('coach_notes').select('*').eq('author_id', userId),
    ]);

    // Process seasons
    if (seasonsRes.error) {
      errors.push(`Seasons: ${seasonsRes.error.message}`);
    } else if (seasonsRes.data) {
      await db.seasons.bulkPut(seasonsRes.data.map((s) => addSyncMetadata(s, true)));
      pulled += seasonsRes.data.length;
    }

    // Process teams
    if (teamsRes.error) {
      errors.push(`Teams: ${teamsRes.error.message}`);
    } else if (teamsRes.data) {
      await db.teams.bulkPut(teamsRes.data.map((t) => addSyncMetadata(t, true)));
      pulled += teamsRes.data.length;
    }

    // Process players with conflict resolution
    if (playersRes.error) {
      errors.push(`Players: ${playersRes.error.message}`);
    } else if (playersRes.data) {
      const playersToSync = await Promise.all(
        playersRes.data.map(async (remotePlayer) => {
          const localPlayer = await db.players.get(remotePlayer.id);

          // If local record exists and is unsynced, check for conflicts
          if (localPlayer && !localPlayer._synced) {
            const localTime = new Date(localPlayer.updated_at).getTime();
            const remoteTime = new Date(remotePlayer.updated_at).getTime();

            // Keep local if it's newer (unsynced changes)
            if (localTime > remoteTime) {
              return localPlayer;
            }
          }

          return addSyncMetadata(remotePlayer, true);
        })
      );

      await db.players.bulkPut(playersToSync);
      pulled += playersRes.data.length;
    }

    // Process memberships
    if (membershipsRes.error) {
      errors.push(`Memberships: ${membershipsRes.error.message}`);
    } else if (membershipsRes.data) {
      await db.team_memberships.bulkPut(membershipsRes.data.map((m) => addSyncMetadata(m, true)));
      pulled += membershipsRes.data.length;
    }

    // Process events
    if (eventsRes.error) {
      errors.push(`Events: ${eventsRes.error.message}`);
    } else if (eventsRes.data) {
      await db.events.bulkPut(eventsRes.data.map((e) => addSyncMetadata(e, true)));
      pulled += eventsRes.data.length;
    }

    // Process RSVPs
    if (rsvpsRes.error) {
      errors.push(`RSVPs: ${rsvpsRes.error.message}`);
    } else if (rsvpsRes.data) {
      await db.rsvps.bulkPut(rsvpsRes.data.map((r) => addSyncMetadata(r, true)));
      pulled += rsvpsRes.data.length;
    }

    // Process attendance records
    if (attendanceRes.error) {
      errors.push(`Attendance: ${attendanceRes.error.message}`);
    } else if (attendanceRes.data) {
      await db.attendance_records.bulkPut(attendanceRes.data.map((a) => addSyncMetadata(a, true)));
      pulled += attendanceRes.data.length;
    }

    // Process drills
    if (drillsRes.error) {
      errors.push(`Drills: ${drillsRes.error.message}`);
    } else if (drillsRes.data) {
      await db.drills.bulkPut(drillsRes.data.map((d) => addSyncMetadata(d, true)));
      pulled += drillsRes.data.length;
    }

    // Process practice plans
    if (plansRes.error) {
      errors.push(`Practice plans: ${plansRes.error.message}`);
    } else if (plansRes.data) {
      await db.practice_plans.bulkPut(plansRes.data.map((p) => addSyncMetadata(p, true)));
      pulled += plansRes.data.length;
    }

    // Process practice blocks
    if (blocksRes.error) {
      errors.push(`Practice blocks: ${blocksRes.error.message}`);
    } else if (blocksRes.data) {
      await db.practice_blocks.bulkPut(blocksRes.data.map((b) => addSyncMetadata(b, true)));
      pulled += blocksRes.data.length;
    }

    // Process coach notes
    if (notesRes.error) {
      errors.push(`Coach notes: ${notesRes.error.message}`);
    } else if (notesRes.data) {
      await db.coach_notes.bulkPut(notesRes.data.map((n) => addSyncMetadata(n, true)));
      pulled += notesRes.data.length;
    }

    return { pulled, errors };
  } catch (error) {
    errors.push(`Sync error: ${error}`);
    return { pulled, errors };
  }
}

/**
 * Push local changes to Supabase
 */
export async function syncToRemote(): Promise<Partial<SyncResult>> {
  const errors: string[] = [];
  let pushed = 0;

  try {
    // Sync players
    const unsyncedPlayers = await getUnsyncedRecords(db.players);
    for (const player of unsyncedPlayers) {
      try {
        if (player._deleted) {
          // Handle deletion
          const { error } = await supabase.from('players').delete().eq('id', player.id);
          if (error && error.code !== 'PGRST116') {
            // Ignore not found errors, log others
            console.error(`Error deleting player ${player.id}:`, error);
            errors.push(`Player delete ${player.id}: ${error.message}`);
            continue;
          }
          // Remove from local DB after successful deletion
          await db.players.delete(player.id);
        } else {
          // Handle create/update
          const { _synced, _lastModified, _deleted, ...playerData } = player;

          // Check if this is a temp ID (offline creation)
          const isTempId = playerData.id.startsWith('temp_');

          if (isTempId) {
            // Insert new record and get the real ID
            const { data, error } = await supabase
              .from('players')
              .insert(playerData)
              .select()
              .single();

            if (error) {
              console.error(`Error creating player ${player.id}:`, error);
              errors.push(`Player create ${player.id}: ${error.message}`);
              continue;
            }

            // Remove temp record and add real one
            await db.players.delete(player.id);
            await db.players.put(addSyncMetadata(data, true));
          } else {
            // Update existing record
            const { error } = await supabase
              .from('players')
              .upsert(playerData);

            if (error) {
              console.error(`Error updating player ${player.id}:`, error);
              errors.push(`Player update ${player.id}: ${error.message}`);
              continue;
            }

            // Mark as synced
            await db.players.update(player.id, {
              _synced: true,
              _lastModified: Date.now(),
            });
          }
        }
        pushed++;
      } catch (error) {
        console.error(`Error syncing player ${player.id}:`, error);
        errors.push(`Player ${player.id}: ${error}`);
      }
    }

    // Sync team memberships
    const unsyncedMemberships = await getUnsyncedRecords(db.team_memberships);
    for (const membership of unsyncedMemberships) {
      try {
        if (membership._deleted) {
          // Handle deletion
          const { error } = await supabase
            .from('team_memberships')
            .delete()
            .eq('id', membership.id);

          if (error && error.code !== 'PGRST116') {
            console.error(`Error deleting membership ${membership.id}:`, error);
            errors.push(`Membership delete ${membership.id}: ${error.message}`);
            continue;
          }
          // Remove from local DB after successful deletion
          await db.team_memberships.delete(membership.id);
        } else {
          // Handle create/update
          const { _synced, _lastModified, _deleted, ...membershipData } = membership;

          // Check if this is a temp ID (offline creation)
          const isTempId = membershipData.id.startsWith('temp_');

          if (isTempId) {
            // Insert new record and get the real ID
            const { data, error } = await supabase
              .from('team_memberships')
              .insert(membershipData)
              .select()
              .single();

            if (error) {
              console.error(`Error creating membership ${membership.id}:`, error);
              errors.push(`Membership create ${membership.id}: ${error.message}`);
              continue;
            }

            // Remove temp record and add real one
            await db.team_memberships.delete(membership.id);
            await db.team_memberships.put(addSyncMetadata(data, true));
          } else {
            // Update existing record
            const { error } = await supabase
              .from('team_memberships')
              .upsert(membershipData);

            if (error) {
              console.error(`Error updating membership ${membership.id}:`, error);
              errors.push(`Membership update ${membership.id}: ${error.message}`);
              continue;
            }

            // Mark as synced
            await db.team_memberships.update(membership.id, {
              _synced: true,
              _lastModified: Date.now(),
            });
          }
        }
        pushed++;
      } catch (error) {
        console.error(`Error syncing membership ${membership.id}:`, error);
        errors.push(`Membership ${membership.id}: ${error}`);
      }
    }

    // Sync events
    const unsyncedEvents = await getUnsyncedRecords(db.events);
    for (const event of unsyncedEvents) {
      if (event._deleted) {
        await supabase.from('events').delete().eq('id', event.id);
      } else {
        const { _synced, _lastModified, _deleted, ...eventData } = event;
        await supabase.from('events').upsert(eventData);
      }
      pushed++;
    }
    if (unsyncedEvents.length > 0) {
      await markAsSynced(
        db.events,
        unsyncedEvents.map((e) => e.id)
      );
    }

    // Sync RSVPs
    const unsyncedRsvps = await getUnsyncedRecords(db.rsvps);
    for (const rsvp of unsyncedRsvps) {
      if (rsvp._deleted) {
        await supabase.from('rsvps').delete().eq('id', rsvp.id);
      } else {
        const { _synced, _lastModified, _deleted, ...rsvpData } = rsvp;
        await supabase.from('rsvps').upsert(rsvpData);
      }
      pushed++;
    }
    if (unsyncedRsvps.length > 0) {
      await markAsSynced(
        db.rsvps,
        unsyncedRsvps.map((r) => r.id)
      );
    }

    // Sync attendance records
    const unsyncedAttendance = await getUnsyncedRecords(db.attendance_records);
    for (const record of unsyncedAttendance) {
      if (record._deleted) {
        await supabase.from('attendance_records').delete().eq('id', record.id);
      } else {
        const { _synced, _lastModified, _deleted, ...recordData } = record;
        await supabase.from('attendance_records').upsert(recordData);
      }
      pushed++;
    }
    if (unsyncedAttendance.length > 0) {
      await markAsSynced(
        db.attendance_records,
        unsyncedAttendance.map((a) => a.id)
      );
    }

    // Sync coach notes
    const unsyncedNotes = await getUnsyncedRecords(db.coach_notes);
    for (const note of unsyncedNotes) {
      if (note._deleted) {
        await supabase.from('coach_notes').delete().eq('id', note.id);
      } else {
        const { _synced, _lastModified, _deleted, ...noteData } = note;
        await supabase.from('coach_notes').upsert(noteData);
      }
      pushed++;
    }
    if (unsyncedNotes.length > 0) {
      await markAsSynced(
        db.coach_notes,
        unsyncedNotes.map((n) => n.id)
      );
    }

    return { pushed, errors };
  } catch (error) {
    errors.push(`Push error: ${error}`);
    return { pushed, errors };
  }
}

/**
 * Full bidirectional sync
 */
export async function performSync(userId: string): Promise<SyncResult> {
  if (!isOnline()) {
    setSyncStatus('offline');
    return {
      success: false,
      pulled: 0,
      pushed: 0,
      errors: ['Device is offline'],
    };
  }

  setSyncStatus('syncing');

  try {
    // First push local changes
    const pushResult = await syncToRemote();

    // Then pull remote changes
    const pullResult = await syncToLocal(userId);

    const success =
      (pushResult.errors?.length || 0) === 0 &&
      (pullResult.errors?.length || 0) === 0;

    if (success) {
      lastSyncTime = Date.now();
      setSyncStatus('idle');
    } else {
      setSyncStatus('error');
    }

    return {
      success,
      pulled: pullResult.pulled || 0,
      pushed: pushResult.pushed || 0,
      errors: [...(pushResult.errors || []), ...(pullResult.errors || [])],
    };
  } catch (error) {
    setSyncStatus('error');
    return {
      success: false,
      pulled: 0,
      pushed: 0,
      errors: [`Sync failed: ${error}`],
    };
  }
}

/**
 * Auto-sync on interval
 */
let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(userId: string, intervalMs: number = 60000): void {
  stopAutoSync();
  syncInterval = setInterval(() => {
    if (isOnline()) {
      performSync(userId);
    }
  }, intervalMs);
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
