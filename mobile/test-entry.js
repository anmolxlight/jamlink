#!/usr/bin/env node
// ponytail: the v0.1.2-v0.1.6 launch crash was a silent build-time bug -- the APK
// built green, installed fine, and died instantly because nothing registered the
// root component. Nothing in the toolchain warns about it. This does.
// Source-grep, not a bundle build, so it runs in ~1s before gradle.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { resolveEntryPoint } = require('@expo/config/paths');

const root = __dirname;
const MAIN_ACTIVITY = path.join(root, 'android/app/src/main/java/com/jamlink/app/MainActivity.kt');

for (const platform of ['android', 'ios']) {
  const entry = resolveEntryPoint(root, { platform });
  const src = fs.readFileSync(entry, 'utf8');
  assert.ok(
    /registerRootComponent\s*\(/.test(src),
    `${platform}: entry ${path.relative(root, entry)} never calls registerRootComponent(), so ` +
      `AppRegistry.registerComponent('main', ...) never runs and the app dies at launch with ` +
      `'Invariant Violation: "main" has not been registered.'`
  );
}

// The JS key registerRootComponent uses is hardcoded to 'main'; if a prebuild ever
// regenerates MainActivity with a different component name they stop matching.
if (fs.existsSync(MAIN_ACTIVITY)) {
  const name = /getMainComponentName\(\)\s*:\s*String\s*=\s*"([^"]+)"/.exec(
    fs.readFileSync(MAIN_ACTIVITY, 'utf8')
  );
  assert.ok(name, 'MainActivity.kt: could not find getMainComponentName()');
  assert.strictEqual(
    name[1],
    'main',
    `MainActivity registers component "${name?.[1]}" but expo's registerRootComponent always ` +
      `registers 'main' -- they must match or the app launches into a crash`
  );
}

console.log('entry check ok: root component is registered as "main"');
