import { supabase } from '@/lib/supabase';
import type { Rsvp, RsvpStatus } from '@/types/database.types';

/**
 * RSVP service
 * Handles all Supabase operations for event RSVPs
 */

export interface SubmitRSVPInput {
  event_id: string;
  player_id: string;
  status: RsvpStatus;
  responded_by: string;
  note?: string;
}

export interface RsvpWithPlayer extends Rsvp {
  player: {
    id: string;
    name: string;
    photo_url?: string;
  };
}

/**
 * Get all RSVPs for an event
 */
export async function getEventRSVPs(eventId: string): Promise<RsvpWithPlayer[]> {
  const { data, error } = await supabase
    .from('rsvps')
    .select(`
      *,
      player:players(
        id,
        name,
        photo_url
      )
    `)
    .eq('event_id', eventId)
    .order('responded_at', { ascending: false });

  if (error) {
    console.error('Error fetching event RSVPs:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a player's RSVP history
 */
export async function getPlayerRSVPs(playerId: string): Promise<Rsvp[]> {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('player_id', playerId)
    .order('responded_at', { ascending: false });

  if (error) {
    console.error('Error fetching player RSVPs:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a specific RSVP for a player and event
 */
export async function getRSVP(
  eventId: string,
  playerId: string
): Promise<Rsvp | null> {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('event_id', eventId)
    .eq('player_id', playerId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching RSVP:', error);
    throw error;
  }

  return data || null;
}

/**
 * Submit or update an RSVP
 * Uses upsert to handle both create and update cases
 */
export async function submitRSVP(input: SubmitRSVPInput): Promise<Rsvp> {
  const { data, error } = await supabase
    .from('rsvps')
    .upsert(
      {
        event_id: input.event_id,
        player_id: input.player_id,
        status: input.status,
        responded_by: input.responded_by,
        responded_at: new Date().toISOString(),
        note: input.note,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'event_id,player_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error submitting RSVP:', error);
    throw error;
  }

  return data;
}

/**
 * Delete an RSVP
 */
export async function deleteRSVP(eventId: string, playerId: string): Promise<void> {
  const { error } = await supabase
    .from('rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('player_id', playerId);

  if (error) {
    console.error('Error deleting RSVP:', error);
    throw error;
  }
}

/**
 * Get RSVP summary for an event
 */
export async function getRSVPSummary(eventId: string): Promise<{
  attending: number;
  not_attending: number;
  maybe: number;
  pending: number;
  total: number;
}> {
  const rsvps = await getEventRSVPs(eventId);

  const summary = {
    attending: rsvps.filter((r) => r.status === 'attending').length,
    not_attending: rsvps.filter((r) => r.status === 'not_attending').length,
    maybe: rsvps.filter((r) => r.status === 'maybe').length,
    pending: rsvps.filter((r) => r.status === 'pending').length,
    total: rsvps.length,
  };

  return summary;
}
