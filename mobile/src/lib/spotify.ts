// ponytail: local copy of shared/spotify.ts (mobile cannot import outside its root)
export const GENRES = [
  'pop', 'hip-hop', 'rock', 'edm', 'rnb', 'kpop',
  'jazz', 'lofi', 'indie', 'classical', 'latin', 'afrobeats', 'other',
] as const;
export type Genre = (typeof GENRES)[number];

export function parseJamLink(url: string): { jamId: string | null; valid: boolean } {
  const u = url.trim();
  if (!/^https:\/\/open\.spotify\.com\//.test(u) && !/^spotify:/.test(u)) {
    return { jamId: null, valid: false };
  }
  const path = u.split(/[?#]/)[0]; // ponytail: pathname only, ?q=/jam/x must not count
  const m = path.match(/\/jam\/([A-Za-z0-9]+)/);
  if (m) return { jamId: m[1], valid: true };
  if (/open\.spotify\.com/.test(u)) return { jamId: null, valid: true }; // needs explicit title
  return { jamId: null, valid: false };
}

export function isValidJamPost(url: string, title: string): boolean {
  const { valid, jamId } = parseJamLink(url);
  if (!valid) return false;
  if (jamId) return true;
  return title.trim().length > 0; // non-jam spotify link requires explicit title
}

// ponytail: runnable check, npx tsx src/lib/spotify.ts
if (typeof require !== 'undefined' && require.main === module) {
  const assert = require('assert');
  assert.deepStrictEqual(parseJamLink('https://open.spotify.com/jam/abc123'), { jamId: 'abc123', valid: true });
  assert.strictEqual(parseJamLink('https://google.com/x').valid, false);
  assert.strictEqual(isValidJamPost('https://open.spotify.com/track/xyz', ''), false);
  assert.strictEqual(isValidJamPost('https://open.spotify.com/track/xyz', 'My jam'), true);
  console.log('spotify.ts self-check OK');
}
