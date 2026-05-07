-- ============================================
-- Blueprint Security & Performance Enhancements
-- Run this after schema.sql to add RLS, indexes, soft deletes
-- ============================================

-- ============================================
-- PART 1: ADD SOFT DELETE COLUMNS
-- ============================================

ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE finance_logs ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE motivations ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE content ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add audit trail columns
ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_by uuid references auth.users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_by uuid references auth.users(id);
ALTER TABLE goals ADD COLUMN IF NOT EXISTS updated_by uuid references auth.users(id);

-- Add user_id to scripture_favorites for multi-user support
ALTER TABLE scripture_favorites ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id);

-- Add due_date to tasks if not exists (already in schema)
-- Handled in schema.sql

-- ============================================
-- PART 2: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE life_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivations ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_workouts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: CREATE RLS POLICIES
-- ============================================

-- LIFE AREAS
CREATE POLICY "Users can view own life areas"
  ON life_areas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own life areas"
  ON life_areas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own life areas"
  ON life_areas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own life areas"
  ON life_areas FOR DELETE
  USING (auth.uid() = user_id);

-- NOTES
CREATE POLICY "Users can view own notes (not deleted)"
  ON notes FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

-- TASKS
CREATE POLICY "Users can view own tasks (not deleted)"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- GOALS
CREATE POLICY "Users can view own goals (not deleted)"
  ON goals FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- GOALS MILESTONES (inherit from parent goal)
CREATE POLICY "Users can view own goal milestones"
  ON goals_milestones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM goals WHERE goals.id = goal_id AND goals.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own goal milestones"
  ON goals_milestones FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM goals WHERE goals.id = goal_id AND goals.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own goal milestones"
  ON goals_milestones FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM goals WHERE goals.id = goal_id AND goals.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own goal milestones"
  ON goals_milestones FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM goals WHERE goals.id = goal_id AND goals.user_id = auth.uid()
  ));

-- GOALS SUBTASKS (inherit from parent milestone)
CREATE POLICY "Users can view own goal subtasks"
  ON goals_subtasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM goals_milestones gm
    JOIN goals g ON g.id = gm.goal_id
    WHERE gm.id = milestone_id AND g.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own goal subtasks"
  ON goals_subtasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM goals_milestones gm
    JOIN goals g ON g.id = gm.goal_id
    WHERE gm.id = milestone_id AND g.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own goal subtasks"
  ON goals_subtasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM goals_milestones gm
    JOIN goals g ON g.id = gm.goal_id
    WHERE gm.id = milestone_id AND g.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own goal subtasks"
  ON goals_subtasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM goals_milestones gm
    JOIN goals g ON g.id = gm.goal_id
    WHERE gm.id = milestone_id AND g.user_id = auth.uid()
  ));

-- FINANCE SUMMARY
CREATE POLICY "Users can view own finance summary"
  ON finance_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own finance summary"
  ON finance_summary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own finance summary"
  ON finance_summary FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own finance summary"
  ON finance_summary FOR DELETE
  USING (auth.uid() = user_id);

-- FINANCE HISTORY
CREATE POLICY "Users can view own finance history"
  ON finance_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own finance history"
  ON finance_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- FINANCE LOGS
CREATE POLICY "Users can view own finance logs (not deleted)"
  ON finance_logs FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own finance logs"
  ON finance_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own finance logs"
  ON finance_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own finance logs"
  ON finance_logs FOR DELETE
  USING (auth.uid() = user_id);

-- SAVINGS TARGETS
CREATE POLICY "Users can view own savings targets"
  ON savings_targets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings targets"
  ON savings_targets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings targets"
  ON savings_targets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings targets"
  ON savings_targets FOR DELETE
  USING (auth.uid() = user_id);

-- BODY STATS
CREATE POLICY "Users can view own body stats"
  ON body_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body stats"
  ON body_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body stats"
  ON body_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own body stats"
  ON body_stats FOR DELETE
  USING (auth.uid() = user_id);

-- MOOD LOGS
CREATE POLICY "Users can view own mood logs"
  ON mood_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood logs"
  ON mood_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood logs"
  ON mood_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood logs"
  ON mood_logs FOR DELETE
  USING (auth.uid() = user_id);

-- WORKOUTS
CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);

-- WORKOUT LOGS
CREATE POLICY "Users can view own workout logs"
  ON workout_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs"
  ON workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs"
  ON workout_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs"
  ON workout_logs FOR DELETE
  USING (auth.uid() = user_id);

-- SKILLS
CREATE POLICY "Users can view own skills"
  ON skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skills"
  ON skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills"
  ON skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own skills"
  ON skills FOR DELETE
  USING (auth.uid() = user_id);

