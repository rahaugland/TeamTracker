import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types/database.types';

/**
 * User service
 * Handles all Supabase operations for user and profile management
 */

export interface UserWithTeams extends Profile {
  coach_assignments?: Array<{
    id: string;
    team_id: string;
    role: 'head_coach' | 'assistant_coach';
    team: {
      id: string;
      name: string;
      season: {
        id: string;
        name: string;
      };
    };
  }>;
  players?: Array<{
    id: string;
    team_memberships: Array<{
      id: string;
      team_id: string;
      role: 'player' | 'captain';
      is_active: boolean;
      team: {
        id: string;
        name: string;
        season: {
          id: string;
          name: string;
        };
      };
    }>;
  }>;
  // Flattened from players->team_memberships for backward compatibility
  team_memberships?: Array<{
    id: string;
    team_id: string;
    role: 'player' | 'captain';
    is_active: boolean;
    team: {
      id: string;
      name: string;
      season: {
        id: string;
        name: string;
      };
    };
  }>;
}

export interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

/**
 * Get all users (profiles)
 * Optionally filter by role
 */
export async function getAllUsers(roleFilter?: UserRole): Promise<UserWithTeams[]> {
  let query = supabase
    .from('profiles')
    .select(`
      *,
      coach_assignments(
        id,
        team_id,
        role,
        team:teams(
          id,
          name,
          season:seasons(id, name)
        )
      ),
      players!players_user_id_fkey(
        id,
        team_memberships(
          id,
          team_id,
          role,
          is_active,
          team:teams(
            id,
            name,
            season:seasons(id, name)
          )
        )
      )
    `)
    .order('full_name');

  if (roleFilter) {
    query = query.eq('role', roleFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  // Flatten players->team_memberships into top-level team_memberships
  return (data || []).map((user) => ({
    ...user,
    team_memberships: user.players?.flatMap((p: { team_memberships: unknown[] }) => p.team_memberships) || [],
  }));
}

/**
 * Get a single user by ID with team information
 */
export async function getUserById(userId: string): Promise<UserWithTeams | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      coach_assignments(
        id,
        team_id,
        role,
        team:teams(
          id,
          name,
          season:seasons(id, name)
        )
      ),
      players!players_user_id_fkey(
        id,
        team_memberships(
          id,
          team_id,
          role,
          is_active,
          team:teams(
            id,
            name,
            season:seasons(id, name)
          )
        )
      )
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    throw error;
  }

  if (!data) return null;

  // Flatten players->team_memberships into top-level team_memberships
  return {
    ...data,
    team_memberships: data.players?.flatMap((p: { team_memberships: unknown[] }) => p.team_memberships) || [],
  };
}

/**
 * Update a user's role
 * Only head coaches can call this. Enforced both here and via RLS.
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<Profile> {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Not authenticated');

  if (currentUser.id === userId) {
    throw new Error('Cannot change your own role');
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single();

  if (currentProfile?.role !== 'head_coach') {
    throw new Error('Only head coaches can change user roles');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      role,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }

  return data;
}

/**
 * Update a user's profile information
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  return data;
}

/**
 * Remove a user from a team (via team membership)
 * This marks the membership as inactive
 */
export async function removeUserFromTeam(membershipId: string): Promise<void> {
  const { error } = await supabase
    .from('team_memberships')
    .update({
      is_active: false,
      left_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', membershipId);

  if (error) {
    console.error('Error removing user from team:', error);
    throw error;
  }
}

/**
 * Remove a coach from a team (via coach assignment)
 */
export async function removeCoachFromTeam(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('coach_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    console.error('Error removing coach from team:', error);
    throw error;
  }
}

/**
 * Search users by name or email
 */
export async function searchUsers(searchTerm: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .order('full_name');

  if (error) {
    console.error('Error searching users:', error);
    throw error;
  }

  return data || [];
}
