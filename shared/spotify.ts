// Shared Spotify Jam link parse/validate — imported (or copied) by web/ and mobile/.
// ponytail: regex-only, no Spotify API call; add API lookup when abuse/typos matter.

export const GENRES = [
  "pop", "hip-hop", "rock", "edm", "rnb", "kpop", "jazz",
  "lofi", "indie", "classical", "latin", "afrobeats", "other",
] as const;
export type Genre = (typeof GENRES)[number];

export const isGenre = (g: string): g is Genre =>
  (GENRES as readonly string[]).includes(g);

export type JamParse =
  | { ok: true; jamId: string | null }
  | { ok: false; error: string };

const JAM_PATH_RE = /\/jam\/([A-Za-z0-9_-]+)/;

// Extract jam id from `.../jam/<id>` path; null when absent.
export function parseJamId(url: string): string | null {
  const m = JAM_PATH_RE.exec(url.trim());
  return m ? m[1] : null;
}

const SPOTIFY_HOST_RE = /(^|\.)spotify\.com$/i;

function isSpotifyWebUrl(u: URL): boolean {
  return (
    (u.protocol === "https:" || u.protocol === "http:") &&
    SPOTIFY_HOST_RE.test(u.hostname)
  );
}

// Validate per SPEC: must be a Spotify URL; a `/jam/<id>` link always
// qualifies; any other open.spotify.com link needs an explicit title.
// Rejects non-Spotify URLs.
export function validateJamLink(rawUrl: string, title = ""): JamParse {
  const url = rawUrl.trim();
  if (!url) return { ok: false, error: "Link is required." };
  if (/^spotify:/i.test(url)) {
    const jamId = parseJamId(url.replace(/^spotify:/i, "https://open.spotify.com/"));
    if (jamId) return { ok: true, jamId };
    if (title.trim()) return { ok: true, jamId: null };
    return { ok: false, error: "Spotify Jam link must contain /jam/<id> or include a title." };
  }
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, error: "Not a valid URL." };
  }
  if (!isSpotifyWebUrl(u)) return { ok: false, error: "Link must be a Spotify URL." };
  const jamId = parseJamId(u.pathname); // ponytail: path only — /jam/ in query/hash is not a jam link
  if (jamId) return { ok: true, jamId };
  if (u.hostname.toLowerCase() === "open.spotify.com" && title.trim())
    return { ok: true, jamId: null };
  return { ok: false, error: "Spotify Jam link must contain /jam/<id> or include a title." };
}
