// Return-to path handling for the auth gate. Pure and dependency free so it can
// be checked with node (see safe-next.check.mjs); the session half lives in gate.ts.

// Internal paths only. "https://evil.com" and "//evil.com" are open redirects,
// and "/\evil.com" is the backslash twin browsers normalise into "//".
export function safeNext(raw: string | null | undefined, fallback = "/feed"): string {
  if (!raw || !raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

export const loginHref = (next: string) => `/login?next=${encodeURIComponent(safeNext(next))}`;
