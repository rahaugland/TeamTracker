-- Update drills RLS to allow coaches to see:
-- 1. System drills (is_system_drill = true, created_by IS NULL)
-- 2. Their own custom drills (created_by = their ID)

-- Drop existing policy
DROP POLICY IF EXISTS "Coaches have full access to drills" ON drills;

-- Create read policy: coaches can read system drills AND their own drills
CREATE POLICY "Coaches can read all drills" ON drills
    FOR SELECT USING (
        -- System drills are visible to all coaches
        (is_system_drill = true)
        OR
        -- Own drills are visible to creator
        (created_by = auth.uid())
        OR
        -- All coaches can see all drills (for now - simplifies sharing)
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

-- Create insert policy: coaches can create their own drills
CREATE POLICY "Coaches can create drills" ON drills
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('head_coach', 'assistant_coach'))
    );

-- Create update policy: coaches can update their own drills (not system drills)
CREATE POLICY "Coaches can update own drills" ON drills
    FOR UPDATE USING (
        created_by = auth.uid()
        AND is_system_drill = false
    );

-- Create delete policy: coaches can delete their own drills (not system drills)
CREATE POLICY "Coaches can delete own drills" ON drills
    FOR DELETE USING (
        created_by = auth.uid()
        AND is_system_drill = false
    );
