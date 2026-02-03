-- Scope season visibility to users who belong to a team in that season.
-- Previously all authenticated users could see all seasons.

DROP POLICY IF EXISTS "Anyone can view seasons" ON seasons;

-- Coaches see seasons that contain teams they coach
-- Players see seasons that contain teams they belong to
-- Parents see seasons that contain teams their children belong to
CREATE POLICY "Users can view seasons for their teams"
    ON seasons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM teams t
            INNER JOIN coach_assignments ca ON ca.team_id = t.id
            WHERE t.season_id = seasons.id
            AND ca.coach_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM teams t
            INNER JOIN team_memberships tm ON tm.team_id = t.id
            INNER JOIN players p ON p.id = tm.player_id
            WHERE t.season_id = seasons.id
            AND p.user_id = auth.uid()
            AND tm.is_active = true
        )
        -- Parent support: uncomment when parent_child_links table exists
        -- OR EXISTS (
        --     SELECT 1 FROM teams t
        --     INNER JOIN team_memberships tm ON tm.team_id = t.id
        --     INNER JOIN players p ON p.id = tm.player_id
        --     INNER JOIN parent_child_links pcl ON pcl.child_id = p.user_id
        --     WHERE t.season_id = seasons.id
        --     AND pcl.parent_id = auth.uid()
        --     AND tm.is_active = true
        -- )
    );
