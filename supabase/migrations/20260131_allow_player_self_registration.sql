-- Allow users to create their own player record when joining via invite.
-- Previously only coaches could INSERT into players.

CREATE POLICY "Users can create own player record"
    ON players FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Allow users to add themselves to a team (via invite flow).
-- The membership must reference the user's own player record.
CREATE POLICY "Users can join a team as themselves"
    ON team_memberships FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM players
            WHERE players.id = player_id
            AND players.user_id = auth.uid()
        )
    );
