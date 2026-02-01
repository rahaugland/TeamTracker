import { supabase } from '@/lib/supabase';
import { withErrorHandling } from '@/lib/api-error-handler';
import { db, addSyncMetadata, softDelete, type OfflinePlayer, type OfflineTeamMembership } from '@/lib/offline-db';
import { isOnline } from '@/services/sync.service';
import { createPendingRSVPsForPlayer } from '@/services/rsvp.service';
import type {
  Player,
  TeamMembership,
  VolleyballPosition,
  TeamMembershipRole,
} from '@/types/database.types';

/**
 * Player service
 * Handles all Supabase operations for players and team memberships
 */

export interface CreatePlayerInput {
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  positions?: VolleyballPosition[];
  photo_url?: string;
  user_id?: string;
  created_by: string;
}

export interface UpdatePlayerInput {
  name?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  positions?: VolleyballPosition[];
  photo_url?: string;
}

export interface CreateTeamMembershipInput {
  player_id: string;
  team_id: string;
  role?: TeamMembershipRole;
  jersey_number?: number;
  joined_at?: string;
}

export interface UpdateTeamMembershipInput {
  role?: TeamMembershipRole;
  jersey_number?: number;
  joined_at?: string;
  left_at?: string;
  departure_reason?: 'quit' | 'injury' | 'cut' | 'other';
  is_active?: boolean;
}

export interface PlayerWithMemberships extends Player {
  team_memberships: (TeamMembership & {
    team: {
      id: string;
      name: string;
      season_id: string;
    };
  })[];
}

/**
 * Get all players (offline-first)
 * Reads from local Dexie DB first, then syncs with Supabase in background
 */
export async function getPlayers(): Promise<Player[]> {
  try {
    // Always read from local DB first (offline-first)
    // Use filter instead of where for more reliable boolean handling
    const allPlayers = await db.players.toArray();
    const localPlayers = allPlayers
      .filter(p => !p._deleted)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Strip sync metadata before returning
    const players = localPlayers.map(p => stripSyncMetadata(p));

    // Background sync if online
    if (isOnline()) {
      syncPlayersFromRemote().catch(err =>
        console.warn('Background sync failed:', err)
      );
    }

    return players;
  } catch (error) {
    console.error('Error reading from local DB:', error);

    // Fallback to direct Supabase call if local DB fails
    return withErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('name');

        if (error) throw error;
        return data || [];
      },
      { operation: 'getPlayers', retry: true }
    );
  }
}

/**
 * Get a single player by ID with memberships (offline-first)
 */
