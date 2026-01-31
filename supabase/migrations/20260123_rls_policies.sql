-- Row Level Security Policies for TeamTracker
-- These policies enforce role-based access control at the database level

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Check if user is a coach (head or assistant) for a specific team
CREATE OR REPLACE FUNCTION is_team_coach(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM coach_assignments ca
        INNER JOIN profiles p ON p.id = ca.coach_id
        WHERE ca.team_id = team_uuid
        AND ca.coach_id = auth.uid()
        AND p.role IN ('head_coach', 'assistant_coach')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a head coach for a specific team
CREATE OR REPLACE FUNCTION is_head_coach(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM coach_assignments ca
        INNER JOIN profiles p ON p.id = ca.coach_id
        WHERE ca.team_id = team_uuid
        AND ca.coach_id = auth.uid()
        AND p.role = 'head_coach'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a player on a specific team
CREATE OR REPLACE FUNCTION is_team_player(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_memberships tm
        INNER JOIN players p ON p.id = tm.player_id
        WHERE tm.team_id = team_uuid
        AND p.user_id = auth.uid()
        AND tm.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a parent of a player on a specific team
CREATE OR REPLACE FUNCTION is_parent_of_team_player(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM parent_child_links pcl
        INNER JOIN players p ON p.user_id = pcl.child_id
        INNER JOIN team_memberships tm ON tm.player_id = p.id
        WHERE tm.team_id = team_uuid
        AND pcl.parent_id = auth.uid()
        AND tm.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get player ID for current user
CREATE OR REPLACE FUNCTION get_player_id_for_user()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM players WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Coaches can view profiles of players/parents on their teams
CREATE POLICY "Coaches can view team member profiles"
    ON profiles FOR SELECT
    USING (
        id IN (
            SELECT p.user_id FROM players p
            INNER JOIN team_memberships tm ON tm.player_id = p.id
            INNER JOIN coach_assignments ca ON ca.team_id = tm.team_id
            WHERE ca.coach_id = auth.uid()
        )
    );

-- ============================================
-- PARENT-CHILD LINKS
-- ============================================

-- Parents can view their own links
CREATE POLICY "Parents can view own links"
    ON parent_child_links FOR SELECT
    USING (parent_id = auth.uid() OR child_id = auth.uid());

-- Coaches can view parent-child links for their team
CREATE POLICY "Coaches can view team parent-child links"
    ON parent_child_links FOR SELECT
    USING (
        child_id IN (
            SELECT p.user_id FROM players p
            INNER JOIN team_memberships tm ON tm.player_id = p.id
            INNER JOIN coach_assignments ca ON ca.team_id = tm.team_id
            WHERE ca.coach_id = auth.uid()
        )
    );

-- Head coaches can manage parent-child links
CREATE POLICY "Head coaches can manage parent-child links"
    ON parent_child_links FOR ALL
    USING (
        child_id IN (
            SELECT p.user_id FROM players p
            INNER JOIN team_memberships tm ON tm.player_id = p.id
            INNER JOIN coach_assignments ca ON ca.team_id = tm.team_id
            INNER JOIN profiles pr ON pr.id = ca.coach_id
            WHERE ca.coach_id = auth.uid() AND pr.role = 'head_coach'
        )
    );

-- ============================================
-- SEASONS
-- ============================================

-- Everyone can view seasons
CREATE POLICY "Anyone can view seasons"
    ON seasons FOR SELECT
    USING (true);

-- Coaches can create seasons
CREATE POLICY "Coaches can create seasons"
    ON seasons FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('head_coach', 'assistant_coach')
        )
    );

-- Head coaches can update/delete seasons
CREATE POLICY "Head coaches can update seasons"
    ON seasons FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'head_coach'
        )
    );

-- ============================================
-- TEAMS
-- ============================================

-- Everyone can view teams they're associated with
CREATE POLICY "View own teams"
    ON teams FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM coach_assignments WHERE team_id = teams.id AND coach_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM team_memberships tm
            INNER JOIN players p ON p.id = tm.player_id
            WHERE tm.team_id = teams.id AND p.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM parent_child_links pcl
            INNER JOIN players p ON p.user_id = pcl.child_id
            INNER JOIN team_memberships tm ON tm.player_id = p.id
            WHERE tm.team_id = teams.id AND pcl.parent_id = auth.uid()
        )
    );

-- Coaches can create teams
CREATE POLICY "Coaches can create teams"
    ON teams FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('head_coach', 'assistant_coach')
        )
    );

