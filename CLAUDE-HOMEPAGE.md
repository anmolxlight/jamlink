# JamLink homepage rebuild: niche, crazy, $50k (Claude Opus)

Do NOT ask questions. Decide and ship. No secrets in repo or output.

## First: read and obey this skill file strictly
`/home/ubuntu/.hermes/skills/ui-skills/gpt-taste/SKILL.md`
Follow ALL of it: the mandatory `<design_plan>` block with simulated Python RNG picks, AIDA structure, 2-line hero iron rule, gapless bento with `grid-flow-dense`, GSAP motion, meta-label ban, button contrast, no emojis anywhere (code, comments, UI).

Plus these locks (non-negotiable): dark theme only (underground listening-club vibe, near-black `#0a0a0a`, never pure black); ONE accent `#1DB954`; display font Cabinet Grotesk or Space Grotesk via `next/font` (never Inter, never a serif); zero em-dash characters in any UI string; `prefers-reduced-motion` respected; mobile collapse explicit.

## Scope: homepage `/` only (+ shared nav/footer)
Other routes (`/feed`, `/trending`, `/genre/[slug]`, `/search`, `/profile`, `/my-jams`, `/new`, `/login`, `/jam/[id]`) are OUT of scope except the shared nav/footer components. Supabase/backend/mobile are OUT of scope. Do not touch them.

## The page (AIDA, huge `py-32 md:py-48` chapter spacing, `overflow-x-hidden` on main)
- Nav: floating glass pill, logo + Explore/Trending/Genres/Search + Post a Jam CTA + Log in/Sign up (or avatar menu when authed). One 64px line.
- Attention: cinematic hero. Oversized display headline, max 2-3 lines in a `max-w-6xl` container, with small inline pill images INSIDE the headline. Copy angle: secret listening rooms, walk into any jam on earth. Exactly two CTAs (Post a Jam, Explore jams). Full-bleed picsum background (seeded, e.g. `concert-crowd-dark`) with dark radial wash + grain. No stamp badges, no pills under hero, no stats in hero.
- Interest: gapless bento (`grid-flow-dense`, 3-5 cells, mathematically interlocked, zero voids) covering: live open-jam count (REAL query, hidden when zero), genre tiles with real imagery, how joining works. Picsum seeds with `grayscale mix-blend-luminosity contrast-125` treatment.
- Desire: ONE marquee only (genre words strip). Then a GSAP pinned section: pinned left title + scrolling jam cards right (`ScrollTrigger pin: true`, real data, honest empty state). Then a scrub text-reveal paragraph (opacity 0.1 to 1 word by word).
- Action: massive footer CTA (Post the first jam / Explore) + clean footer links.
- Hover physics on every card (`group-hover:scale-105 duration-700` in `overflow-hidden`). GSAP via `@gsap/react` + `ScrollTrigger`, isolated client components with cleanup. No `window.addEventListener('scroll')` anywhere.

## Done criteria
- `npm run build` passes in `web/`. Then `git add -A && git commit` (message: `Homepage rebuild`) AND `git push` (push deploys via the Vercel git link).
- Report: the design_plan picks, files changed, build result, anything skipped.
