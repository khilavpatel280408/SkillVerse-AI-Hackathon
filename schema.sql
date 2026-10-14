-- Run this in the Supabase SQL Editor for user-owned learning progress.
create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.learning_progress enable row level security;

create policy "Users can read their own learning progress"
  on public.learning_progress for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own learning progress"
  on public.learning_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own learning progress"
  on public.learning_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own learning progress"
  on public.learning_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.learning_progress to authenticated;
