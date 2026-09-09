# JamLink /new rebuild + auth gate (Claude Opus)

Do NOT ask questions. Decide and ship. No secrets in repo or output. Zero em-dash characters in UI strings. Dark only, accent `#1DB954` locked, Space Grotesk display already in project.

Look at these two phone screenshots FIRST (they are the current state):
- `/home/ubuntu/.hermes/cache/images/img_4a4de3805b0a.jpg` (feed)
- `/home/ubuntu/.hermes/cache/images/img_7d23771b19e4.jpg` (`/new` form, the thing being rebuilt)

## Fix 1 — auth gate with return-to (root cause, one place)
Posting and joining require login, but logged-out users land on the raw form. Gate centrally: logged-out visit to `/new` redirects to `/login?next=/new`; logged-out tap on any Join button redirects to `/login?next=/jam/[id]`; after the auth callback exchanges the session, honor `next` (validate it is an internal path, default `/feed`). Put the session check in one helper every protected action routes through, not per-page copies.

## Fix 2 — rebuild `/new` with taste (the screenshots show why)
Current page is a plain stacked form with a bare `<select>` AND a real bug visible in the screenshot: red error borders and messages on pristine untouched fields. Kill both.
New `/new`: split screen on desktop (sticky left panel + form right), single column on mobile.
- Left: display heading (max 2 lines), one-line sub, and a LIVE jam preview card that updates as they type (title, genre chip, parsed jam id artwork via existing picsum helper, Spotify button enabled only when the link validates). Empty-input state shows a ghost preview, never errors.
- Right: Title (counter), Spotify link (paste-from-clipboard button, validation ONLY after blur or submit attempt, never red on pristine), genre as a pill grid of all 13 (no dropdown), description (counter), full-width submit CTA with idle/loading/success states + toast + redirect to the new jam page on success.
- Taste pre-flight on the page (contrast, one intent per CTA, no em-dashes, no meta labels, focus rings, reduced motion).

## Fix 3 — mobile parity (small)
Post screen: same validate-after-touch behavior; login gate navigates to Login and returns after auth. `npx tsc --noEmit` clean.

## Done criteria
- `npm run build` passes in `web/`. Then `git add -A && git commit` (`Post gate + rebuild`) AND `git push`.
- Report: gate helper path + how `next` is validated, files changed, build result, anything skipped.
