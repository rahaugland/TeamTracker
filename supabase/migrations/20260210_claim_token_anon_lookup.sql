-- Allow unauthenticated (anonymous) users to look up claim token details.
-- The existing RLS policies require auth.uid() IS NOT NULL, which blocks
-- anonymous visitors from seeing the claim page. Since the claim page must
-- work BEFORE login, we use a SECURITY DEFINER function that bypasses RLS.

CREATE OR REPLACE FUNCTION get_claim_token_details(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'expires_at', pct.expires_at,
        'claimed_at', pct.claimed_at,
        'player', json_build_object(
            'id', p.id,
            'name', p.name,
            'positions', p.positions,
            'photo_url', p.photo_url
        ),
        'team', json_build_object(
            'id', t.id,
            'name', t.name
        )
    ) INTO v_result
    FROM player_claim_tokens pct
    INNER JOIN players p ON p.id = pct.player_id
    INNER JOIN teams t ON t.id = pct.team_id
    WHERE pct.token = p_token;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix claim_player: comparing enum column to empty string '' causes
-- "invalid input for enum user_role". The role column allows NULL for
-- new users (set during role selection), so IS NULL is sufficient.
CREATE OR REPLACE FUNCTION claim_player(p_token TEXT)
RETURNS TABLE(player_id UUID, team_id UUID) AS $$
DECLARE
    v_token_row player_claim_tokens%ROWTYPE;
BEGIN
    -- Lock the token row to prevent concurrent claims
    SELECT * INTO v_token_row
    FROM player_claim_tokens pct
    WHERE pct.token = p_token
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid claim token' USING ERRCODE = 'P0001';
    END IF;

    IF v_token_row.expires_at < NOW() THEN
        RAISE EXCEPTION 'Claim token has expired' USING ERRCODE = 'P0002';
    END IF;

    IF v_token_row.claimed_at IS NOT NULL THEN
        RAISE EXCEPTION 'Claim token has already been used' USING ERRCODE = 'P0003';
    END IF;

    IF EXISTS (
        SELECT 1 FROM players p
        WHERE p.id = v_token_row.player_id
        AND p.user_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Player is already linked to a user account' USING ERRCODE = 'P0004';
    END IF;

    -- Mark the token as claimed
    UPDATE player_claim_tokens
    SET claimed_at = NOW(),
        claimed_by = auth.uid()
    WHERE id = v_token_row.id;

    -- Link the player to the current user
    UPDATE players
    SET user_id = auth.uid()
    WHERE id = v_token_row.player_id;

    -- Set user role to 'player' if not already set
    UPDATE profiles
    SET role = 'player',
        updated_at = NOW()
    WHERE id = auth.uid()
    AND role IS NULL;

    RETURN QUERY SELECT v_token_row.player_id, v_token_row.team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
