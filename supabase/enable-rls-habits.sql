-- ─────────────────────────────────────────────────────────────
-- Enable RLS + owner policies on habits / habit_logs.
--
-- WHY: these tables were added after security-and-performance.sql was written,
-- so RLS was never enabled on them. Supabase's security advisor flagged both as
-- ERROR "RLS Disabled in Public" — meaning any authenticated user (incl. the
-- other account) could read/write everyone's habits. Applied 2026-06-22.
--
-- habits: owned directly via user_id.
-- habit_logs: has no user_id; ownership is derived from the parent habit.
--
-- Idempotent. Run in the Supabase SQL editor, then re-run verify-rls.sql.
-- ─────────────────────────────────────────────────────────────

-- habits
alter table public.habits enable row level security;
drop policy if exists "habits_select_own" on public.habits;
drop policy if exists "habits_insert_own" on public.habits;
drop policy if exists "habits_update_own" on public.habits;
drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);

-- habit_logs (scoped through the parent habit)
alter table public.habit_logs enable row level security;
drop policy if exists "habit_logs_select_own" on public.habit_logs;
drop policy if exists "habit_logs_insert_own" on public.habit_logs;
drop policy if exists "habit_logs_update_own" on public.habit_logs;
drop policy if exists "habit_logs_delete_own" on public.habit_logs;
create policy "habit_logs_select_own" on public.habit_logs for select
  using (exists (select 1 from public.habits h where h.id = habit_logs.habit_id and h.user_id = auth.uid()));
create policy "habit_logs_insert_own" on public.habit_logs for insert
  with check (exists (select 1 from public.habits h where h.id = habit_logs.habit_id and h.user_id = auth.uid()));
create policy "habit_logs_update_own" on public.habit_logs for update
  using (exists (select 1 from public.habits h where h.id = habit_logs.habit_id and h.user_id = auth.uid()))
  with check (exists (select 1 from public.habits h where h.id = habit_logs.habit_id and h.user_id = auth.uid()));
create policy "habit_logs_delete_own" on public.habit_logs for delete
  using (exists (select 1 from public.habits h where h.id = habit_logs.habit_id and h.user_id = auth.uid()));
