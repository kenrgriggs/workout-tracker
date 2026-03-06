-- ============================================================
-- Workout Tracker — Initial Schema + RLS Policies
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────────────

create table if not exists public.workouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  day_number    int not null check (day_number between 1 and 9),
  workout_type  text not null,
  completed_at  timestamptz not null default now(),
  notes         text
);

create table if not exists public.sets (
  id            uuid primary key default gen_random_uuid(),
  workout_id    uuid not null references public.workouts(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  set_number    int not null,
  weight_lbs    numeric,
  reps          int,
  completed     boolean not null default false
);

-- ────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ────────────────────────────────────────────────────────────

create index if not exists workouts_user_id_idx on public.workouts(user_id);
create index if not exists workouts_completed_at_idx on public.workouts(completed_at desc);
create index if not exists sets_workout_id_idx on public.sets(workout_id);
create index if not exists sets_user_id_idx on public.sets(user_id);

-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table public.workouts enable row level security;
alter table public.sets enable row level security;

-- workouts: users can only see, insert, update, delete their own rows

create policy "workouts: select own" on public.workouts
  for select using (auth.uid() = user_id);

create policy "workouts: insert own" on public.workouts
  for insert with check (auth.uid() = user_id);

create policy "workouts: update own" on public.workouts
  for update using (auth.uid() = user_id);

create policy "workouts: delete own" on public.workouts
  for delete using (auth.uid() = user_id);

-- sets: users can only see, insert, update, delete their own rows

create policy "sets: select own" on public.sets
  for select using (auth.uid() = user_id);

create policy "sets: insert own" on public.sets
  for insert with check (auth.uid() = user_id);

create policy "sets: update own" on public.sets
  for update using (auth.uid() = user_id);

create policy "sets: delete own" on public.sets
  for delete using (auth.uid() = user_id);
