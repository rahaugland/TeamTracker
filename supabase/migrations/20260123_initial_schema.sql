-- TeamTracker Initial Database Schema
-- This migration creates all tables and relationships for the MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('head_coach', 'assistant_coach', 'player', 'parent');
CREATE TYPE event_type AS ENUM ('practice', 'game', 'tournament', 'meeting', 'other');
CREATE TYPE rsvp_status AS ENUM ('attending', 'not_attending', 'maybe', 'pending');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE team_membership_role AS ENUM ('player', 'captain');
CREATE TYPE departure_reason AS ENUM ('quit', 'injury', 'cut', 'other');
CREATE TYPE practice_block_type AS ENUM ('warmup', 'drill', 'scrimmage', 'cooldown', 'break', 'custom');
CREATE TYPE volleyball_position AS ENUM ('setter', 'outside_hitter', 'middle_blocker', 'opposite', 'libero', 'defensive_specialist');

-- ============================================
-- USER MANAGEMENT TABLES
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'player',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Parent-child relationships
CREATE TABLE parent_child_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(parent_id, child_id),
    CHECK (parent_id != child_id)
);

-- ============================================
-- SEASON & TEAM TABLES
-- ============================================

-- Seasons
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

-- Teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coach assignments to teams
CREATE TABLE coach_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL CHECK (role IN ('head_coach', 'assistant_coach')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, coach_id)
);

-- ============================================
-- PLAYER TABLES
-- ============================================

-- Players (core entity, continuous across seasons)
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    birth_date DATE,
    positions volleyball_position[] DEFAULT '{}',
    photo_url TEXT,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team memberships (links players to teams with history)
CREATE TABLE team_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role team_membership_role NOT NULL DEFAULT 'player',
    jersey_number INTEGER,
    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    left_at DATE,
    departure_reason departure_reason,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (left_at IS NULL OR left_at >= joined_at)
);

-- Coach notes (private, coach-only)
CREATE TABLE coach_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- EVENT & ATTENDANCE TABLES
-- ============================================

-- Events (practices, games, etc.)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    type event_type NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    opponent TEXT,
    notes TEXT,
    practice_plan_id UUID,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

-- RSVPs (pre-event responses)
CREATE TABLE rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status rsvp_status NOT NULL DEFAULT 'pending',
    responded_by UUID NOT NULL REFERENCES profiles(id),
    responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, player_id)
);

-- Attendance records (post-event actuals)
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status attendance_status NOT NULL,
    arrived_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, player_id),
    CHECK (left_at IS NULL OR arrived_at IS NULL OR left_at >= arrived_at)
);

-- ============================================
-- DRILL & PRACTICE PLANNING TABLES
-- ============================================

-- Drills (library of exercises)
CREATE TABLE drills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    skill_tags TEXT[] NOT NULL DEFAULT '{}',
    custom_tags TEXT[] DEFAULT '{}',
    progression_level INTEGER NOT NULL DEFAULT 1 CHECK (progression_level BETWEEN 1 AND 5),
    parent_drill_id UUID REFERENCES drills(id) ON DELETE SET NULL,
    min_players INTEGER,
    max_players INTEGER,
    equipment_needed TEXT[] DEFAULT '{}',
    duration_minutes INTEGER,
    video_url TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    is_system_drill BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (max_players IS NULL OR min_players IS NULL OR max_players >= min_players)
);

