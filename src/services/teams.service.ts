import { supabase } from '@/lib/supabase';
import { withErrorHandling } from '@/lib/api-error-handler';
import type { Team, CoachAssignment, Season } from '@/types/database.types';

/**
 * Team service
 * Handles all Supabase operations for teams and coach assignments
 */

export interface CreateTeamInput {
  name: string;
  season_id: string;
}

export interface UpdateTeamInput {
  name?: string;
  season_id?: string;
}

export interface TeamWithSeason extends Team {
  season: Season;
}

export interface TeamWithDetails extends Team {
  season: Season;
  coach_assignments: CoachAssignment[];
}

/**
 * Generate a unique 6-character alphanumeric invite code
 * Format: uppercase letters + numbers (e.g., "ABC123", "XY7K9M")
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a unique invite code by checking for collisions
 */
async function generateUniqueInviteCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateInviteCode();

    // Check if code already exists
    const { data, error } = await supabase
      .from('teams')
      .select('id')
      .eq('invite_code', code)
      .maybeSingle();

    if (error) {
      console.error('Error checking invite code uniqueness:', error);
      throw error;
    }

    // If no existing team has this code, we can use it
    if (!data) {
      return code;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique invite code after multiple attempts');
}

/**
 * Get all teams for a specific season
 */
export async function getTeamsBySeason(seasonId: string): Promise<TeamWithSeason[]> {
  return withErrorHandling(
    async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          season:seasons(*)
        `)
        .eq('season_id', seasonId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    { operation: 'getTeamsBySeason', retry: true }
  );
}

/**
 * Get all teams (optionally filtered by season)
 */
export async function getTeams(seasonId?: string): Promise<TeamWithSeason[]> {
  return withErrorHandling(
    async () => {
      let query = supabase.from('teams').select(`
          *,
          season:seasons(*)
        `);

      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data || [];
    },
    { operation: 'getTeams', retry: true }
  );
}

/**
 * Get a single team by ID with full details
 */
export async function getTeam(id: string): Promise<TeamWithDetails | null> {
  return withErrorHandling(
    async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          season:seasons(*),
          coach_assignments(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    { operation: 'getTeam', retry: true }
  );
}

/**
 * Get teams assigned to a specific coach
 */
export async function getCoachTeams(coachId: string): Promise<TeamWithSeason[]> {
  const { data, error } = await supabase
    .from('coach_assignments')
    .select(`
      team:teams(
        *,
        season:seasons(*)
      )
    `)
    .eq('coach_id', coachId);

  if (error) {
    console.error('Error fetching coach teams:', error);
    throw error;
  }

  return (data?.map((item: any) => item.team).filter(Boolean) as TeamWithSeason[]) || [];
}

/**
 * Create a new team with auto-generated invite code
 */
export async function createTeam(input: CreateTeamInput): Promise<Team> {
  return withErrorHandling(
    async () => {
      const inviteCode = await generateUniqueInviteCode();

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: input.name,
          season_id: input.season_id,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    { operation: 'createTeam' }
  );
}

/**
 * Update a team
 */
export async function updateTeam(id: string, input: UpdateTeamInput): Promise<Team> {
  return withErrorHandling(
    async () => {
      const { data, error } = await supabase
        .from('teams')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    { operation: 'updateTeam' }
  );
}

/**
 * Delete a team
 * Note: This will cascade delete all related data
 */
export async function deleteTeam(id: string): Promise<void> {
  return withErrorHandling(
    async () => {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
    },
    { operation: 'deleteTeam' }
  );
}

/**
 * Assign a coach to a team
 */
export async function assignCoach(
  teamId: string,
  coachId: string,
  role: 'head_coach' | 'assistant_coach'
): Promise<CoachAssignment> {
  const { data, error } = await supabase
    .from('coach_assignments')
    .insert({
      team_id: teamId,
      coach_id: coachId,
      role,
    })
    .select()
    .single();

  if (error) {
    console.error('Error assigning coach:', error);
    throw error;
  }

  return data;
}

/**
 * Remove a coach from a team
 */
export async function removeCoach(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('coach_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    console.error('Error removing coach:', error);
    throw error;
  }
}

/**
 * Get coach assignments for a team
 */
export async function getTeamCoaches(teamId: string): Promise<CoachAssignment[]> {
  const { data, error } = await supabase
    .from('coach_assignments')
    .select('*')
    .eq('team_id', teamId);

  if (error) {
    console.error('Error fetching team coaches:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get team by invite code
 */
export async function getTeamByInviteCode(code: string): Promise<TeamWithSeason | null> {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      season:seasons(*)
    `)
    .eq('invite_code', code.toUpperCase())
    .maybeSingle();

  if (error) {
    console.error('Error fetching team by invite code:', error);
    throw error;
  }

  return data;
}

/**
 * Join a team by invite code using an atomic RPC.
 * Creates player record (or reuses existing) + team membership in one call.
 * Bypasses RLS via SECURITY DEFINER.
 */
export async function joinTeamByCode(
  inviteCode: string,
  playerName: string,
  playerEmail?: string
): Promise<{ player_id: string; team_id: string; membership_id: string }> {
  const { data, error } = await supabase.rpc('join_team_by_code', {
    p_invite_code: inviteCode,
    p_player_name: playerName,
    p_player_email: playerEmail ?? null,
  });

  if (error) throw error;
  return data;
}

/**
 * Regenerate invite code for a team
 */
export async function regenerateInviteCode(teamId: string): Promise<Team> {
  const newCode = await generateUniqueInviteCode();

  const { data, error } = await supabase
    .from('teams')
    .update({
      invite_code: newCode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', teamId)
    .select()
    .single();

  if (error) {
    console.error('Error regenerating invite code:', error);
    throw error;
  }

  return data;
}
