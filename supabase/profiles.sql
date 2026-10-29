-- User profile (avatar URL synced from Storage). Run in Supabase SQL Editor.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  avatar_url text,
  display_name text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
