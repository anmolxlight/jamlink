// Homepage stats strip. Pure so it can be checked without a browser or a DB.
// Rule: the strip only renders when there is something real to show. An empty
// database shows nothing rather than three zeroes pretending to be traction.
import type { Jam } from "./supabase";

export type Stats = { openJams: number; members: number; genres: number };

export function jamStats(jams: Pick<Jam, "genre" | "member_count">[]): Stats {
  return {
    openJams: jams.length,
    members: jams.reduce((n, j) => n + (j.member_count ?? 0), 0),
    genres: new Set(jams.map((j) => j.genre)).size,
  };
}

export function hasStats(s: Stats): boolean {
  return s.openJams > 0;
}