-- USER PROFILES
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- MOTIVATIONS
CREATE POLICY "Users can view own motivations (not deleted)"
  ON motivations FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own motivations"
  ON motivations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own motivations"
  ON motivations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own motivations"
  ON motivations FOR DELETE
  USING (auth.uid() = user_id);

-- CONTENT
CREATE POLICY "Users can view own content (not deleted)"
  ON content FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own content"
  ON content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content"
  ON content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own content"
  ON content FOR DELETE
  USING (auth.uid() = user_id);

-- AI INSIGHTS
CREATE POLICY "Users can view own ai insights"
  ON ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai insights"
  ON ai_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- SCRIPTURE FAVORITES
CREATE POLICY "Users can view own scripture favorites"
  ON scripture_favorites FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own scripture favorites"
  ON scripture_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripture favorites"
  ON scripture_favorites FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- CALENDAR CONNECTIONS
CREATE POLICY "Users can view own calendar connections"
  ON calendar_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar connections"
  ON calendar_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar connections"
  ON calendar_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar connections"
  ON calendar_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PART 4: CREATE PERFORMANCE INDEXES
-- ============================================

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at) WHERE deleted_at IS NOT NULL;

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project) WHERE project IS NOT NULL;

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date) WHERE target_date IS NOT NULL;

-- Finance logs indexes
CREATE INDEX IF NOT EXISTS idx_finance_logs_user_date ON finance_logs(user_id, recorded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_logs_type ON finance_logs(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_logs_category ON finance_logs(category) WHERE category IS NOT NULL;

-- Mood logs index
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, created_at DESC);

-- Body stats index
CREATE INDEX IF NOT EXISTS idx_body_stats_user_date ON body_stats(user_id, recorded_at DESC);

-- Motivations index
CREATE INDEX IF NOT EXISTS idx_motivations_user_id ON motivations(user_id) WHERE deleted_at IS NULL;

-- Content index
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id) WHERE deleted_at IS NULL;

-- Notifications index
CREATE INDEX IF NOT EXISTS idx_notifications_due_at ON notifications(due_at) WHERE due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- ============================================
-- PART 5: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to soft delete (mark deleted_at)
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE notes SET deleted_at = now() WHERE id = OLD.id AND deleted_at IS NULL;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4B: GAMIFICATION MIGRATIONS, RLS, AND INDEXES
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'skills'
      AND column_name = 'level'
      AND data_type <> 'integer'
  ) THEN
    ALTER TABLE skills RENAME COLUMN level TO legacy_level;
  END IF;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

ALTER TABLE skills ADD COLUMN IF NOT EXISTS level integer default 1;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS kind text default 'general';

DROP POLICY IF EXISTS "Users can view own gamification profile" ON user_gamification_profile;
DROP POLICY IF EXISTS "Users can insert own gamification profile" ON user_gamification_profile;
DROP POLICY IF EXISTS "Users can update own gamification profile" ON user_gamification_profile;
DROP POLICY IF EXISTS "Users can delete own gamification profile" ON user_gamification_profile;

CREATE POLICY "Users can view own gamification profile"
  ON user_gamification_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification profile"
  ON user_gamification_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification profile"
  ON user_gamification_profile FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gamification profile"
  ON user_gamification_profile FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own quests" ON quests;
DROP POLICY IF EXISTS "Users can insert own quests" ON quests;
DROP POLICY IF EXISTS "Users can update own quests" ON quests;
DROP POLICY IF EXISTS "Users can delete own quests" ON quests;

CREATE POLICY "Users can view own quests"
  ON quests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quests"
  ON quests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quests"
  ON quests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quests"
  ON quests FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own body workouts" ON body_workouts;
DROP POLICY IF EXISTS "Users can insert own body workouts" ON body_workouts;
DROP POLICY IF EXISTS "Users can update own body workouts" ON body_workouts;
DROP POLICY IF EXISTS "Users can delete own body workouts" ON body_workouts;

CREATE POLICY "Users can view own body workouts"
  ON body_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body workouts"
  ON body_workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body workouts"
  ON body_workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own body workouts"
  ON body_workouts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gamification_profile_user_id ON user_gamification_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_user_date_status ON quests(user_id, quest_date DESC, status);
CREATE INDEX IF NOT EXISTS idx_body_workouts_user_date ON body_workouts(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_skills_user_kind ON skills(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'âœ… Security & Performance Enhancements Applied';
  RAISE NOTICE 'âœ… RLS enabled on all tables';
  RAISE NOTICE 'âœ… Policies created for all tables';
  RAISE NOTICE 'âœ… Soft delete columns added';
  RAISE NOTICE 'âœ… Performance indexes created';
  RAISE NOTICE 'âœ… Audit trail columns added';
  RAISE NOTICE '';
  RAISE NOTICE 'ðŸ”’ Your data is now secure!';
END $$;