export async function getPlayer(id: string): Promise<PlayerWithMemberships | null> {
  try {
    // Read from local DB first
    const localPlayer = await db.players.get(id);

    if (localPlayer && !localPlayer._deleted) {
      // Get team memberships from local DB
      const memberships = await db.team_memberships
        .where('player_id')
        .equals(id)
        .and(m => !m._deleted)
        .toArray();

      // Get team details for each membership
      const membershipsWithTeams = await Promise.all(
        memberships.map(async (membership) => {
          const team = await db.teams.get(membership.team_id);
          return {
            ...stripSyncMetadata(membership),
            team: team ? {
              id: team.id,
              name: team.name,
              season_id: team.season_id,
            } : undefined,
          };
        })
      );

      const player: PlayerWithMemberships = {
        ...stripSyncMetadata(localPlayer),
        team_memberships: membershipsWithTeams.filter(m => m.team) as any,
      };

      // Background sync if online
      if (isOnline()) {
        syncPlayerFromRemote(id).catch(err =>
          console.warn('Background sync failed:', err)
        );
      }

      return player;
    }

    // If not in local DB and online, fetch from Supabase
    if (isOnline()) {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team_memberships(
            *,
            team:teams(
              id,
              name,
              season_id
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error fetching player:', error);
        throw error;
      }

      // Store in local DB for offline access
      if (data) {
        await db.players.put(addSyncMetadata(data, true));
        if (data.team_memberships) {
          await db.team_memberships.bulkPut(
            data.team_memberships.map((m: any) => addSyncMetadata(m as TeamMembership, true))
          );
        }
      }

      return data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching player:', error);
    throw error;
  }
}

/**
 * Get players by team ID (offline-first)
 */
export async function getPlayersByTeam(teamId: string): Promise<PlayerWithMemberships[]> {
  try {
    // Read from local DB first
    const memberships = await db.team_memberships
      .where('team_id')
      .equals(teamId)
      .and(m => m.is_active && !m._deleted && m.status !== 'pending')
      .toArray();

    const playerIds = [...new Set(memberships.map(m => m.player_id))];
    const players = await db.players.bulkGet(playerIds);

    const playersWithMemberships: PlayerWithMemberships[] = await Promise.all(
      players
        .filter((p): p is OfflinePlayer => p !== undefined && !p._deleted)
        .map(async (player) => {
          const allMemberships = await db.team_memberships
            .where('player_id')
            .equals(player.id)
            .and(m => !m._deleted)
            .toArray();

          const membershipsWithTeams = await Promise.all(
            allMemberships.map(async (membership) => {
              const team = await db.teams.get(membership.team_id);
              return {
                ...stripSyncMetadata(membership),
                team: team ? {
                  id: team.id,
                  name: team.name,
                  season_id: team.season_id,
                } : undefined,
              };
            })
          );

          return {
            ...stripSyncMetadata(player),
            team_memberships: membershipsWithTeams.filter(m => m.team) as any,
          };
        })
    );

    // Background sync if online
    if (isOnline()) {
      syncTeamPlayersFromRemote(teamId).catch(err =>
        console.warn('Background sync failed:', err)
      );
    }

    return playersWithMemberships;
  } catch (error) {
    console.error('Error reading from local DB:', error);

    // Fallback to Supabase
    const { data, error: supabaseError } = await supabase
      .from('team_memberships')
      .select(`
        player:players(
          *,
          team_memberships(
            *,
            team:teams(
              id,
              name,
              season_id
            )
          )
        ),
        *
      `)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .eq('status', 'active');

    if (supabaseError) {
      console.error('Error fetching team players:', supabaseError);
      throw supabaseError;
    }

    return data?.map((item) => item.player).filter(Boolean) || [];
  }
}

/**
 * Search players by name (offline-first)
 */
export async function searchPlayers(query: string): Promise<Player[]> {
  try {
    // Search in local DB first
    const localPlayers = await db.players
      .where('_deleted')
      .notEqual(true as any)
      .toArray();

    const filtered = localPlayers
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 20);

    const players = filtered.map(p => stripSyncMetadata(p));

    // Background sync if online
    if (isOnline()) {
      syncPlayersFromRemote().catch(err =>
        console.warn('Background sync failed:', err)
      );
    }

    return players;
  } catch (error) {
    console.error('Error searching local DB:', error);

    // Fallback to Supabase
    const { data, error: supabaseError } = await supabase
      .from('players')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20);

    if (supabaseError) {
      console.error('Error searching players:', supabaseError);
      throw supabaseError;
    }

    return data || [];
  }
}

/**
 * Create a new player (offline-first)
 * Writes to local DB immediately, then syncs to Supabase
 */
