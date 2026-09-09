# JamLink fix batch (Claude Opus)

Do NOT ask questions. Decide and ship. No secrets in repo or output. Zero em-dash characters in any UI string.

## What changed since last build
- Live DB is now EMPTY: all 8 seed jams, the seed profile, and the seed auth user are deleted. Every list/empty state must look intentional with zero rows.
- Supabase `site_url` is already `https://web-one-theta-69.vercel.app`. Code must not fight it.

## Fix 1 — real homepage + auth nav (taste skill, full pre-flight)
`/` is currently the raw feed. Rebuild it as a homepage: move the existing feed page as-is to `/feed`. New `/` (dark, accent `#1DB954` locked, Geist):
nav (single line, <=72px: logo, Explore, Trending, Genres, Search, Post a Jam CTA, and auth-aware right side: logged out shows Log in + Sign up buttons, logged in shows avatar/menu with Profile, My Jams, Log out) + hero (headline max 2 lines, subtext max 20 words, primary CTA Post a Jam, secondary Explore jams) + live stats strip (REAL counts queried from DB: open jams, members, genres covered; if zero, show the strip only when counts exist, never fake numbers) + trending preview (real top rows, honest empty state otherwise) + 13-genre grid linking `/genre/[slug]` + 3-step how-it-works (verb-led, no Stage/Step labels) + footer. Run the taste pre-flight (eyebrow count, one intent per CTA, button contrast, no AI tells) and fix every fail. Old `/` sharers: add nothing, `/feed` is the new home of the feed.

## Fix 2 — magic link actually works in prod
Root causes to kill: (a) no `emailRedirectTo`, defaulting to localhost; (b) likely no code-exchange callback route. Do both: pass `emailRedirectTo: window.location.origin` (dev falls back to localhost automatically, prod uses the prod origin, no hardcoded URLs) AND add `/auth/callback` route that exchanges the `?code=` for a session and redirects to `/feed` (use whatever exchange API the installed `@supabase/supabase-js`/`@supabase/ssr` version supports, check package.json first). Login page becomes one combined Sign up / Log in screen with copy stating the same link both creates and opens the account. Verify the full flow by reading the code path end to end (send-link click constructs redirectTo from current origin, callback exchanges + sets session + redirects).

## Fix 3 — empty states + mobile parity
DB is empty: feed, trending, genre, search, profile, my-jams each get a composed empty state with a Post-a-Jam CTA (no dead pages). Mobile: mirror the empty states + add a note on Login that the email link opens in browser; native deep-link session capture is explicitly out of scope.

## Done criteria
- `npm run build` passes in `web/`; `npx tsc --noEmit` clean in `mobile/`.
- Report: files changed, the exact auth flow (redirectTo value, callback route behavior), pre-flight fails fixed, anything skipped.
