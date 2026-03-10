-- ============================================================
-- Workout Tracker — Meals schema + RLS policies
-- Run this in the Supabase SQL Editor
-- ============================================================

create table if not exists public.meals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  calories     int not null default 0,
  protein      int,
  carbs        int,
  fats         int,
  notes        text,
  consumed_at  timestamptz not null default now()
);

create index if not exists meals_user_id_idx on public.meals(user_id);
create index if not exists meals_consumed_at_idx on public.meals(consumed_at desc);

alter table public.meals enable row level security;

create policy "meals: select own" on public.meals
  for select using (auth.uid() = user_id);

create policy "meals: insert own" on public.meals
  for insert with check (auth.uid() = user_id);

create policy "meals: update own" on public.meals
  for update using (auth.uid() = user_id);

create policy "meals: delete own" on public.meals
  for delete using (auth.uid() = user_id);
