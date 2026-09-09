# JamLink expansion build (Claude Opus team)

Do NOT ask questions. Decide and ship. No secrets in the repo or in any commit. Never print secrets.

## Repo map (/home/ubuntu/jamlink)
- `web/` Next.js 16 + Tailwind v4 app (routes: `/`, `/new`, `/jam/[id]`, `/login`). Builds clean, deployed on Vercel.
- `mobile/` Expo RN TS app (Feed/Post/JamDetail/Login in `App.tsx`, theme in `src/theme.ts`). `tsc --noEmit` clean.
- `supabase/schema.sql` + `supabase/002_robust.sql` (profiles/jams/jam_members, RLS, join_jam/leave_jam/close_jam/reopen_jam RPCs, 8 seed jams). `shared/spotify.ts` validation.
- Design: dark Spotify-adjacent, ONE locked accent `#1DB954`, Geist. Zero em-dash characters in any UI string. Contrast WCAG AA, skeletons for loading, toasts for transient feedback, `prefers-reduced-motion` respected.

## Method
Use your subagents heavily: fan out parallel tracks for web, mobile, and backend, then integrate. Keep every track green at all times.

## Track A — web: more screens, richer UI
Add (keep existing routes working, same slugs): `/trending` (leaderboard ranked by members, animated rank rows), `/genre/[slug]` (one page per each of the 13 genres, hero header + jam grid), `/search` (live title search), `/profile` (own stats: hosted jams, joined jams, leave/close actions), `/my-jams`. Feed upgrades: animated equalizer-bar motif on cards (CSS only), genre chips with live counts, staggered card entry via motion. Every new route gets `loading.tsx` + `error.tsx` + empty state. Verify with `npm run build` in `web/`.

## Track B — mobile: tab nav + new screens
Bottom tabs (Feed/Search/Post/Profile) replacing the useState router, plus a Trending section on Feed and a Profile screen (stats + my jams + leave/close). Same theme.ts tokens. Verify with `npx tsc --noEmit` in `mobile/`.

## Track C — backend: additive only
New file `supabase/003_expand.sql` (idempotent, never edit schema.sql or 002): `jam_reports` table (reporter, jam, reason, RLS self-insert), `profiles.bio` + `profiles.spotify_username` nullable, `pg_trgm` search index on jams(title, description), `trending_jams` view (open jams ordered by member_count desc, created_at desc). Re-read all three SQL files for order/syntax when done.

## Done criteria
- `npm run build` passes in web, `tsc --noEmit` clean in mobile, SQL files mutually consistent.
- End with a short report: files added/changed per track, verification output, anything skipped.
