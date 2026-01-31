-- TeamTracker Remaining Schema (types already created)
-- Run this after the initial profiles setup

-- Custom types (skip user_role as it exists)
CREATE TYPE event_type AS ENUM ('practice', 'game', 'tournament', 'meeting', 'other');
CREATE TYPE rsvp_status AS ENUM ('attending', 'not_attending', 'maybe', 'pending');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE team_membership_role AS ENUM ('player', 'captain');
CREATE TYPE departure_reason AS ENUM ('quit', 'injury', 'cut', 'other');
CREATE TYPE practice_block_type AS ENUM ('warmup', 'drill', 'scrimmage', 'cooldown', 'break', 'custom');
CREATE TYPE volleyball_position AS ENUM ('setter', 'outside_hitter', 'middle_blocker', 'opposite', 'libero', 'defensive_specialist');

-- ============================================
-- SEASON & TEAM TABLES
-- ============================================

CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    archived BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
    created_by UUID REFERENCES profiles(id),
    is_system_drill BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (max_players IS NULL OR min_players IS NULL OR max_players >= min_players)
);

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
-- INDEXES
-- ============================================

CREATE INDEX idx_seasons_active ON seasons(is_active) WHERE is_active = true;
CREATE INDEX idx_teams_season ON teams(season_id);
CREATE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_players_created_by ON players(created_by);
CREATE INDEX idx_team_memberships_player ON team_memberships(player_id);
CREATE INDEX idx_team_memberships_team ON team_memberships(team_id);
CREATE INDEX idx_team_memberships_active ON team_memberships(is_active) WHERE is_active = true;
CREATE INDEX idx_coach_notes_player ON coach_notes(player_id);
CREATE INDEX idx_events_team ON events(team_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_attendance_event ON attendance_records(event_id);
CREATE INDEX idx_drills_skill_tags ON drills USING GIN(skill_tags);
CREATE INDEX idx_drills_progression ON drills(progression_level);
CREATE INDEX idx_practice_plans_team ON practice_plans(team_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_executions ENABLE ROW LEVEL SECURITY;

-- Coaches can do everything (simplified for MVP)
CREATE POLICY "Coaches have full access to seasons" ON seasons
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

CREATE POLICY "Coaches have full access to teams" ON teams
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

CREATE POLICY "Coaches have full access to coach_assignments" ON coach_assignments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

CREATE POLICY "Coaches have full access to players" ON players
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

CREATE POLICY "Coaches have full access to team_memberships" ON team_memberships
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

CREATE POLICY "Coaches have full access to coach_notes" ON coach_notes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

CREATE POLICY "Coaches have full access to events" ON events
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

CREATE POLICY "Coaches have full access to rsvps" ON rsvps
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

CREATE POLICY "Coaches have full access to attendance_records" ON attendance_records
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

CREATE POLICY "Coaches have full access to drills" ON drills
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

CREATE POLICY "Coaches have full access to practice_plans" ON practice_plans
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

CREATE POLICY "Coaches have full access to practice_blocks" ON practice_blocks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

CREATE POLICY "Coaches have full access to drill_executions" ON drill_executions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

-- Players can view their team's data
CREATE POLICY "Players can view their teams" ON teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_memberships tm
            JOIN players p ON tm.player_id = p.id
            WHERE tm.team_id = teams.id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Players can view events" ON events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_memberships tm
            JOIN players p ON tm.player_id = p.id
            WHERE tm.team_id = events.team_id AND p.user_id = auth.uid()
        )
    );

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
