-- Run this script once in Supabase Dashboard → SQL Editor.
-- Every row belongs to the signed-in user. Anonymous visitors cannot access the table.

create table if not exists public.private_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  category text not null default 'Allgemein' check (char_length(category) <= 80),
  entry_date date not null default current_date,
  notes text not null default '' check (char_length(notes) <= 10000),
  created_at timestamptz not null default now()
);

create index if not exists private_entries_user_date_idx
  on public.private_entries (user_id, entry_date desc, created_at desc);

alter table public.private_entries enable row level security;
revoke all on table public.private_entries from anon, authenticated;
grant select, insert, update, delete on table public.private_entries to authenticated;

drop policy if exists "Users can read their own entries" on public.private_entries;
create policy "Users can read their own entries"
  on public.private_entries for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own entries" on public.private_entries;
create policy "Users can create their own entries"
  on public.private_entries for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own entries" on public.private_entries;
create policy "Users can update their own entries"
  on public.private_entries for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own entries" on public.private_entries;
create policy "Users can delete their own entries"
  on public.private_entries for delete
  to authenticated
  using ((select auth.uid()) = user_id);
