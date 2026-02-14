import { supabase } from '@/lib/supabase';
import type { Event, EventType, GameAward } from '@/types/database.types';
import { getStatEntriesForEvent } from '@/services/player-stats.service';
import { calculateMatchAwards, saveGameAwards } from '@/services/game-awards.service';


/**
 * Event service
 * Handles all Supabase operations for events
 */

export interface CreateEventInput {
  team_id: string;
  type: EventType;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  opponent?: string;
  opponent_tier?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  notes?: string;
  sets_won?: number;
  sets_lost?: number;
  set_scores?: number[][];
  created_by: string;
}

export interface UpdateEventInput {
  type?: EventType;
  title?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  opponent?: string;
  opponent_tier?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  notes?: string;
  sets_won?: number;
  sets_lost?: number;
  set_scores?: number[][];
  is_finalized?: boolean;
}

export interface EventWithDetails extends Event {
  team: {
    id: string;
    name: string;
  };
}

/**
 * Get all events for a team
 */
export async function getEventsByTeam(teamId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('team_id', teamId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single event by ID with details
 */
export async function getEvent(id: string): Promise<EventWithDetails | null> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      team:teams(
        id,
        name
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    throw error;
  }

  return data;
}

/**
 * Get events filtered by type
 */
export async function getEventsByType(
  teamId: string,
  type: EventType
): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('team_id', teamId)
    .eq('type', type)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching events by type:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get upcoming events for a team
 */
export async function getUpcomingEvents(teamId: string): Promise<Event[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('team_id', teamId)
    .gte('start_time', now)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming events:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get past events for a team
 */
export async function getPastEvents(teamId: string): Promise<Event[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('team_id', teamId)
    .lt('end_time', now)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching past events:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new event
 */
export async function createEvent(input: CreateEventInput): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      team_id: input.team_id,
      type: input.type,
      title: input.title,
      start_time: input.start_time,
      end_time: input.end_time,
      location: input.location,
      opponent: input.opponent,
      opponent_tier: input.opponent_tier,
      notes: input.notes,
      sets_won: input.sets_won,
      sets_lost: input.sets_lost,
      set_scores: input.set_scores,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }

  return data;
}

/**
 * Update an event
 */
export async function updateEvent(
  id: string,
  input: UpdateEventInput
): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }

  return data;
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

/**
 * Create multiple recurring events
 */
export async function createRecurringEvents(
  input: CreateEventInput,
  recurringDays: number[],
  recurringWeeks: number
): Promise<Event[]> {
  const startDate = new Date(input.start_time);
  const endDate = new Date(input.end_time);
  const duration = endDate.getTime() - startDate.getTime();

  const events: CreateEventInput[] = [];

  // Generate events for each selected day of the week
  for (let week = 0; week < recurringWeeks; week++) {
    recurringDays.forEach((dayOfWeek) => {
      const eventDate = new Date(startDate);
      eventDate.setDate(eventDate.getDate() - eventDate.getDay() + dayOfWeek + (week * 7));

      // Only create events on or after the original start date
      if (eventDate >= startDate) {
        const eventStartTime = new Date(eventDate);
        const eventEndTime = new Date(eventStartTime.getTime() + duration);

        events.push({
          ...input,
          start_time: eventStartTime.toISOString(),
          end_time: eventEndTime.toISOString(),
        });
      }
    });
  }

  // Sort events chronologically
  events.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  if (events.length === 0) {
    return [];
  }

  // Remove undefined values before inserting
  const cleanEvents = events.map(e =>
    Object.fromEntries(Object.entries(e).filter(([, v]) => v !== undefined))
  );

  // Insert all events in batch
  const { data, error } = await supabase
    .from('events')
    .insert(cleanEvents)
    .select();

  if (error) {
    console.error('Error creating recurring events:', error);
    throw error;
  }

  return data || [];
}

/**
 * Finalize a game: calculate awards, save them, lock the event
 */
export async function finalizeGame(eventId: string, userId: string): Promise<GameAward[]> {
  const statEntries = await getStatEntriesForEvent(eventId);
  const calculatedAwards = calculateMatchAwards(statEntries);

  // Save awards and update event in parallel (independent operations)
  const [savedAwards, updateResult] = await Promise.all([
    saveGameAwards(eventId, calculatedAwards),
    supabase
      .from('events')
      .update({
        is_finalized: true,
        finalized_at: new Date().toISOString(),
        finalized_by: userId,
      })
      .eq('id', eventId),
  ]);

  if (updateResult.error) {
    console.error('Error finalizing game:', updateResult.error);
    throw updateResult.error;
  }

  return savedAwards;
}
