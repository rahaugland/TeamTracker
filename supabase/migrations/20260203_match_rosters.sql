-- Migration: Match Rosters
-- Description: Table to store selected match rosters for events

-- Table to store selected match rosters
CREATE TABLE match_rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  selected_by UUID NOT NULL REFERENCES profiles(id),
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, player_id)
);

-- Index for faster lookups by event
CREATE INDEX idx_match_rosters_event_id ON match_rosters(event_id);

-- RLS policies
ALTER TABLE match_rosters ENABLE ROW LEVEL SECURITY;

-- Coaches can manage rosters for their team's events
CREATE POLICY "Coaches can manage match rosters"
  ON match_rosters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN coach_assignments ca ON ca.team_id = e.team_id
      WHERE e.id = match_rosters.event_id
        AND ca.coach_id = auth.uid()
    )
  );

-- Players can view rosters for events they're part of
CREATE POLICY "Players can view match rosters"
  ON match_rosters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN team_memberships tm ON tm.team_id = e.team_id
      JOIN players p ON p.id = tm.player_id
      WHERE e.id = match_rosters.event_id
        AND p.user_id = auth.uid()
    )
  );
