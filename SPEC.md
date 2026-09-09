# JamLink — random Spotify jams by genre

Monorepo: `web/` (Next.js 16 + Tailwind v4, deploys to Vercel), `mobile/` (Expo RN),
`supabase/schema.sql` (single source of truth for DB), `shared/spotify.ts` (link parse/validate).

## What it does
- Post a Spotify Jam link under a genre. Browse jams by genre. One-tap "Random jam" joins a random open jam.
- Auth via Supabase (email magic link + Google if configured). Posting/joining requires login. Browsing is public.

## Shared contract (DO NOT drift — all three tracks import this shape)
- Genres (closed list): `pop hip-hop rock edm rnb kpop jazz lofi indie classical latin afrobeats other`
- Spotify Jam link: `https://open.spotify.com/...` or `spotify:...` containing `/jam/` or `?si=` invite. Validate with regex in `shared/spotify.ts`: must parse a jam ID from path `.../jam/<id>` or accept any `open.spotify.com` link + explicit title. Reject non-Spotify URLs.
- Tables (`supabase/schema.sql` owns DDL; apps use these columns only):
  - `profiles(id uuid PK = auth.users.id, display_name text, avatar_url text, created_at timestamptz)`
  - `jams(id uuid PK default gen_random_uuid(), host_id uuid FK profiles, title text NOT NULL, spotify_url text NOT NULL, genre text NOT NULL check in list, description text default '', is_open boolean default true, member_count int default 1, created_at timestamptz)`
  - `jam_members(jam_id FK, user_id FK profiles, joined_at, PK(jam_id,user_id))`
- RLS: public read on open jams; authenticated insert on jams (host_id = auth.uid()); members insert own rows; host or self can delete membership; trigger bumps `member_count`.
- Env (both apps): `EXPO_PUBLIC_` / `NEXT_PUBLIC_SUPABASE_URL`, `..._SUPABASE_ANON_KEY`. Never commit secrets.

## Track A — web/ (Next.js, Vercel)
- `create-next-app web --typescript --tailwind --app --src-dir`. Pages: `/` feed (genre chips + cards + Random button), `/new` post form, `/jam/[id]` detail with Join button + embedded Spotify link, `/login` magic link. Supabase SSR client, realtime insert subscription on feed. Dark theme. `npm run build` must pass.

## Track B — mobile/ (Expo)
- `npx create-expo-app mobile -t expo-template-blank-typescript`. Screens: Feed, Post, JamDetail, Login. Same Supabase project, same genres, import shared parse logic (copy of `shared/spotify.ts`). `npx expo export` or `tsc --noEmit` must pass.

## Track C — supabase/
- `schema.sql`: extensions, tables, RLS, trigger, seed (8 sample open jams across genres, host = placeholder uuid, clearly marked). Plus `README.md`: paste-into-dashboard steps + wiring env keys. Idempotent (`if not exists` / `drop policy if exists` where needed).

## Done criteria
- `web` builds, `mobile` typechecks, `schema.sql` applies on a fresh Supabase project with no errors, no secrets in repo.
- Do NOT ask questions. Decide and ship.
