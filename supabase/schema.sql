-- JamLink schema — single source of truth for DB.
-- Paste into Supabase Dashboard > SQL Editor and run. Idempotent: safe to re-run.
-- NOTE: seed jams use placeholder host uuid 00000000-0000-0000-0000-000000000001.
-- Replace it with a real auth.users id (or delete seed rows) before production.

create extension if not exists "pgcrypto";

-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.jams (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles (id) on delete set null,
  title text not null,
  spotify_url text not null,
  genre text not null,
  description text not null default '',
  is_open boolean not null default true,
  member_count int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.jam_members (
  jam_id uuid not null references public.jams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (jam_id, user_id)
);

-- Genre closed list (matches shared/spotify.ts GENRES)
alter table public.jams drop constraint if exists jams_genre_check;
alter table public.jams add constraint jams_genre_check check (
  genre in ('pop','hip-hop','rock','edm','rnb','kpop','jazz','lofi','indie','classical','latin','afrobeats','other')
);

-- RLS
alter table public.profiles enable row level security;
alter table public.jams enable row level security;
alter table public.jam_members enable row level security;

-- profiles: public read, user manages own row
drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read" on public.profiles for select using (true);
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- jams: public read on open jams, authenticated insert as self, host updates own
drop policy if exists "jams open read" on public.jams;
create policy "jams open read" on public.jams for select using (is_open = true);
drop policy if exists "jams host read own" on public.jams;
create policy "jams host read own" on public.jams for select using (auth.uid() = host_id);
drop policy if exists "jams auth insert" on public.jams;
create policy "jams auth insert" on public.jams for insert with check (auth.uid() = host_id);
drop policy if exists "jams host update" on public.jams;
create policy "jams host update" on public.jams for update using (auth.uid() = host_id);

-- jam_members: public read, members insert own rows, host or self can delete
drop policy if exists "members public read" on public.jam_members;
create policy "members public read" on public.jam_members for select using (true);
drop policy if exists "members self insert" on public.jam_members;
create policy "members self insert" on public.jam_members for insert with check (auth.uid() = user_id);
drop policy if exists "members self or host delete" on public.jam_members;
create policy "members self or host delete" on public.jam_members for delete using (
  auth.uid() = user_id
  or exists (select 1 from public.jams j where j.id = jam_id and j.host_id = auth.uid())
);

-- member_count trigger: bump on join, decrement on leave (floor 0)
create or replace function public.bump_member_count() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.jams set member_count = member_count + 1 where id = new.jam_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.jams set member_count = greatest(member_count - 1, 0) where id = old.jam_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists jam_members_count on public.jam_members;
create trigger jam_members_count
  after insert or delete on public.jam_members
  for each row execute function public.bump_member_count();

-- Seed: 8 open jams across genres.
-- Runs only when the seed auth user exists (create it via Auth Admin API, then
-- re-run this file — idempotent). Skips cleanly on fresh projects otherwise.
do $$
begin
  if not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-000000000001') then
    raise notice 'JamLink seeds skipped: seed auth user not present.';
    return;
  end if;
  insert into public.profiles (id, display_name) values
    ('00000000-0000-0000-0000-000000000001', 'JamLink Seed Host')
  on conflict (id) do nothing;

  insert into public.jams (id, host_id, title, spotify_url, genre, description, is_open) values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000001', 'Late Night Pop', 'https://open.spotify.com/jam/seedpop1?si=seed01', 'pop', 'Seed jam — replace me', true),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000001', 'Boom Bap Session', 'https://open.spotify.com/jam/seedhiphop2?si=seed02', 'hip-hop', 'Seed jam — replace me', true),
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000001', 'Garage Rock Hour', 'https://open.spotify.com/jam/seedrock3?si=seed03', 'rock', 'Seed jam — replace me', true),
  ('44444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000001', 'Neon EDM Floor', 'https://open.spotify.com/jam/seededm4?si=seed04', 'edm', 'Seed jam — replace me', true),
  ('55555555-5555-4555-8555-555555555555', '00000000-0000-0000-0000-000000000001', 'Smooth R&B Vibes', 'https://open.spotify.com/jam/seedrnb5?si=seed05', 'rnb', 'Seed jam — replace me', true),
  ('66666666-6666-4666-8666-666666666666', '00000000-0000-0000-0000-000000000001', 'Seoul Wave', 'https://open.spotify.com/jam/seedkpop6?si=seed06', 'kpop', 'Seed jam — replace me', true),
  ('77777777-7777-4777-8777-777777777777', '00000000-0000-0000-0000-000000000001', 'Blue Note Night', 'https://open.spotify.com/jam/seedjazz7?si=seed07', 'jazz', 'Seed jam — replace me', true),
  ('88888888-8888-4888-8888-888888888888', '00000000-0000-0000-0000-000000000001', 'Lagos to the World', 'https://open.spotify.com/jam/seedafro8?si=seed08', 'afrobeats', 'Seed jam — replace me', true)
  on conflict (id) do nothing;
end $$;
