// Shared contract copy (mirrors shared/spotify.ts): genres + Spotify jam validation.
export const GENRES = ["pop","hip-hop","rock","edm","rnb","kpop","jazz","lofi","indie","classical","latin","afrobeats","other"] as const;
export type Genre = (typeof GENRES)[number];

// ponytail: slug === genre string for all 13, so no slug map is needed.
export function isGenre(slug: string): slug is Genre {
  return (GENRES as readonly string[]).includes(slug);
}

export const GENRE_LABEL: Record<Genre, string> = {
  pop: "Pop",
  "hip-hop": "Hip Hop",
  rock: "Rock",
  edm: "EDM",
  rnb: "R&B",
  kpop: "K-Pop",
  jazz: "Jazz",
  lofi: "Lo-Fi",
  indie: "Indie",
  classical: "Classical",
  latin: "Latin",
  afrobeats: "Afrobeats",
  other: "Other",
};

export const GENRE_BLURB: Record<Genre, string> = {
  pop: "Hooks, choruses and everything on repeat.",
  "hip-hop": "Bars, beats and late night cyphers.",
  rock: "Guitars up, windows down.",
  edm: "Four on the floor until sunrise.",
  rnb: "Slow burners and smooth grooves.",
  kpop: "Choreo ready sets from Seoul and beyond.",
  jazz: "Standards, solos and blue notes.",
  lofi: "Study beats and rainy window loops.",
  indie: "Small labels, big feelings.",
  classical: "Strings, keys and full orchestras.",
  latin: "Reggaeton, salsa and everything that moves.",
  afrobeats: "Lagos to the world, all rhythm.",
  other: "Everything that refuses a label.",
};

export function parseJamId(url: string): string | null {
  const u = url.trim();
  const uri = u.match(/spotify:.*?jam:([A-Za-z0-9]+)/);
  if (uri) return uri[1];
  const path = u.split(/[?#]/)[0]; // ponytail: pathname only, ?q=/jam/x must not count
  const m = path.match(/open\.spotify\.com.*\/jam\/([A-Za-z0-9]+)/);
  return m ? m[1] : null;
}

// Valid if: Spotify URL (open.spotify.com or spotify:) AND (has /jam/ id OR ?si= invite OR explicit title given)
export function validateSpotifyJam(url: string, title = ""): { ok: boolean; error?: string } {
  const u = url.trim();
  if (!/^https:\/\/open\.spotify\.com\//.test(u) && !/^spotify:/.test(u)) return { ok: false, error: "Must be a Spotify link (open.spotify.com or spotify:)." };
  if (parseJamId(u)) return { ok: true };
  if (/[?&]si=/.test(u)) return { ok: true };
  if (/open\.spotify\.com/.test(u) && title.trim().length > 0) return { ok: true };
  return { ok: false, error: "Link must contain /jam/<id> or a ?si= invite, or add an explicit title." };
}
