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
    // Pull seasons
    const { data: seasons, error: seasonsError } = await supabase
      .from('seasons')
      .select('*');

    if (seasonsError) {
      errors.push(`Seasons: ${seasonsError.message}`);
    } else if (seasons) {
      await db.seasons.bulkPut(
        seasons.map((s) => addSyncMetadata(s, true))
      );
      pulled += seasons.length;
    }

    // Pull teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*');

    if (teamsError) {
      errors.push(`Teams: ${teamsError.message}`);
    } else if (teams) {
      await db.teams.bulkPut(teams.map((t) => addSyncMetadata(t, true)));
      pulled += teams.length;
    }

    // Pull all players (not just created by user, as users may need to see all players)
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*');

    if (playersError) {
      errors.push(`Players: ${playersError.message}`);
    } else if (players) {
      // Use bulkPut to merge with existing data, preserving unsynced local changes
      const playersToSync = await Promise.all(
        players.map(async (remotePlayer) => {
          const localPlayer = await db.players.get(remotePlayer.id);

          // If local record exists and is unsynced, check for conflicts
          if (localPlayer && !localPlayer._synced) {
            // Last-write-wins: compare timestamps
            const localTime = new Date(localPlayer.updated_at).getTime();
            const remoteTime = new Date(remotePlayer.updated_at).getTime();

            // Keep local if it's newer (unsynced changes)
            if (localTime > remoteTime) {
              return localPlayer;
            }
          }

          // Otherwise use remote data
          return addSyncMetadata(remotePlayer, true);
        })
      );

      await db.players.bulkPut(playersToSync);
      pulled += players.length;
    }

    // Pull team memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('team_memberships')
      .select('*');

    if (membershipsError) {
      errors.push(`Memberships: ${membershipsError.message}`);
    } else if (memberships) {
      await db.team_memberships.bulkPut(
        memberships.map((m) => addSyncMetadata(m, true))
      );
      pulled += memberships.length;
    }

    // Pull events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*');

    if (eventsError) {
      errors.push(`Events: ${eventsError.message}`);
    } else if (events) {
      await db.events.bulkPut(events.map((e) => addSyncMetadata(e, true)));
      pulled += events.length;
    }

    // Pull RSVPs
    const { data: rsvps, error: rsvpsError } = await supabase
      .from('rsvps')
      .select('*');

    if (rsvpsError) {
      errors.push(`RSVPs: ${rsvpsError.message}`);
    } else if (rsvps) {
      await db.rsvps.bulkPut(rsvps.map((r) => addSyncMetadata(r, true)));
      pulled += rsvps.length;
    }

    // Pull attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*');

    if (attendanceError) {
      errors.push(`Attendance: ${attendanceError.message}`);
    } else if (attendance) {
      await db.attendance_records.bulkPut(
        attendance.map((a) => addSyncMetadata(a, true))
      );
      pulled += attendance.length;
    }

    // Pull drills
    const { data: drills, error: drillsError } = await supabase
      .from('drills')
      .select('*');

    if (drillsError) {
      errors.push(`Drills: ${drillsError.message}`);
    } else if (drills) {
      await db.drills.bulkPut(drills.map((d) => addSyncMetadata(d, true)));
      pulled += drills.length;
    }

    // Pull practice plans
    const { data: plans, error: plansError } = await supabase
      .from('practice_plans')
      .select('*')
      .eq('created_by', userId);

    if (plansError) {
      errors.push(`Practice plans: ${plansError.message}`);
    } else if (plans) {
      await db.practice_plans.bulkPut(
        plans.map((p) => addSyncMetadata(p, true))
      );
      pulled += plans.length;
    }

    // Pull practice blocks
    const { data: blocks, error: blocksError } = await supabase
      .from('practice_blocks')
      .select('*');

    if (blocksError) {
      errors.push(`Practice blocks: ${blocksError.message}`);
    } else if (blocks) {
      await db.practice_blocks.bulkPut(
        blocks.map((b) => addSyncMetadata(b, true))
      );
      pulled += blocks.length;
    }

    // Pull coach notes
    const { data: notes, error: notesError } = await supabase
      .from('coach_notes')
      .select('*')
      .eq('author_id', userId);

    if (notesError) {
      errors.push(`Coach notes: ${notesError.message}`);
    } else if (notes) {
      await db.coach_notes.bulkPut(notes.map((n) => addSyncMetadata(n, true)));
      pulled += notes.length;
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