-- Head coaches can update/delete teams
CREATE POLICY "Head coaches can manage teams"
    ON teams FOR UPDATE
    USING (is_head_coach(id));

CREATE POLICY "Head coaches can delete teams"
    ON teams FOR DELETE
    USING (is_head_coach(id));

-- ============================================
-- COACH ASSIGNMENTS
-- ============================================

-- View coach assignments for own teams
CREATE POLICY "View own team coach assignments"
    ON coach_assignments FOR SELECT
    USING (
        coach_id = auth.uid()
        OR is_team_coach(team_id)
        OR is_team_player(team_id)
        OR is_parent_of_team_player(team_id)
    );

-- Head coaches can manage coach assignments
CREATE POLICY "Head coaches can manage coach assignments"
    ON coach_assignments FOR ALL
    USING (is_head_coach(team_id));

-- ============================================
-- PLAYERS
-- ============================================

-- Coaches can view players on their teams
CREATE POLICY "Coaches can view team players"
    ON players FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_memberships tm
            INNER JOIN coach_assignments ca ON ca.team_id = tm.team_id
            WHERE tm.player_id = players.id
            AND ca.coach_id = auth.uid()
        )
    );

-- Players can view their own profile
CREATE POLICY "Players can view own profile"
    ON players FOR SELECT
    USING (user_id = auth.uid());

-- Parents can view their children's profiles
CREATE POLICY "Parents can view children profiles"
    ON players FOR SELECT
    USING (
        user_id IN (
            SELECT child_id FROM parent_child_links
            WHERE parent_id = auth.uid()
        )
    );

-- Coaches can create/update players
CREATE POLICY "Coaches can manage players"
    ON players FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('head_coach', 'assistant_coach')
        )
    );

CREATE POLICY "Coaches can update players"
    ON players FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM team_memberships tm
            INNER JOIN coach_assignments ca ON ca.team_id = tm.team_id
            WHERE tm.player_id = players.id
            AND ca.coach_id = auth.uid()
        )
    );

-- ============================================
-- TEAM MEMBERSHIPS
-- ============================================

-- View memberships for accessible teams
CREATE POLICY "View team memberships"
    ON team_memberships FOR SELECT
    USING (
        is_team_coach(team_id)
        OR is_team_player(team_id)
        OR is_parent_of_team_player(team_id)
    );

-- Coaches can manage memberships
CREATE POLICY "Coaches can manage memberships"
    ON team_memberships FOR ALL
    USING (is_team_coach(team_id));

-- ============================================
-- COACH NOTES (PRIVATE - COACHES ONLY)
-- ============================================

-- Only coaches on the player's team can view notes
CREATE POLICY "Coaches can view team player notes"
    ON coach_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_memberships tm
            INNER JOIN coach_assignments ca ON ca.team_id = tm.team_id
            WHERE tm.player_id = coach_notes.player_id
            AND ca.coach_id = auth.uid()
        )
    );

-- Coaches can create notes
CREATE POLICY "Coaches can create notes"
    ON coach_notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_memberships tm
            INNER JOIN coach_assignments ca ON ca.team_id = tm.team_id
            WHERE tm.player_id = player_id
            AND ca.coach_id = auth.uid()
        )
    );

-- Coaches can update/delete own notes
CREATE POLICY "Coaches can manage own notes"
    ON coach_notes FOR UPDATE
    USING (author_id = auth.uid());

CREATE POLICY "Coaches can delete own notes"
    ON coach_notes FOR DELETE
    USING (author_id = auth.uid());

-- ============================================
-- EVENTS
-- ============================================

-- View events for accessible teams
CREATE POLICY "View team events"
    ON events FOR SELECT
    USING (
        is_team_coach(team_id)
        OR is_team_player(team_id)
        OR is_parent_of_team_player(team_id)
    );

-- Coaches can manage events
CREATE POLICY "Coaches can manage events"
    ON events FOR ALL
    USING (is_team_coach(team_id));

-- ============================================
-- RSVPS
-- ============================================

-- View RSVPs for accessible events
CREATE POLICY "View event RSVPs"
    ON rsvps FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = rsvps.event_id
            AND (
                is_team_coach(e.team_id)
                OR is_team_player(e.team_id)
                OR is_parent_of_team_player(e.team_id)
            )
        )
    );

