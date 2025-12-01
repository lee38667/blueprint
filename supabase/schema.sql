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

create table if not exists skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text,
  level text,
  cv_files jsonb,
  created_at timestamptz default now()
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

-- Create minimal policies: by default enable RLS off; instruct user to enable RLS per table.