-- Practice plans
CREATE TABLE practice_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    date DATE,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Practice blocks (segments within a practice plan)
CREATE TABLE practice_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_plan_id UUID NOT NULL REFERENCES practice_plans(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    type practice_block_type NOT NULL,
    drill_id UUID REFERENCES drills(id) ON DELETE SET NULL,
    custom_title TEXT,
    duration_minutes INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drill executions (tracking when drills are performed)
CREATE TABLE drill_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drill_id UUID NOT NULL REFERENCES drills(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER NOT NULL,
    coach_rating INTEGER CHECK (coach_rating BETWEEN 1 AND 5),
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- GAME STATISTICS (Phase 2 - schema ready, not implemented in MVP UI)
-- ============================================

CREATE TABLE stat_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

    -- Basic box score
    kills INTEGER NOT NULL DEFAULT 0,
    attack_errors INTEGER NOT NULL DEFAULT 0,
    attack_attempts INTEGER NOT NULL DEFAULT 0,
    aces INTEGER NOT NULL DEFAULT 0,
    service_errors INTEGER NOT NULL DEFAULT 0,
    digs INTEGER NOT NULL DEFAULT 0,
    block_solos INTEGER NOT NULL DEFAULT 0,
    block_assists INTEGER NOT NULL DEFAULT 0,
    ball_handling_errors INTEGER NOT NULL DEFAULT 0,

    -- Serve receive
    pass_attempts INTEGER NOT NULL DEFAULT 0,
    pass_sum INTEGER NOT NULL DEFAULT 0,

    -- Optional detailed zone data (JSON for flexibility)
    pass_ratings_by_zone JSONB,

    recorded_by UUID NOT NULL REFERENCES profiles(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SYNC TRACKING (for offline-first sync)
-- ============================================

CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    sync_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id TEXT
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Seasons
CREATE INDEX idx_seasons_active ON seasons(is_active) WHERE is_active = true;
CREATE INDEX idx_seasons_archived ON seasons(archived);

-- Teams
CREATE INDEX idx_teams_season ON teams(season_id);

-- Players
CREATE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_players_created_by ON players(created_by);

-- Team memberships
CREATE INDEX idx_team_memberships_player ON team_memberships(player_id);
CREATE INDEX idx_team_memberships_team ON team_memberships(team_id);
CREATE INDEX idx_team_memberships_active ON team_memberships(is_active) WHERE is_active = true;

-- Coach notes
CREATE INDEX idx_coach_notes_player ON coach_notes(player_id);
CREATE INDEX idx_coach_notes_author ON coach_notes(author_id);
CREATE INDEX idx_coach_notes_tags ON coach_notes USING GIN(tags);

-- Events
CREATE INDEX idx_events_team ON events(team_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_practice_plan ON events(practice_plan_id);

-- RSVPs
CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_rsvps_player ON rsvps(player_id);
CREATE INDEX idx_rsvps_status ON rsvps(status);

-- Attendance
CREATE INDEX idx_attendance_event ON attendance_records(event_id);
CREATE INDEX idx_attendance_player ON attendance_records(player_id);
CREATE INDEX idx_attendance_status ON attendance_records(status);

-- Drills
CREATE INDEX idx_drills_skill_tags ON drills USING GIN(skill_tags);
CREATE INDEX idx_drills_custom_tags ON drills USING GIN(custom_tags);
CREATE INDEX idx_drills_progression ON drills(progression_level);
CREATE INDEX idx_drills_parent ON drills(parent_drill_id);
CREATE INDEX idx_drills_system ON drills(is_system_drill);

-- Practice plans
CREATE INDEX idx_practice_plans_team ON practice_plans(team_id);
CREATE INDEX idx_practice_plans_date ON practice_plans(date);

-- Practice blocks
CREATE INDEX idx_practice_blocks_plan ON practice_blocks(practice_plan_id);
CREATE INDEX idx_practice_blocks_drill ON practice_blocks(drill_id);
CREATE INDEX idx_practice_blocks_order ON practice_blocks(order_index);

-- Drill executions
CREATE INDEX idx_drill_executions_drill ON drill_executions(drill_id);
CREATE INDEX idx_drill_executions_event ON drill_executions(event_id);
CREATE INDEX idx_drill_executions_team ON drill_executions(team_id);
CREATE INDEX idx_drill_executions_executed_at ON drill_executions(executed_at);

-- Stats
CREATE INDEX idx_stat_entries_player ON stat_entries(player_id);
CREATE INDEX idx_stat_entries_event ON stat_entries(event_id);

-- Sync log
CREATE INDEX idx_sync_log_user ON sync_log(user_id);
CREATE INDEX idx_sync_log_timestamp ON sync_log(sync_timestamp);
CREATE INDEX idx_sync_log_table_record ON sync_log(table_name, record_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_memberships_updated_at BEFORE UPDATE ON team_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_notes_updated_at BEFORE UPDATE ON coach_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drills_updated_at BEFORE UPDATE ON drills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_plans_updated_at BEFORE UPDATE ON practice_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_blocks_updated_at BEFORE UPDATE ON practice_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stat_entries_updated_at BEFORE UPDATE ON stat_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
