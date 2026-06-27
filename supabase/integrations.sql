-- ─────────────────────────────────────────────────────────────
-- Integrations migration: Web Push, Google Fit (+ Galaxy Watch bridge).
--
-- Adds the tables the new integrations need, with RLS + a `user_id` default
-- of auth.uid() so client/service inserts satisfy the policies (same pattern as
-- fix-user-id-defaults.sql). Safe to run multiple times.
--
-- Run AFTER schema.sql + security-and-performance.sql.
--
-- (Wger, Unsplash, Spotify need NO tables — they are stateless API proxies, and
-- Unsplash image picks reuse the existing `motivations.image_url` column.)
-- ─────────────────────────────────────────────────────────────

-- ── Web Push subscriptions ───────────────────────────────────
-- One row per browser/device a user has granted notifications on. The PushSubscription
-- endpoint is the natural unique key.
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now(),
  unique(user_id, endpoint)
);

alter table push_subscriptions enable row level security;

do $$ begin
  create policy "own push subs select" on push_subscriptions for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own push subs insert" on push_subscriptions for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own push subs delete" on push_subscriptions for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ── Fitness (Google Fit) OAuth connections ───────────────────
-- Mirrors calendar_connections: encrypted tokens at rest, one per provider.
create table if not exists fitness_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  provider text not null default 'google_fit',
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

alter table fitness_connections enable row level security;

do $$ begin
  create policy "own fitness conn select" on fitness_connections for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own fitness conn insert" on fitness_connections for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own fitness conn update" on fitness_connections for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own fitness conn delete" on fitness_connections for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ── Daily fitness samples (synced from Google Fit / Galaxy Watch) ─
-- One row per user per day; sync upserts so re-running is idempotent.
create table if not exists fitness_samples (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  day date not null,
  steps integer,
  sleep_min integer,
  resting_hr integer,
  weight_kg numeric,
  calories integer,
  source text default 'google_fit',
  synced_at timestamptz default now(),
  unique(user_id, day)
);

alter table fitness_samples enable row level security;

do $$ begin
  create policy "own fitness samples select" on fitness_samples for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own fitness samples insert" on fitness_samples for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own fitness samples update" on fitness_samples for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own fitness samples delete" on fitness_samples for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create index if not exists fitness_samples_user_day_idx on fitness_samples (user_id, day desc);