export async function createPlayer(input: CreatePlayerInput): Promise<Player> {
  try {
    // Generate a temporary ID for offline creation
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newPlayer: Player = {
      id: tempId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      birth_date: input.birth_date,
      positions: input.positions || [],
      photo_url: input.photo_url,
      user_id: input.user_id,
      created_by: input.created_by,
      created_at: now,
      updated_at: now,
    };

    // Save to local DB immediately (optimistic update)
    const offlinePlayer = addSyncMetadata(newPlayer, false);
    await db.players.put(offlinePlayer);

    // If online, sync to Supabase immediately
    if (isOnline()) {
      try {
        const { data, error } = await supabase
          .from('players')
          .insert({
            name: input.name,
            email: input.email,
            phone: input.phone,
            birth_date: input.birth_date,
            positions: input.positions || [],
            photo_url: input.photo_url,
            user_id: input.user_id,
            created_by: input.created_by,
          })
          .select()
          .single();

        if (error) throw error;

        // Update local DB with real ID from Supabase
        await db.players.delete(tempId);
        await db.players.put(addSyncMetadata(data, true));

        return data;
      } catch (error: any) {
        // If it's an RLS/auth error, propagate it instead of falling back to offline
        if (error?.code === '42501' || error?.code === '403') {
          await db.players.delete(tempId);
          throw error;
        }
        console.error('Error syncing to Supabase, keeping offline record:', error);
        // Keep the offline record for later sync
        return newPlayer;
      }
    }

    // Return the optimistic player record
    return newPlayer;
  } catch (error) {
    console.error('Error creating player:', error);
    throw error;
  }
}

/**
 * Update a player (offline-first)
 * Writes to local DB immediately, then syncs to Supabase
 */
export async function updatePlayer(
  id: string,
  input: UpdatePlayerInput
): Promise<Player> {
  try {
    // Get current player from local DB
    const currentPlayer = await db.players.get(id);

    if (!currentPlayer) {
      throw new Error(`Player with id ${id} not found in local database`);
    }

    const now = new Date().toISOString();
    const updatedPlayer: Player = {
      ...stripSyncMetadata(currentPlayer),
      ...input,
      updated_at: now,
    };

    // Save to local DB immediately (optimistic update)
    const offlinePlayer = addSyncMetadata(updatedPlayer, false);
    await db.players.put(offlinePlayer);

    // If online, sync to Supabase immediately
    if (isOnline()) {
      try {
        const { data, error } = await supabase
          .from('players')
          .update({
            ...input,
            updated_at: now,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // Mark as synced in local DB
        await db.players.put(addSyncMetadata(data, true));

        return data;
      } catch (error) {
        console.error('Error syncing to Supabase, keeping offline record:', error);
        // Keep the offline record for later sync
        return updatedPlayer;
      }
    }

    // Return the optimistic update
    return updatedPlayer;
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
}

/**
 * Delete a player (offline-first)
 * Marks as deleted in local DB immediately, then syncs to Supabase
 */
export async function deletePlayer(id: string): Promise<void> {
  try {
    // Soft delete in local DB immediately
    await softDelete(db.players, id);

    // If online, sync deletion to Supabase immediately
    if (isOnline()) {
      try {
        const { error } = await supabase.from('players').delete().eq('id', id);

        if (error) throw error;

        // Hard delete from local DB after successful remote deletion
        await db.players.delete(id);
      } catch (error) {
        console.error('Error syncing deletion to Supabase, keeping soft delete:', error);
        // Keep the soft delete for later sync
      }
    }
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
}

/**
 * Helper function to strip sync metadata from player records
 */
function stripSyncMetadata(player: OfflinePlayer): Player;
function stripSyncMetadata(membership: OfflineTeamMembership): TeamMembership;
function stripSyncMetadata(record: any): any {
  const { _synced, _lastModified, _deleted, ...cleanRecord } = record;
  return cleanRecord;
}

/**
 * Background sync: Pull all players from Supabase to local DB
 */
async function syncPlayersFromRemote(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');

    if (error) throw error;

    if (data && data.length > 0) {
      const playersWithMetadata = data.map(p => addSyncMetadata(p, true));
      await db.players.bulkPut(playersWithMetadata);
    }
  } catch (error) {
    console.error('Error syncing players from remote:', error);
    throw error;
  }
}

/**
 * Background sync: Pull single player from Supabase to local DB
 */
async function syncPlayerFromRemote(id: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Player not found remotely, might have been deleted
        await softDelete(db.players, id);
        return;
      }
      throw error;
    }

    if (data) {
      await db.players.put(addSyncMetadata(data, true));
    }
  } catch (error) {
    console.error('Error syncing player from remote:', error);
    throw error;
  }
}

