import type { Jam } from './supabase';

// ponytail: pure so it gets a runnable check; member_count desc, newest wins ties
export function rankTrending<T extends Pick<Jam, 'member_count' | 'created_at'>>(jams: T[], limit = 10): T[] {
  return [...jams]
    .sort((a, b) => b.member_count - a.member_count || b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

// ponytail: runnable check, npx tsx src/lib/trending.ts
if (typeof require !== 'undefined' && require.main === module) {
  const assert = require('assert');
  const j = (member_count: number, created_at: string) => ({ member_count, created_at });
  assert.deepStrictEqual(
    rankTrending([j(1, '2024-01-01T00:00:00Z'), j(5, '2024-01-01T00:00:00Z')]),
    [j(5, '2024-01-01T00:00:00Z'), j(1, '2024-01-01T00:00:00Z')],
  );
  assert.deepStrictEqual(
    rankTrending([j(3, '2024-01-01T00:00:00Z'), j(3, '2024-06-01T00:00:00Z')]),
    [j(3, '2024-06-01T00:00:00Z'), j(3, '2024-01-01T00:00:00Z')],
  );
  assert.strictEqual(rankTrending([j(1, 'a'), j(2, 'b'), j(3, 'c')], 2).length, 2);
  assert.deepStrictEqual(rankTrending([]), []);
  console.log('trending.ts self-check OK');
}
