-- ─────────────────────────────────────────────────────────────
-- Fix: default user_id to auth.uid() on all user-owned tables.
--
-- WHY: schema.sql declares `user_id uuid ... not null` with NO default on
-- most tables, while the RLS insert policies require `auth.uid() = user_id`.
-- The client hooks insert rows WITHOUT a user_id, so every insert failed the
-- NOT NULL + RLS check (error 42501 "violates row-level security policy").
-- Only body_workouts had `default auth.uid()` and therefore worked.
--
-- This migration adds that default everywhere so existing client code (which
-- omits user_id) inserts correctly under RLS. Safe to run multiple times.
--
-- Run AFTER schema.sql + security-and-performance.sql, then re-run
-- verify-rls.sql.
-- ─────────────────────────────────────────────────────────────

do $$
declare
  t text;
  tables text[] := array[
    'life_areas', 'notes', 'workouts', 'workout_logs',
    'finance_summary', 'finance_history', 'finance_logs', 'savings_targets',
    'body_stats', 'notifications', 'scripture_favorites', 'skills',
    'user_profiles', 'content', 'ai_insights', 'motivations',
    'goals', 'mood_logs', 'tasks', 'user_gamification_profile', 'quests'
  ];
begin
  foreach t in array tables loop
    -- only touch tables that actually have a user_id column
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'user_id'
    ) then
      execute format('alter table public.%I alter column user_id set default auth.uid()', t);
    end if;
  end loop;
end $$;

-- Verify: every default should now read `auth.uid()`.
select table_name, column_default
from information_schema.columns
where table_schema = 'public' and column_name = 'user_id'
order by table_name;