/**
 * Background sync: Pull team players from Supabase to local DB
 */
async function syncTeamPlayersFromRemote(teamId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('team_memberships')
      .select(`
        player:players(*),
        *
      `)
      .eq('team_id', teamId)
      .eq('is_active', true);

    if (error) throw error;

    if (data) {
      // Extract and store players
      const players = data
        .map(item => item.player)
        .filter((p): p is Player => p !== null);

      if (players.length > 0) {
        await db.players.bulkPut(
          players.map(p => addSyncMetadata(p, true))
        );
      }

      // Store memberships
      const memberships = data.map(item => {
        const { player, ...membership } = item;
        return membership as TeamMembership;
      });

      if (memberships.length > 0) {
        await db.team_memberships.bulkPut(
          memberships.map(m => addSyncMetadata(m, true))
        );
      }
    }
  } catch (error) {
    console.error('Error syncing team players from remote:', error);
    throw error;
  }
}

/**
 * Add a player to a team (offline-first)
 */
export async function addPlayerToTeam(
  input: CreateTeamMembershipInput
): Promise<TeamMembership> {
  try {
    // Check for existing active membership
    const existing = await getTeamMembership(input.player_id, input.team_id);
    if (existing) {
      throw new Error('ALREADY_MEMBER');
    }

    // Generate a temporary ID for offline creation
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newMembership: TeamMembership = {
      id: tempId,
      player_id: input.player_id,
      team_id: input.team_id,
      role: input.role || 'player',
      jersey_number: input.jersey_number,
      joined_at: input.joined_at || new Date().toISOString().split('T')[0],
      is_active: true,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    // Save to local DB immediately (optimistic update)
    const offlineMembership = addSyncMetadata(newMembership, false);
    await db.team_memberships.put(offlineMembership);

    // If online, sync to Supabase immediately
    if (isOnline()) {
      try {
        const { data, error } = await supabase
          .from('team_memberships')
          .insert({
            player_id: input.player_id,
            team_id: input.team_id,
            role: input.role || 'player',
            jersey_number: input.jersey_number,
            joined_at: input.joined_at || new Date().toISOString().split('T')[0],
            is_active: true,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;

        // Update local DB with real ID from Supabase
        await db.team_memberships.delete(tempId);
        await db.team_memberships.put(addSyncMetadata(data, true));

        return data;
      } catch (error) {
        console.error('Error syncing to Supabase, keeping offline record:', error);
        // Keep the offline record for later sync
        return newMembership;
      }
    }

    // Return the optimistic membership record
    return newMembership;
  } catch (error) {
    console.error('Error adding player to team:', error);
    throw error;
  }
}

/**
 * Update a team membership (offline-first)
 */
export async function updateTeamMembership(
  id: string,
  input: UpdateTeamMembershipInput
): Promise<TeamMembership> {
  try {
    // Get current membership from local DB
    const currentMembership = await db.team_memberships.get(id);

    if (!currentMembership) {
      throw new Error(`Team membership with id ${id} not found in local database`);
    }

    const now = new Date().toISOString();
    const updatedMembership: TeamMembership = {
      ...stripSyncMetadata(currentMembership),
      ...input,
      updated_at: now,
    };

    // Save to local DB immediately (optimistic update)
    const offlineMembership = addSyncMetadata(updatedMembership, false);
    await db.team_memberships.put(offlineMembership);

    // If online, sync to Supabase immediately
    if (isOnline()) {
      try {
        const { data, error } = await supabase
          .from('team_memberships')
          .update({
            ...input,
            updated_at: now,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // Mark as synced in local DB
        await db.team_memberships.put(addSyncMetadata(data, true));

        return data;
      } catch (error) {
        console.error('Error syncing to Supabase, keeping offline record:', error);
        // Keep the offline record for later sync
        return updatedMembership;
      }
    }

    // Return the optimistic update
    return updatedMembership;
  } catch (error) {
    console.error('Error updating team membership:', error);
    throw error;
  }
}

/**
 * Remove a player from a team (soft delete - set is_active to false)
 */
export async function removePlayerFromTeam(
  membershipId: string,
  departureReason?: 'quit' | 'injury' | 'cut' | 'other'
): Promise<TeamMembership> {
  return updateTeamMembership(membershipId, {
    is_active: false,
    left_at: new Date().toISOString().split('T')[0],
    departure_reason: departureReason,
  });
}

/**
 * Get team membership for a specific player and team (offline-first)
 */
export async function getTeamMembership(
  playerId: string,
  teamId: string
): Promise<TeamMembership | null> {
  try {
    // Read from local DB first
    const memberships = await db.team_memberships
      .where('[player_id+team_id]')
      .equals([playerId, teamId])
      .and(m => m.is_active && !m._deleted)
      .toArray();

    if (memberships.length > 0) {
      const membership = stripSyncMetadata(memberships[0]);

      // Background sync if online
      if (isOnline()) {
        syncTeamMembershipFromRemote(playerId, teamId).catch(err =>
          console.warn('Background sync failed:', err)
        );
      }

      return membership;
    }

    // If not in local DB and online, fetch from Supabase
    if (isOnline()) {
      const { data, error } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('player_id', playerId)
        .eq('team_id', teamId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching team membership:', error);
        throw error;
      }

      // Store in local DB for offline access
      if (data) {
        await db.team_memberships.put(addSyncMetadata(data, true));
      }

      return data || null;
    }

    return null;
  } catch (error) {
    console.error('Error fetching team membership:', error);
    throw error;
  }
}

/**
 * Get pending players for a team (awaiting coach approval)
 */
export async function getPendingPlayersByTeam(teamId: string): Promise<PlayerWithMemberships[]> {
  const { data, error } = await supabase
    .from('team_memberships')
    .select(`
      *,
      player:players(*)
    `)
    .eq('team_id', teamId)
    .eq('is_active', true)
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching pending players:', error);
    throw error;
  }

  return (data || []).map((item: any) => ({
    ...item.player,
    team_memberships: [{ ...item, player: undefined }],
  }));
}

/**
 * Approve a pending team membership
 */
export async function approveTeamMembership(membershipId: string): Promise<void> {
  const { data, error } = await supabase
    .from('team_memberships')
    .update({ status: 'active' })
    .eq('id', membershipId)
    .select()
    .single();

  if (error) {
    console.error('Error approving membership:', error);
    throw error;
  }

  // Update local DB
  if (data) {
    await db.team_memberships.put(addSyncMetadata(data, true));
  }

  // RSVPs are created automatically by the DB trigger fn_create_rsvps_for_new_member
}

/**
 * Reject a pending team membership (hard delete)
 */
export async function rejectTeamMembership(membershipId: string): Promise<void> {
  // Get membership first to check player
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('*')
    .eq('id', membershipId)
    .single();

  // Delete the membership
  const { error } = await supabase
    .from('team_memberships')
    .delete()
    .eq('id', membershipId);

  if (error) {
    console.error('Error rejecting membership:', error);
    throw error;
  }

  // Remove from local DB
  await db.team_memberships.delete(membershipId);

  // If player has no other memberships, delete the player record too
  if (membership) {
    const { data: otherMemberships } = await supabase
      .from('team_memberships')
      .select('id')
      .eq('player_id', membership.player_id);

    if (!otherMemberships || otherMemberships.length === 0) {
      await supabase.from('players').delete().eq('id', membership.player_id);
      await db.players.delete(membership.player_id);
    }
  }
}

/**
 * Background sync: Pull team membership from Supabase to local DB
 */
async function syncTeamMembershipFromRemote(
  playerId: string,
  teamId: string
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('team_memberships')
      .select('*')
      .eq('player_id', playerId)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      await db.team_memberships.put(addSyncMetadata(data, true));
    }
  } catch (error) {
    console.error('Error syncing team membership from remote:', error);
    throw error;
  }
}
