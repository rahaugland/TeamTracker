-- Migration: Fix orphaned players by creating team memberships
-- This fixes players that were imported via attendance data but never added to team_memberships
-- Date: 2026-01-25

-- Create team memberships for players who have attendance records but no team membership
-- This handles the case where players were imported through the import.service.ts
-- before the fix that automatically adds them to teams

INSERT INTO team_memberships (player_id, team_id, role, is_active, joined_at, created_at, updated_at)
SELECT DISTINCT
    ar.player_id,
    e.team_id,
    'player' as role,
    true as is_active,
    CURRENT_DATE as joined_at,
    NOW() as created_at,
    NOW() as updated_at
FROM attendance_records ar
JOIN events e ON ar.event_id = e.id
WHERE NOT EXISTS (
    -- Only create membership if player doesn't already have one for this team
    SELECT 1
    FROM team_memberships tm
    WHERE tm.player_id = ar.player_id
    AND tm.team_id = e.team_id
    AND tm.is_active = true
)
ON CONFLICT DO NOTHING;

-- Log the number of memberships created
DO $$
DECLARE
    membership_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO membership_count
    FROM team_memberships
    WHERE created_at >= NOW() - INTERVAL '1 second';

    RAISE NOTICE 'Created % team memberships for orphaned players', membership_count;
END $$;
