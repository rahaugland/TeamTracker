-- Migration: Change opponent tier from 1-5 to 1-9 scale
-- Date: 2026-01-28
-- Description: Update opponent tier constraint to allow 1-9 scale (9 = world class)

-- Drop existing constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_opponent_tier_check;

-- Add new constraint for 1-9 scale
ALTER TABLE events ADD CONSTRAINT events_opponent_tier_check CHECK (opponent_tier BETWEEN 1 AND 9);

-- Update comment
COMMENT ON COLUMN events.opponent_tier IS 'Opponent strength rating (1-9 scale), used for adjusting player ratings. 1=Beginner, 5=Competitive (neutral), 9=World Class';
