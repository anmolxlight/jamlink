# JamLink Android: app not opening, find the launch crash and fix it (Claude Opus)

Do NOT ask questions. No secrets in repo output or chat (GitHub Secrets + `~/.hermes/.env` hold keys; pass as CLI args, never print).

## Symptom
Release APK installs but never opens (instant close) on a real phone, across v0.1.2 through v0.1.6-test.

## History (verify with `git log`, don't trust blindly)
- v0.1.2: release build, bundled JS confirmed inside (`index.android.bundle` present).
- v0.1.3 (`567aef0`): static `process.env.EXPO_PUBLIC_*` access in `mobile/src/lib/supabase.ts` (Metro can't inline dynamic `process.env[key]`).
- v0.1.4 (`65d684e`): Expo SDK 52 to 53 (RN 0.79, 16KB page compliant).
- v0.1.5 (`acf2568`): stable release signing key in CI.
- v0.1.6-test (`914cc88`): minimal-screen crash isolation build.
- CI also gained cloud-emulator + logcat capture (`4bb1ffa`, `6d5eab8`, `21ae4ae`). Those logs are the fastest path to the stack trace.

## Method
1. `gh run list --repo anmolxlight/jamlink` across workflows; download the newest logcat artifact or `--log` and find the launch crash stack (`AndroidRuntime`, `FATAL`, `Hermes`, `SoLoader`, `16KB` alignment errors on Android 15+).
2. ONE hypothesis per cycle. Fix in repo, commit, push, `gh workflow run`, verify green + new test release.
3. Suspects: native lib failing to load (16KB page alignment on SDK<53-era artifacts, stale `android/` dir if prebuild isn't clean), `MainApplication`/`MainActivity` mismatch from the SDK 53 upgrade, splash-screen API removal, `expo-asset` plugin ordering, missing `react-native-screens`/`safe-area-context` native linkage after upgrade (check `package.json` vs SDK 53 requirements with `npx expo install --check` semantics, but do NOT run a full SDK upgrade again).

## Done
Phone-openable APK in a new release (v0.1.7+). Report: stack trace found, root cause, fix, run id, release URL.
