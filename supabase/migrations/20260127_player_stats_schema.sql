-- Migration: Add player stats page schema changes
-- Date: 2026-01-27
-- Description: Add opponent_tier to events and serve_attempts to stat_entries

-- Add opponent_tier column to events table
ALTER TABLE events
ADD COLUMN opponent_tier SMALLINT CHECK (opponent_tier BETWEEN 1 AND 5);

COMMENT ON COLUMN events.opponent_tier IS 'Opponent strength rating (1-5 stars), used for adjusting player ratings';

-- Add serve_attempts column to stat_entries table
ALTER TABLE stat_entries
ADD COLUMN serve_attempts INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN stat_entries.serve_attempts IS 'Total number of serve attempts (used for serve percentage calculation)';

-- Create index for better performance on stat queries
CREATE INDEX idx_stat_entries_player_event ON stat_entries(player_id, event_id);
CREATE INDEX idx_stat_entries_event ON stat_entries(event_id);

-- Create index for events with opponent_tier (for filtering competitive games)
CREATE INDEX idx_events_opponent_tier ON events(opponent_tier) WHERE opponent_tier IS NOT NULL;
