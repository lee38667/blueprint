-- Supabase schema for Blueprint
-- NOTE: Run in your Supabase SQL editor. Adjust RLS policies after creating tables.

-- Users: Supabase Auth manages users table (auth.users)

create table if not exists life_areas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text,
  content text,
  pinned boolean default false,
  tags text[],
  attachments jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text,
  day text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists workout_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  workout_id uuid references workouts(id) on delete cascade,
  performed_at timestamptz default now(),
  metrics jsonb,
  notes text
);

create table if not exists calendar_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  provider text not null default 'google',
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

create table if not exists finance_summary (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  balance numeric default 0,
  savings numeric default 0,
  debt numeric default 0,
  updated_at timestamptz default now()
);

create table if not exists finance_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  recorded_at timestamptz default now(),
  balance numeric not null,
  delta numeric,
  note text
);

-- Income & Expense logs
create table if not exists finance_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  recorded_at timestamptz default now(),
  type text check (type in ('income','expense')) not null,
  amount numeric not null,
  category text,
  note text
);

-- Savings targets
create table if not exists savings_targets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  month date not null,
  target_amount numeric not null,
  created_at timestamptz default now()
);

-- Body stats tracker
create table if not exists body_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  recorded_at timestamptz default now(),
  weight numeric,
  sleep_hours numeric,
  water_ml integer,
  stress integer
);

-- Notifications center
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  message text,
  due_at timestamptz,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Goal milestones and subtasks
create table if not exists goals_milestones (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid not null references goals(id) on delete cascade,
  title text not null,
  due_date date,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists goals_subtasks (
  id uuid default gen_random_uuid() primary key,
  milestone_id uuid not null references goals_milestones(id) on delete cascade,
  title text not null,
  status text default 'todo',
  created_at timestamptz default now()
);

-- Favorites for scripture verses
create table if not exists scripture_favorites (
  id uuid primary key default uuid_generate_v4(),
  verse text not null,
  reference text not null,
  created_at timestamp with time zone default now()
);

create table if not exists skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  name text,
  level integer default 1,
  description text,
  kind text default 'general',
  cv_files jsonb,
  created_at timestamptz default now()
);

create table if not exists user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null default auth.uid() unique,
  display_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  preferred_currency text not null default 'USD',
  weekly_planning_day text not null default 'Sunday',
  life_season text,
  primary_roles text[] not null default '{}',
  core_values text[] not null default '{}',
  coaching_tone text not null default 'direct',
  focus_statement text,
  default_dashboard_zones text[] not null default array['briefing', 'metrics', 'body', 'motivation', 'ai'],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint user_profiles_coaching_tone_check check (coaching_tone in ('direct', 'gentle', 'analytical', 'encouraging'))
);

create table if not exists content (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text,
  type text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists ai_insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  mood text,
  insight text,
  created_at timestamptz default now()
);

create table if not exists motivations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  kind text default 'quote', -- quote | goal-snippet | image
  title text,
  body text,
  image_url text,
  tags text[],
  created_at timestamptz default now()
);

create table if not exists goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  category text,
  target_date date,
  status text default 'active', -- active | paused | completed
  progress_note text,
  created_at timestamptz default now()
);

create table if not exists mood_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  mood_label text,
  mood_score integer,
  stress_score integer,
  note text,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  priority text default 'normal', -- low | normal | high
  status text default 'todo', -- todo | in_progress | done
  project text,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_gamification_profile (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  level integer not null default 1,
  exp integer not null default 0,
  gold integer not null default 0,
  class text not null default 'Warrior',
  unlocked_areas jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create table if not exists quests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  name text not null,
  type text not null check (type in ('task', 'habit', 'workout', 'body_part')),
  description text not null,
  exp_reward integer not null check (exp_reward between 10 and 100),
  gold_reward integer not null check (gold_reward between 5 and 50),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  linked_entity_id uuid,
  body_part text check (body_part in ('head', 'arms', 'chest', 'abs', 'legs', 'back')),
  quest_date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists body_workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null default auth.uid(),
  profile_id uuid references user_gamification_profile(id) on delete set null,
  body_part text not null check (body_part in ('head', 'arms', 'chest', 'abs', 'legs', 'back')),
  reps integer,
  sets integer,
  notes text,
  logged_at timestamptz default now()
);

-- Create minimal policies: by default enable RLS off; instruct user to enable RLS per table.

