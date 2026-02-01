-- Add status column to team_memberships for coach approval workflow
ALTER TABLE team_memberships
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
  CONSTRAINT team_memberships_status_check CHECK (status IN ('pending', 'active', 'rejected'));

-- Existing rows are already 'active' via the default

-- Update the RSVP trigger function to only fire for active members
CREATE OR REPLACE FUNCTION fn_create_rsvps_for_new_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create RSVPs when member becomes active (not pending)
  IF NEW.status = 'active' AND NEW.is_active = true THEN
    INSERT INTO rsvps (event_id, player_id, status, responded_by, responded_at)
    SELECT
      e.id,
      NEW.player_id,
      'pending',
      NEW.player_id,
      NOW()
    FROM events e
    WHERE e.team_id = NEW.team_id
      AND e.start_time > NOW()
    ON CONFLICT (event_id, player_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to fire on both INSERT and UPDATE (for approval flow)
DROP TRIGGER IF EXISTS trg_create_rsvps_for_new_member ON team_memberships;
CREATE TRIGGER trg_create_rsvps_for_new_member
  AFTER INSERT OR UPDATE OF status ON team_memberships
  FOR EACH ROW
  EXECUTE FUNCTION fn_create_rsvps_for_new_member();
