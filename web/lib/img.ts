// Seeded placeholder art. Same seed always returns the same photo, so the layout
// never reshuffles between renders.
export const picsum = (seed: string, w = 1600, h = 900) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
