-- Deeper Stats & Player Development migration

-- Block touches (separate from stuff blocks)
ALTER TABLE stat_entries ADD COLUMN block_touches INTEGER NOT NULL DEFAULT 0;

-- Rotation tracking (optional, 1-6)
ALTER TABLE stat_entries ADD COLUMN rotation SMALLINT CHECK (rotation BETWEEN 1 AND 6);

-- Playing time per match
ALTER TABLE stat_entries ADD COLUMN sets_played SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE stat_entries ADD COLUMN rotations_played SMALLINT NOT NULL DEFAULT 0;

-- Player goals
CREATE TABLE player_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    metric_type TEXT NOT NULL, -- 'kill_pct','pass_rating','serve_pct','attendance','custom'
    target_value NUMERIC NOT NULL,
    current_value NUMERIC NOT NULL DEFAULT 0,
    deadline DATE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_player_goals_player ON player_goals(player_id);
CREATE INDEX idx_player_goals_team ON player_goals(team_id);