-- Players and parents can create/update their own RSVPs
CREATE POLICY "Players can manage own RSVPs"
    ON rsvps FOR ALL
    USING (
        player_id = get_player_id_for_user()
        OR player_id IN (
            SELECT p.id FROM players p
            INNER JOIN parent_child_links pcl ON pcl.child_id = p.user_id
            WHERE pcl.parent_id = auth.uid()
        )
    );

-- Coaches can view and update RSVPs
CREATE POLICY "Coaches can manage team RSVPs"
    ON rsvps FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = rsvps.event_id
            AND is_team_coach(e.team_id)
        )
    );

-- ============================================
-- ATTENDANCE RECORDS
-- ============================================

-- View attendance for accessible events
CREATE POLICY "View event attendance"
    ON attendance_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = attendance_records.event_id
            AND (
                is_team_coach(e.team_id)
                OR (is_team_player(e.team_id) AND player_id = get_player_id_for_user())
                OR (is_parent_of_team_player(e.team_id) AND player_id IN (
                    SELECT p.id FROM players p
                    INNER JOIN parent_child_links pcl ON pcl.child_id = p.user_id
                    WHERE pcl.parent_id = auth.uid()
                ))
            )
        )
    );

-- Coaches can manage attendance
CREATE POLICY "Coaches can manage attendance"
    ON attendance_records FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = attendance_records.event_id
            AND is_team_coach(e.team_id)
        )
    );

-- ============================================
-- DRILLS
-- ============================================

-- Everyone can view drills
CREATE POLICY "Anyone can view drills"
    ON drills FOR SELECT
    USING (true);

-- Coaches can create drills
CREATE POLICY "Coaches can create drills"
    ON drills FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('head_coach', 'assistant_coach')
        )
    );

-- Coaches can update own drills or system drills
CREATE POLICY "Coaches can update own drills"
    ON drills FOR UPDATE
    USING (created_by = auth.uid());

-- Coaches can delete own drills (not system drills)
CREATE POLICY "Coaches can delete own drills"
    ON drills FOR DELETE
    USING (created_by = auth.uid() AND is_system_drill = false);

-- ============================================
-- PRACTICE PLANS
-- ============================================

-- View practice plans for accessible teams
CREATE POLICY "View team practice plans"
    ON practice_plans FOR SELECT
    USING (is_team_coach(team_id) OR is_team_player(team_id));

-- Coaches can manage practice plans
CREATE POLICY "Coaches can manage practice plans"
    ON practice_plans FOR ALL
    USING (is_team_coach(team_id));

-- ============================================
-- PRACTICE BLOCKS
-- ============================================

-- View blocks for accessible practice plans
CREATE POLICY "View practice blocks"
    ON practice_blocks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM practice_plans pp
            INNER JOIN teams t ON t.id = pp.team_id
            WHERE pp.id = practice_blocks.practice_plan_id
            AND (is_team_coach(t.id) OR is_team_player(t.id))
        )
    );

-- Coaches can manage practice blocks
CREATE POLICY "Coaches can manage practice blocks"
    ON practice_blocks FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM practice_plans pp
            WHERE pp.id = practice_blocks.practice_plan_id
            AND is_team_coach(pp.team_id)
        )
    );

-- ============================================
-- DRILL EXECUTIONS
-- ============================================

-- View drill executions for accessible teams
CREATE POLICY "View team drill executions"
    ON drill_executions FOR SELECT
    USING (is_team_coach(team_id));

-- Coaches can manage drill executions
CREATE POLICY "Coaches can manage drill executions"
    ON drill_executions FOR ALL
    USING (is_team_coach(team_id));

-- ============================================
-- STAT ENTRIES
-- ============================================

-- View stats for accessible players
CREATE POLICY "View player stats"
    ON stat_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM players p
            INNER JOIN team_memberships tm ON tm.player_id = p.id
            WHERE p.id = stat_entries.player_id
            AND (
                is_team_coach(tm.team_id)
                OR (p.user_id = auth.uid())
                OR (p.user_id IN (
                    SELECT child_id FROM parent_child_links WHERE parent_id = auth.uid()
                ))
            )
        )
    );

-- Coaches can manage stats
CREATE POLICY "Coaches can manage stats"
    ON stat_entries FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = stat_entries.event_id
            AND is_team_coach(e.team_id)
        )
    );

-- ============================================
-- SYNC LOG
-- ============================================

-- Users can view own sync log
CREATE POLICY "Users can view own sync log"
    ON sync_log FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert own sync log entries
CREATE POLICY "Users can create own sync log"
    ON sync_log FOR INSERT
    WITH CHECK (user_id = auth.uid());
