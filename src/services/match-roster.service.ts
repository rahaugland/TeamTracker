import { supabase } from '@/lib/supabase';

/**
 * Match Roster Service
 * Handles CRUD operations for match rosters (player selections for matches)
 */

export interface MatchRosterEntry {
  id: string;
  event_id: string;
  player_id: string;
  selected_by: string;
  selected_at: string;
}

/**
 * Get player IDs for a match roster
 */
export async function getMatchRoster(eventId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('match_rosters')
    .select('player_id')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching match roster:', error);
    throw error;
  }

  return (data || []).map((r) => r.player_id);
}

/**
 * Get full match roster entries with details
 */
export async function getMatchRosterEntries(eventId: string): Promise<MatchRosterEntry[]> {
  const { data, error } = await supabase
    .from('match_rosters')
    .select('*')
    .eq('event_id', eventId)
    .order('selected_at', { ascending: true });

  if (error) {
    console.error('Error fetching match roster entries:', error);
    throw error;
  }

  return data || [];
}

/**
 * Save/update match roster
 * This replaces the entire roster for the event
 */
export async function saveMatchRoster(
  eventId: string,
  playerIds: string[],
  userId: string
): Promise<void> {
  // First, delete existing roster entries for this event
  const { error: deleteError } = await supabase
    .from('match_rosters')
    .delete()
    .eq('event_id', eventId);

  if (deleteError) {
    console.error('Error clearing existing roster:', deleteError);
    throw deleteError;
  }

  // If no players selected, we're done
  if (playerIds.length === 0) {
    return;
  }

  // Insert new roster entries
  const now = new Date().toISOString();
  const entries = playerIds.map((playerId) => ({
    event_id: eventId,
    player_id: playerId,
    selected_by: userId,
    selected_at: now,
  }));

  const { error: insertError } = await supabase
    .from('match_rosters')
    .insert(entries);

  if (insertError) {
    console.error('Error saving match roster:', insertError);
    throw insertError;
  }
}

/**
 * Clear all players from a match roster
 */
export async function clearMatchRoster(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('match_rosters')
    .delete()
    .eq('event_id', eventId);

  if (error) {
    console.error('Error clearing match roster:', error);
    throw error;
  }
}

/**
 * Add a single player to a match roster
 */
export async function addPlayerToRoster(
  eventId: string,
  playerId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('match_rosters')
    .upsert(
      {
        event_id: eventId,
        player_id: playerId,
        selected_by: userId,
        selected_at: new Date().toISOString(),
      },
      {
        onConflict: 'event_id,player_id',
      }
    );

  if (error) {
    console.error('Error adding player to roster:', error);
    throw error;
  }
}

/**
 * Remove a single player from a match roster
 */
export async function removePlayerFromRoster(
  eventId: string,
  playerId: string
): Promise<void> {
  const { error } = await supabase
    .from('match_rosters')
    .delete()
    .eq('event_id', eventId)
    .eq('player_id', playerId);

  if (error) {
    console.error('Error removing player from roster:', error);
    throw error;
  }
}
