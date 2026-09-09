-- JamLink 002_robust — hardening on top of schema.sql (base schema first, then this).
-- Idempotent: safe to re-run. Additive-only: no existing table/column dropped,
-- no client-visible read behavior changed. Run after schema.sql in SQL Editor.
-- NOTE: clients currently insert into jam_members directly; the base
-- bump_member_count() trigger is intentionally KEPT so those writes still
-- count. join_jam/leave_jam below rely on that trigger (row lock makes the
-- check-then-insert atomic) instead of bumping count a second time.

-- (2) updated_at columns + touch trigger
alter table public.jams add column if not exists updated_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists jams_touch on public.jams;
create trigger jams_touch
  before update on public.jams
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- (3) capacity column
alter table public.jams add column if not exists max_members int not null default 50;

-- (7) genre closed list (same 13-genre list as shared/spotify.ts GENRES)
alter table public.jams drop constraint if exists jams_genre_check;
alter table public.jams add constraint jams_genre_check check (
  genre in ('pop','hip-hop','rock','edm','rnb','kpop','jazz','lofi','indie','classical','latin','afrobeats','other')
);

-- (1) auto-create profile on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- (6) indexes
create index if not exists idx_jams_genre_open_created
  on public.jams (genre, is_open, created_at desc);
create index if not exists idx_jam_members_user_id
  on public.jam_members (user_id);

-- (5) RLS tightened: members insert/delete OWN rows only.
-- Base allowed hosts to delete any member row; this replaces that with self-only.
-- Public read of open jams and all other base policies are unchanged.
drop policy if exists "members self or host delete" on public.jam_members;
drop policy if exists "members self delete" on public.jam_members;
create policy "members self delete" on public.jam_members
  for delete using (auth.uid() = user_id);

-- Re-assert (identical to base) so 002 alone guarantees the posture:
drop policy if exists "members self insert" on public.jam_members;
create policy "members self insert" on public.jam_members
  for insert with check (auth.uid() = user_id);
drop policy if exists "jams host update" on public.jams;
create policy "jams host update" on public.jams
  for update using (auth.uid() = host_id);

-- (4) atomic RPCs. SECURITY DEFINER + row lock; count changes via the base
-- bump_member_count() trigger (no manual bump here = no double-count).
create or replace function public.join_jam(p_jam_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_jam public.jams%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated.';
  end if;
  select * into v_jam from public.jams where id = p_jam_id for update;
  if not found then
    raise exception 'Jam not found.';
  end if;
  if not v_jam.is_open then
    raise exception 'Jam is closed.';
  end if;
  if exists (select 1 from public.jam_members where jam_id = p_jam_id and user_id = v_uid) then
    raise exception 'Already a member.';
  end if;
  if v_jam.member_count >= v_jam.max_members then
    raise exception 'Jam is full.';
  end if;
  insert into public.jam_members (jam_id, user_id) values (p_jam_id, v_uid);
end;
$$;

create or replace function public.leave_jam(p_jam_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated.';
  end if;
  if not exists (select 1 from public.jams where id = p_jam_id) then
    raise exception 'Jam not found.';
  end if;
  delete from public.jam_members where jam_id = p_jam_id and user_id = v_uid;
  if not found then
    raise exception 'Not a member.';
  end if;
end;
$$;

create or replace function public.close_jam(p_jam_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_host uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated.';
  end if;
  select host_id into v_host from public.jams where id = p_jam_id;
  if not found then
    raise exception 'Jam not found.';
  end if;
  if v_host is distinct from v_uid then
    raise exception 'Only the host can close this jam.';
  end if;
  update public.jams set is_open = false where id = p_jam_id;
end;
$$;

create or replace function public.reopen_jam(p_jam_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_host uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated.';
  end if;
  select host_id into v_host from public.jams where id = p_jam_id;
  if not found then
    raise exception 'Jam not found.';
  end if;
  if v_host is distinct from v_uid then
    raise exception 'Only the host can reopen this jam.';
  end if;
  update public.jams set is_open = true where id = p_jam_id;
end;
$$;

grant execute on function public.join_jam(uuid) to authenticated;
grant execute on function public.leave_jam(uuid) to authenticated;
grant execute on function public.close_jam(uuid) to authenticated;
grant execute on function public.reopen_jam(uuid) to authenticated;
