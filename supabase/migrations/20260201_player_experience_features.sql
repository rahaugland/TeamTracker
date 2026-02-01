-- Player Experience Features Migration
-- Adds: announcements, player_feedback, player_reviews, skill_ratings, self_assessments, push_subscriptions

-- ============================================================
-- 1. ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_team ON announcements(team_id, created_at DESC);
CREATE INDEX idx_announcements_pinned ON announcements(team_id, pinned) WHERE pinned = true;

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Coaches can CRUD announcements for teams they coach
CREATE POLICY "Coaches can manage announcements"
  ON announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coach_assignments ca
      WHERE ca.team_id = announcements.team_id
        AND ca.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_assignments ca
      WHERE ca.team_id = announcements.team_id
        AND ca.coach_id = auth.uid()
    )
  );

-- Players can read announcements for teams they belong to
CREATE POLICY "Players can read team announcements"
  ON announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_memberships tm
      JOIN players p ON p.id = tm.player_id
      WHERE tm.team_id = announcements.team_id
        AND tm.is_active = true
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. PLAYER FEEDBACK (post-event coach feedback)
-- ============================================================
CREATE TABLE IF NOT EXISTS player_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_feedback_player ON player_feedback(player_id, created_at DESC);
CREATE INDEX idx_player_feedback_event ON player_feedback(event_id);

ALTER TABLE player_feedback ENABLE ROW LEVEL SECURITY;

-- Coaches can CRUD feedback for players on their teams
CREATE POLICY "Coaches can manage player feedback"
  ON player_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coach_assignments ca
      JOIN team_memberships tm ON tm.team_id = ca.team_id
      WHERE tm.player_id = player_feedback.player_id
        AND tm.is_active = true
        AND ca.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_assignments ca
      JOIN team_memberships tm ON tm.team_id = ca.team_id
      WHERE tm.player_id = player_feedback.player_id
        AND tm.is_active = true
        AND ca.coach_id = auth.uid()
    )
  );

-- Players can read their own feedback
CREATE POLICY "Players can read own feedback"
  ON player_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_feedback.player_id
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. PLAYER REVIEWS (periodic structured reviews)
-- ============================================================
CREATE TABLE IF NOT EXISTS player_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id UUID REFERENCES team_seasons(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  strengths TEXT NOT NULL DEFAULT '',
  areas_to_improve TEXT NOT NULL DEFAULT '',
  goals_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_reviews_player ON player_reviews(player_id, created_at DESC);

ALTER TABLE player_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage player reviews"
  ON player_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coach_assignments ca
      WHERE ca.team_id = player_reviews.team_id
        AND ca.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_assignments ca
      WHERE ca.team_id = player_reviews.team_id
        AND ca.coach_id = auth.uid()
    )
  );

CREATE POLICY "Players can read own reviews"
  ON player_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_reviews.player_id
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. SKILL RATINGS
-- ============================================================
CREATE TYPE skill_type AS ENUM ('serve', 'pass', 'attack', 'block', 'set', 'defense');

CREATE TABLE IF NOT EXISTS skill_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_type skill_type NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 10),
  rated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_skill_ratings_player ON skill_ratings(player_id, rated_at DESC);
CREATE INDEX idx_skill_ratings_skill ON skill_ratings(player_id, skill_type, rated_at DESC);

ALTER TABLE skill_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage skill ratings"
  ON skill_ratings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coach_assignments ca
      WHERE ca.team_id = skill_ratings.team_id
        AND ca.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_assignments ca
      WHERE ca.team_id = skill_ratings.team_id
        AND ca.coach_id = auth.uid()
    )
  );

CREATE POLICY "Players can read own skill ratings"
  ON skill_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = skill_ratings.player_id
        AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. SELF ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS self_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, event_id)
);

CREATE INDEX idx_self_assessments_player ON self_assessments(player_id, created_at DESC);

ALTER TABLE self_assessments ENABLE ROW LEVEL SECURITY;

-- Players can manage their own self-assessments
CREATE POLICY "Players can manage own self assessments"
  ON self_assessments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = self_assessments.player_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = self_assessments.player_id
        AND p.user_id = auth.uid()
    )
  );

-- Coaches can read self-assessments for their team's players
CREATE POLICY "Coaches can read self assessments"
  ON self_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_assignments ca
      JOIN team_memberships tm ON tm.team_id = ca.team_id
      WHERE tm.player_id = self_assessments.player_id
        AND tm.is_active = true
        AND ca.coach_id = auth.uid()
    )
  );

-- ============================================================
-- 6. PUSH SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own push subscriptions
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
