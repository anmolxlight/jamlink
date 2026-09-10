# JamLink Android: full UI/UX redesign (Claude Opus)

Do NOT ask questions. Take the time you need. No secrets in repo or output. Zero em-dash characters in UI strings.

## Design law
Read and obey `/home/ubuntu/.hermes/skills/ui-skills/gpt-taste/SKILL.md` strictly, with pre-flight checks per screen. Translate to RN: no GSAP, Motion is CSS-only, gradients are fine. Dark `#0a0a0a` locked, accent `#1DB954` only, Space Grotesk via expo-font or system heavy weights. Pictures: picsum seeds, grayscale blend.

## Scope
Every mobile screen: Feed, Search, Post, Profile, Login, JamDetail, tab bar. Same backend, same RPCs, same navigation state in App.tsx. No new native deps. No behavior changes except look, motion, and empty states.

## Launch landmines (do NOT regress)
- `mobile/index.js` must keep AppRegistry registration, package.json main stays pointed at it.
- Env reads stay static `process.env.EXPO_PUBLIC_*` (Metro inlines them; dynamic access crashes release builds).
- No node-only imports anywhere under mobile/src (no assert, fs, path). Self-checks keep the node-free shim pattern.
- `npx tsc --noEmit` clean in mobile/ before commit.

## Done
Commit, push, trigger `gh workflow run android.yml`, verify green, cut release v0.1.8 with the APK. Report pre-flight results per screen.