-- Fix: Prevent privilege escalation via profile self-update
-- The existing "Users can update own profile" policy allows users to change
-- ANY column including `role`, enabling any user to make themselves head_coach.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Replace with a policy that prevents users from changing their own role
CREATE POLICY "Users can update own profile (not role)"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
    );

-- Allow head coaches to update other users' roles
CREATE POLICY "Head coaches can update user roles"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'head_coach'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'head_coach'
        )
        AND id != auth.uid()  -- Cannot change own role
    );
