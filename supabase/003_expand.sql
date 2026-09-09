-- JamLink 003_expand: reports, profile fields, search indexes, trending view.
-- RUN ORDER: schema.sql first, then 002_robust.sql, then this file.
-- Idempotent: safe to re-run. Additive only: nothing existing is dropped or
-- loosened. RLS posture matches 002 (self-only writes, no public read of
-- private rows).

-- (1) jam_reports: user-submitted reports on a jam. Private to the reporter.
create table if not exists public.jam_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  jam_id uuid not null references public.jams (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Constraints via drop/add so tuning the bounds stays re-runnable
-- (same style as jams_genre_check).
alter table public.jam_reports drop constraint if exists jam_reports_reason_check;
alter table public.jam_reports add constraint jam_reports_reason_check check (
  char_length(btrim(reason)) between 1 and 500
);

-- One report per reporter per jam: no spamming the same jam.
alter table public.jam_reports drop constraint if exists jam_reports_reporter_jam_key;
alter table public.jam_reports add constraint jam_reports_reporter_jam_key
  unique (reporter_id, jam_id);

create index if not exists idx_jam_reports_jam_id
  on public.jam_reports (jam_id);

alter table public.jam_reports enable row level security;

-- Self-insert and self-read only. No public read, no update, no delete:
-- with RLS on, absent policies mean nobody (except service_role) can do it.
drop policy if exists "reports self insert" on public.jam_reports;
create policy "reports self insert" on public.jam_reports
  for insert with check (auth.uid() = reporter_id);
drop policy if exists "reports self read" on public.jam_reports;
create policy "reports self read" on public.jam_reports
  for select using (auth.uid() = reporter_id);

-- (1b) A member can always read a jam they joined, even after the host closes
-- it. Without this, /my-jams and /profile silently drop closed jams you joined
-- but do not host, leaving no way to leave them. Additive: this only widens
-- read for rows the caller is already a member of. Safe from RLS recursion
-- because jam_members policies never reference public.jams.
drop policy if exists "jams member read" on public.jams;
create policy "jams member read" on public.jams for select using (
  exists (select 1 from public.jam_members m where m.jam_id = id and m.user_id = auth.uid())
);

-- (2) profile fields
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists spotify_username text;

alter table public.profiles drop constraint if exists profiles_bio_check;
alter table public.profiles add constraint profiles_bio_check check (
  bio is null or char_length(bio) <= 300
);

-- (3) trigram search. Supports the clients' .ilike('title', '%term%');
-- btree cannot serve a leading-wildcard match, GIN trgm can.
-- No-op if Supabase already provisioned pg_trgm in the extensions schema.
create extension if not exists pg_trgm;

-- ponytail: two single-column indexes, not one multi-column GIN. Title and
-- description are searched independently, and a per-column index is what the
-- planner picks for `title ilike '%x%'`.
create index if not exists idx_jams_title_trgm
  on public.jams using gin (title gin_trgm_ops);
create index if not exists idx_jams_description_trgm
  on public.jams using gin (description gin_trgm_ops);

-- (4) trending_jams: open jams, most members first.
-- security_invoker = on (PG15+, which Supabase runs) so the view executes as
-- the caller and the jams RLS policies still apply. Without it the view runs
-- with its owner's rights and bypasses those policies.
-- Dropped first because create or replace cannot change the column list.
drop view if exists public.trending_jams;
create or replace view public.trending_jams
with (security_invoker = on) as
  select id, host_id, title, spotify_url, genre, description,
         is_open, member_count, created_at
  from public.jams
  where is_open = true
  order by member_count desc, created_at desc;

grant select on public.trending_jams to anon, authenticated;
