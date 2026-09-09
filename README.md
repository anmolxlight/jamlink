# JamLink

Every open Spotify jam, in one place. Post your jam link under a genre, browse open rooms, or hit random and land in a stranger's listening session.

**Live:** https://web-one-theta-69.vercel.app · **Android:** [Releases](https://github.com/anmolxlight/jamlink/releases) · **API/DB:** Supabase (Mumbai)

## Monorepo

| Dir | What |
|---|---|
| `web/` | Next.js 16 + Tailwind v4 site. Homepage, feed, trending, genre pages, search, profiles, post form, magic-link auth. Auto-deploys to Vercel on push to `master`. |
| `mobile/` | Expo RN (TS) app. Same flows, bottom tabs, deep links into Spotify. |
| `supabase/` | `schema.sql` → `002_robust.sql` → `003_expand.sql`. Apply in order. Tables, RLS, atomic `join_jam` / `leave_jam` / `close_jam` / `reopen_jam` RPCs, reports, search indexes, trending view. |
| `shared/` | Spotify link parse + validate (single source of truth, copied into both apps). |
| `.github/workflows/android.yml` | Manual GitHub Action that builds a debug APK (EAS alternative kept in `mobile/eas.json`). |

## Run it locally

```bash
# web
cd web && npm install && npm run dev   # needs .env.local, see .env.example

# mobile
cd mobile && npm install && npx expo start
```

Env vars (both apps, Supabase Dashboard → Settings → API):

```bash
NEXT_PUBLIC_SUPABASE_URL=...        # web
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # web
EXPO_PUBLIC_SUPABASE_URL=...        # mobile
EXPO_PUBLIC_SUPABASE_ANON_KEY=...   # mobile
```

Without keys both apps render a "not connected" notice instead of crashing.

## Backend setup

1. New Supabase project → SQL Editor → run `supabase/schema.sql`, then `002_robust.sql`, then `003_expand.sql`. All idempotent.
2. Auth → URL Configuration: `Site URL` = your prod domain, `Redirect URLs` += `https://<prod>/**` and `http://localhost:3000/**`.
3. Magic links work with the default mailer (rate limited). Custom SMTP when you outgrow it.

Joins go through the `join_jam` RPC (rejects closed, full, and duplicate joins atomically). Never insert into `jam_members` directly.

## Notes

- Design: dark only, one accent `#1DB954`, Space Grotesk, no emojis.
- Debug APKs: `gh workflow run android.yml` → Artifacts, or Releases for tagged builds.
