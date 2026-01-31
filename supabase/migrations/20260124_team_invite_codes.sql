-- Add invite codes to teams
-- This migration adds an invite_code column to teams table for player/parent join flow

-- Add invite_code column with unique constraint
ALTER TABLE teams ADD COLUMN invite_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_teams_invite_code ON teams(invite_code);

-- Add comment
COMMENT ON COLUMN teams.invite_code IS 'Unique 6-character alphanumeric code for players/parents to join team';
