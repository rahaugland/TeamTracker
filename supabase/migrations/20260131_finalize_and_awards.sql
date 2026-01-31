-- Finalization flag on events
ALTER TABLE events ADD COLUMN is_finalized BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN finalized_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN finalized_by UUID REFERENCES profiles(id);

-- Match awards (per game)
CREATE TABLE game_awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    award_type TEXT NOT NULL,
    award_value NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_game_awards_event ON game_awards(event_id);
CREATE UNIQUE INDEX idx_game_awards_unique ON game_awards(event_id, award_type);

-- Team seasons (coach-created seasons per team)
CREATE TABLE team_seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_finalized BOOLEAN NOT NULL DEFAULT false,
    finalized_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_team_seasons_team ON team_seasons(team_id);

-- Season awards
CREATE TABLE season_awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES team_seasons(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    award_type TEXT NOT NULL,
    award_value NUMERIC,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_season_awards_season ON season_awards(season_id);
CREATE UNIQUE INDEX idx_season_awards_unique ON season_awards(season_id, award_type);
