-- JamLink 004_security: fixes for the security report (M-2, M-3, L-4).
-- RUN ORDER: schema.sql, then 002_robust.sql, then 003_expand.sql, then this file.
-- Idempotent: safe to re-run. Additive only — no table, column or grant removed.
--
-- ACCEPTED RISK (L-1, jam_members public read): closed-jam membership rows stay
-- publicly readable. Every recursion-free rewrite needs the jam's is_open flag,
-- and any policy on jam_members that reads public.jams recurses through 003's
-- "jams member read" policy (which itself reads jam_members). Upgrade path when
-- this matters: denormalize is_open onto jam_members via a trigger on
-- public.jams, then gate the SELECT policy on that local column.

-- ---------------------------------------------------------------------------
-- M-2: spotify_url must be a Spotify link. Drop/add style like jams_genre_check
-- so tightening the pattern later stays re-runnable.
-- NOTE: fails if legacy rows violate it. Find them first with:
--   select id, spotify_url from public.jams
--   where spotify_url not like 'https://open.spotify.com/%'
--     and spotify_url not like 'spotify:%';
-- ---------------------------------------------------------------------------
alter table public.jams drop constraint if exists jams_spotify_url_check;
alter table public.jams add constraint jams_spotify_url_check check (
  spotify_url like 'https://open.spotify.com/%'
  or spotify_url like 'spotify:%'
);

-- ---------------------------------------------------------------------------
-- M-3: host UPDATE could rewrite host_id (ownership transfer), member_count
-- (counter spoofing) and max_members (capacity bypass). RLS WITH CHECK sees
-- only the NEW row, so the old values come from this STABLE helper: it reads
-- the statement snapshot, i.e. the row as it was before this UPDATE.
-- SECURITY DEFINER so the read bypasses RLS — a plain subquery on public.jams
-- inside a public.jams policy would recurse.
-- ---------------------------------------------------------------------------
create or replace function public.jam_pins_unchanged(
  p_id uuid, p_host_id uuid, p_member_count int, p_max_members int
) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.jams j
    where j.id = p_id
      and j.host_id is not distinct from p_host_id
      and j.member_count = p_member_count
      and j.max_members = p_max_members
  );
$$;

grant execute on function public.jam_pins_unchanged(uuid, uuid, int, int) to authenticated;

drop policy if exists "jams host update" on public.jams;
create policy "jams host update" on public.jams
  for update
  using (auth.uid() = host_id)
  with check (
    auth.uid() = host_id
    and public.jam_pins_unchanged(id, host_id, member_count, max_members)
  );

-- Companion to M-3: the count trigger issues `update public.jams` as the
-- *caller*, so on a direct client insert into jam_members it now trips the
-- pinned-column WITH CHECK above. SECURITY DEFINER makes the bump run as the
-- owner and bypass RLS, which is the only way the counter stays correct.
-- Body is unchanged from schema.sql.
create or replace function public.bump_member_count() returns trigger
language plpgsql security definer set search_path = public as $$
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

-- ---------------------------------------------------------------------------
-- L-4: DELETE was unreachable on both tables (RLS on, no policy = nobody).
-- Host may delete their own jam; a user may delete their own profile.
-- jam_members and jam_reports cascade from both.
-- ---------------------------------------------------------------------------
drop policy if exists "jams host delete" on public.jams;
create policy "jams host delete" on public.jams
  for delete using (auth.uid() = host_id);

drop policy if exists "profiles self delete" on public.profiles;
create policy "profiles self delete" on public.profiles
  for delete using (auth.uid() = id);
