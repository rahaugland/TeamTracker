-- Auto-create pending RSVP records when a player joins a team
-- (for all upcoming events in that team)
CREATE OR REPLACE FUNCTION create_rsvps_for_new_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO rsvps (event_id, player_id, status, responded_by, responded_at)
  SELECT e.id, NEW.player_id, 'pending', NEW.player_id, NOW()
  FROM events e
  WHERE e.team_id = NEW.team_id
    AND e.start_time >= NOW()
  ON CONFLICT (event_id, player_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_rsvps_for_new_member
  AFTER INSERT ON team_memberships
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION create_rsvps_for_new_member();

-- Auto-create pending RSVP records when a new event is created
-- (for all active members of that team)
CREATE OR REPLACE FUNCTION create_rsvps_for_new_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO rsvps (event_id, player_id, status, responded_by, responded_at)
  SELECT NEW.id, tm.player_id, 'pending', tm.player_id, NOW()
  FROM team_memberships tm
  WHERE tm.team_id = NEW.team_id
    AND tm.is_active = true
  ON CONFLICT (event_id, player_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_rsvps_for_new_event
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_rsvps_for_new_event();
