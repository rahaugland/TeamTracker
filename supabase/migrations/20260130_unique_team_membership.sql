-- Remove duplicate active memberships, keeping the earliest one per player+team
DELETE FROM team_memberships
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY player_id, team_id ORDER BY joined_at ASC, created_at ASC) AS rn
    FROM team_memberships
    WHERE is_active = true
  ) numbered
  WHERE rn > 1
);

-- Prevent duplicate active team memberships for the same player+team
CREATE UNIQUE INDEX idx_team_memberships_unique_active
  ON team_memberships(player_id, team_id)
  WHERE is_active = true;
