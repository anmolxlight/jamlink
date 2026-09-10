// ponytail: pure layout math, so the gapless-grid claim is provable instead of eyeballed

// A bento row is either one full-width tile or two half tiles. Rows are complete by
// construction, so no grid can ever render a hole (RN has no grid-auto-flow: dense).
export function bentoRows(count: number): number[][] {
  const rows: number[][] = [];
  if (count <= 0) return rows;
  rows.push([0]); // feature tile spans the full width
  for (let i = 1; i < count; i += 2) rows.push(count - i === 1 ? [i] : [i, i + 1]);
  return rows;
}

// Stable, readable picsum seed. Same jam always gets the same picture.
export function seedFor(...parts: string[]): string {
  const slug = parts.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'jamlink';
}

export function coverUrl(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${Math.round(w)}/${Math.round(h)}?grayscale`;
}

// ponytail: runnable check, npx tsx src/lib/layout.ts (node-free assert: Metro must bundle this file)
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const assert = { deepStrictEqual(a: unknown, b: unknown) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('assert failed'); }, strictEqual(a: unknown, b: unknown) { if (a !== b) throw new Error(`assert failed: ${String(a)} !== ${String(b)}`); }, ok(v: unknown, m = 'assert failed') { if (!v) throw new Error(m); } };
  assert.deepStrictEqual(bentoRows(0), []);
  assert.deepStrictEqual(bentoRows(1), [[0]]);
  assert.deepStrictEqual(bentoRows(2), [[0], [1]]);
  assert.deepStrictEqual(bentoRows(3), [[0], [1, 2]]);
  assert.deepStrictEqual(bentoRows(4), [[0], [1, 2], [3]]);
  assert.deepStrictEqual(bentoRows(5), [[0], [1, 2], [3, 4]]);
  // the gapless invariant: every tile placed once, in order, every row full
  for (let n = 0; n <= 24; n++) {
    const rows = bentoRows(n);
    const flat = rows.reduce<number[]>((acc, r) => acc.concat(r), []);
    assert.deepStrictEqual(flat, Array.from({ length: n }, (_, i) => i));
    assert.ok(rows.every((r) => r.length === 1 || r.length === 2), `row width broke at n=${n}`);
  }
  assert.strictEqual(seedFor('Late Night Lofi!', 'abc-123'), 'late-night-lofi-abc-123');
  assert.strictEqual(seedFor('', ''), 'jamlink');
  assert.strictEqual(coverUrl('lofi', 800, 600.4), 'https://picsum.photos/seed/lofi/800/600?grayscale');
  console.log('layout.ts self-check OK');
}
