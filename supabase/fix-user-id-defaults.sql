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

-- Dynamic: covers EVERY public table that has a user_id column (so new tables
-- like `habits` are caught automatically). Idempotent — skips columns already
-- defaulting to auth.uid().
do $$
declare
  r record;
begin
  for r in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'user_id'
      and (column_default is distinct from 'auth.uid()')
  loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', r.table_name);
  end loop;
end $$;

-- Verify: every default should now read `auth.uid()`.
select table_name, column_default
from information_schema.columns
where table_schema = 'public' and column_name = 'user_id'
order by table_name;
