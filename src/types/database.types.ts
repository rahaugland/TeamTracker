// Auto-generated TypeScript types for Supabase database schema

export type UserRole = 'head_coach' | 'assistant_coach' | 'player' | 'parent';
export type EventType = 'practice' | 'game' | 'tournament' | 'meeting' | 'other';
export type RsvpStatus = 'attending' | 'not_attending' | 'maybe' | 'pending';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'not_selected';
export type TeamMembershipRole = 'player' | 'captain';
export type DepartureReason = 'quit' | 'injury' | 'cut' | 'other';
export type PracticeBlockType = 'warmup' | 'drill' | 'scrimmage' | 'cooldown' | 'break' | 'custom';
export type VolleyballPosition =
  | 'setter'
  | 'outside_hitter'
  | 'middle_blocker'
  | 'opposite'
  | 'libero'
  | 'defensive_specialist'
  | 'all_around';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ParentChildLink {
  id: string;
  parent_id: string;
  child_id: string;
  created_at: string;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  season_id: string;
  invite_code?: string;
  created_at: string;
  updated_at: string;
}

export interface CoachAssignment {
  id: string;
  team_id: string;
  coach_id: string;
  role: 'head_coach' | 'assistant_coach';
  assigned_at: string;
}

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  positions: VolleyballPosition[];
  photo_url?: string;
  user_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type TeamMembershipStatus = 'pending' | 'active' | 'rejected';

export interface TeamMembership {
  id: string;
  player_id: string;
  team_id: string;
  role: TeamMembershipRole;
  jersey_number?: number;
  joined_at: string;
  left_at?: string;
  departure_reason?: DepartureReason;
  is_active: boolean;
  status?: TeamMembershipStatus;
  created_at: string;
  updated_at: string;
}

export interface CoachNote {
  id: string;
  player_id: string;
  author_id: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  team_id: string;
  type: EventType;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  opponent?: string;
  opponent_tier?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  notes?: string;
  practice_plan_id?: string;
  sets_won?: number;
  sets_lost?: number;
  set_scores?: number[][];
  is_finalized: boolean;
  finalized_at?: string;
  finalized_by?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type GameAwardType = 'mvp' | 'top_attacker' | 'top_server' | 'top_defender' | 'top_passer';

export interface GameAward {
  id: string;
  event_id: string;
  player_id: string;
  award_type: GameAwardType;
  award_value?: number;
  created_at: string;
}

export interface TeamSeason {
  id: string;
  team_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_finalized: boolean;
  finalized_at?: string;
  created_by: string;
  created_at: string;
}

export type SeasonAwardType =
  | 'season_mvp'
  | 'most_improved'
  | 'best_attendance'
  | 'top_attacker'
  | 'top_server'
  | 'top_defender'
  | 'top_passer'
  | 'most_practices';

export interface SeasonAward {
  id: string;
  season_id: string;
  player_id: string;
  award_type: SeasonAwardType;
  award_value?: number;
  description?: string;
  created_at: string;
}

export interface Rsvp {
  id: string;
  event_id: string;
  player_id: string;
  status: RsvpStatus;
  responded_by: string | null;
  responded_at: string;
  note?: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  event_id: string;
  player_id: string;
  status: AttendanceStatus;
  arrived_at?: string;
  left_at?: string;
  notes?: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export interface Drill {
  id: string;
  name: string;
  description: string;
  skill_tags: string[];
  custom_tags: string[];
  progression_level: 1 | 2 | 3 | 4 | 5;
  parent_drill_id?: string;
  min_players?: number;
  max_players?: number;
  equipment_needed: string[];
  duration_minutes?: number;
  video_url?: string;
  created_by: string;
  is_system_drill: boolean;
  created_at: string;
  updated_at: string;
}

export interface PracticePlan {
  id: string;
  name: string;
  team_id: string;
  date?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PracticeBlock {
  id: string;
  practice_plan_id: string;
  order_index: number;
  type: PracticeBlockType;
  drill_id?: string;
  custom_title?: string;
  duration_minutes: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DrillExecution {
  id: string;
  drill_id: string;
  event_id: string;
  team_id: string;
  executed_at: string;
  duration_minutes: number;
  coach_rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  recorded_by: string;
  created_at: string;
}

export interface StatEntry {
  id: string;
  player_id: string;
  event_id: string;
  kills: number;
  attack_errors: number;
  attack_attempts: number;
  aces: number;
  service_errors: number;
  serve_attempts: number;
  digs: number;
  block_solos: number;
  block_assists: number;
  ball_handling_errors: number;
  pass_attempts: number;
  pass_sum: number;
  pass_ratings_by_zone?: Record<string, { attempts: number; sum: number }>;
  block_touches: number;
  set_attempts: number;
  set_sum: number;
  setting_errors: number;
  rotation?: 1 | 2 | 3 | 4 | 5 | 6;
  sets_played: number;
  rotations_played: number;
  recorded_by: string;
  recorded_at: string;
  updated_at: string;
}

export type GoalMetricType = 'kill_pct' | 'pass_rating' | 'serve_pct' | 'attendance' | 'custom';

export interface PlayerGoal {
  id: string;
  player_id: string;
  team_id: string;
  title: string;
  description?: string;
  metric_type: GoalMetricType;
  target_value: number;
  current_value: number;
  deadline?: string;
  is_completed: boolean;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type SkillRatingType = 'serve' | 'pass' | 'attack' | 'block' | 'set' | 'defense';

export interface Announcement {
  id: string;
  team_id: string;
  author_id: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
}

export interface PlayerFeedback {
  id: string;
  player_id: string;
  event_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface PlayerReview {
  id: string;
  player_id: string;
  team_id: string;
  season_id?: string;
  author_id: string;
  strengths: string;
  areas_to_improve: string;
  goals_text: string;
  created_at: string;
}

export interface SkillRating {
  id: string;
  player_id: string;
  team_id: string;
  author_id: string;
  skill_type: SkillRatingType;
  rating: number;
  rated_at: string;
}

export interface SelfAssessment {
  id: string;
  player_id: string;
  event_id: string;
  rating: number;
  notes?: string;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface SyncLogEntry {
  id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  sync_timestamp: string;
  device_id?: string;
}

export interface MatchRoster {
  id: string;
  event_id: string;
  player_id: string;
  selected_by: string;
  selected_at: string;
}

export interface ClaimToken {
  id: string;
  token: string;
  player_id: string;
  team_id: string;
  created_by: string;
  expires_at: string;
  claimed_at?: string;
  claimed_by?: string;
  created_at: string;
}

// Skill tags (system-defined)
export const SKILL_TAGS = [
  'passing',
  'setting',
  'hitting',
  'blocking',
  'serving',
  'serve-receive',
  'defense',
  'transition',
  'footwork',
  'conditioning',
] as const;

export type SkillTag = typeof SKILL_TAGS[number];

// Position display names
export const POSITION_NAMES: Record<VolleyballPosition, string> = {
  setter: 'Setter',
  outside_hitter: 'Outside Hitter',
  middle_blocker: 'Middle Blocker',
  opposite: 'Opposite',
  libero: 'Libero',
  defensive_specialist: 'Defensive Specialist',
  all_around: 'All Around',
};

// Role display names
export const ROLE_NAMES: Record<UserRole, string> = {
  head_coach: 'Head Coach',
  assistant_coach: 'Assistant Coach',
  player: 'Player',
  parent: 'Parent',
};
