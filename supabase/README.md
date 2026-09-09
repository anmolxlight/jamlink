# JamLink Supabase setup

## Apply schema (Dashboard paste)

1. Open your Supabase project > **SQL Editor** > New query.
2. Paste the full contents of `schema.sql` and **Run**.
3. Then paste `002_robust.sql` and **Run**. Order matters: base schema first,
   then 002 (002 assumes `profiles`/`jams`/`jam_members` + the genre check exist).
4. Then paste `003_expand.sql` and **Run**. Order matters: `schema.sql` →
   `002_robust.sql` → `003_expand.sql` (003 references `profiles`/`jams` and the
   RLS posture 002 leaves in place).
5. All three files are idempotent — re-run is safe. Expect success on a fresh project.
6. Verify: `select genre, count(*) from public.jams group by 1;` → 8 seed rows.

## RPC usage (both apps — prefer RPCs over direct `jam_members` writes)

Direct `jam_members` inserts still work (RLS: own rows only) and still bump
`member_count` via the base trigger, but the RPCs add closed/full/duplicate
guards — use them for join/leave:

```ts
// join (throws 'Jam is closed.' / 'Jam is full.' / 'Already a member.')
await sb.rpc("join_jam", { p_jam_id: jamId });
// leave (throws 'Not a member.')
await sb.rpc("leave_jam", { p_jam_id: jamId });
// host only (throw 'Only the host can ...')
await sb.rpc("close_jam", { p_jam_id: jamId });
await sb.rpc("reopen_jam", { p_jam_id: jamId });
```

New in 002: `handle_new_user()` auto-creates `profiles` rows on signup,
`updated_at` on `jams`/`profiles`, `jams.max_members` (default 50),
genre check re-asserted against the shared 13-genre list,
member deletes tightened to self-only, indexes on
`jams(genre, is_open, created_at)` + `jam_members(user_id)`.

New in 003: `jam_reports` (RLS: reporter inserts and reads own rows only, one
report per reporter per jam), `profiles.bio` (≤300 chars) +
`profiles.spotify_username`, `pg_trgm` GIN indexes on `jams(title)` and
`jams(description)` for `.ilike('title', '%term%')` search, and the
`trending_jams` view (open jams by `member_count desc, created_at desc`,
`security_invoker = on` so it respects `jams` RLS).

## Replace the seed host

Seed jams use placeholder host `00000000-0000-0000-0000-000000000001`.

- After a real user signs in, copy their `auth.users.id`, then:
  `update public.jams set host_id = '<real-uuid>' where host_id = '00000000-0000-0000-0000-000000000001';`
- Or delete seeds: `delete from public.jams where host_id = '00000000-0000-0000-0000-000000000001';`

## Env wiring (both apps, no secrets in repo)

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `web/.env.local` (get from Dashboard > Settings > API > Project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `web/.env.local` (same page > `anon` `public` key) |
| `EXPO_PUBLIC_SUPABASE_URL` | `mobile/.env` (same Project URL) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `mobile/.env` (same anon key) |

Never use the `service_role` key in app code.

## Auth

Dashboard > Authentication > Providers: enable **Email (magic link)** and **Google** (needs GCP client ID/secret) if required.
