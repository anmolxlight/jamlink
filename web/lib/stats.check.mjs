// ponytail: one assert-based self-check for the homepage stats strip.
// Run: node lib/stats.check.mjs
import { hasStats, jamStats } from "./stats.ts";

const j = (genre, member_count) => ({ genre, member_count });

const empty = jamStats([]);
console.assert(empty.openJams === 0 && empty.members === 0 && empty.genres === 0, "empty stats are all zero");
console.assert(!hasStats(empty), "empty DB hides the strip");

const s = jamStats([j("pop", 3), j("pop", 0), j("lofi", 2)]);
console.assert(s.openJams === 3, `openJams counts rows, got ${s.openJams}`);
console.assert(s.members === 5, `members sums member_count, got ${s.members}`);
console.assert(s.genres === 2, `genres counts distinct, got ${s.genres}`);
console.assert(hasStats(s), "non-empty DB shows the strip");

// A jam nobody has joined is still an open jam and still covers its genre.
const solo = jamStats([j("jazz", 0)]);
console.assert(solo.openJams === 1 && solo.members === 0 && solo.genres === 1, "zero-member jam still counts");
console.assert(hasStats(solo), "zero members does not hide the strip");

console.log("stats ok");
