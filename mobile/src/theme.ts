import { Platform, StyleSheet, type TextStyle } from 'react-native';

// ponytail: single source of truth. Locked near-black canvas, one accent, no second hue.
export const colors = {
  bg: '#0a0a0a',
  surface: '#101010',
  card: '#141414',
  raised: '#1a1a1a',
  line: '#1f1f1f',
  lineStrong: '#2e2e2e',
  text: '#f2f2f2',
  muted: '#8f8f8f',
  dim: '#5a5a5a',
  accent: '#1DB954',
  accentInk: '#05130a', // near-black on accent fills, never white on green
  // status only, never used as an accent or a decoration
  danger: '#ff6b6b',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 40, section: 56 } as const;
export const radius = { sm: 8, md: 14, lg: 22, xl: 30, pill: 999 } as const;
export const gutter = 20;

// ponytail: Android quietly ignores fontWeight 900 on the default family; the Roboto
// Black family alias is the only way to a real display weight without shipping a font.
const heavy: TextStyle = Platform.OS === 'android' ? { fontFamily: 'sans-serif-black' } : { fontWeight: '900' };

export const typo = StyleSheet.create({
  display: { ...heavy, color: colors.text, fontSize: 40, lineHeight: 43, letterSpacing: -1.4 },
  h1: { ...heavy, color: colors.text, fontSize: 28, lineHeight: 31, letterSpacing: -0.9 },
  h2: { ...heavy, color: colors.text, fontSize: 19, lineHeight: 23, letterSpacing: -0.4 },
  h3: { color: colors.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  micro: { color: colors.dim, fontSize: 12, lineHeight: 17 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.8 },
  numeral: { ...heavy, color: colors.accent, fontSize: 13, letterSpacing: 0.4 },
  wordmark: { ...heavy, color: colors.text, fontSize: 17, letterSpacing: 2.4 },
});

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  gutter: { paddingHorizontal: gutter },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },

  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  tile: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },

  // buttons: dark ink on accent, light text on dark. No invisible label anywhere.
  solid: { backgroundColor: colors.accent, borderRadius: radius.pill, minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  solidText: { color: colors.accentInk, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  ghost: { backgroundColor: 'transparent', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineStrong, minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  ghostText: { color: colors.text, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  small: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineStrong },
  smallText: { color: colors.text, fontWeight: '700', fontSize: 13 },

  chip: { paddingHorizontal: spacing.lg, minHeight: 40, justifyContent: 'center', borderRadius: radius.pill, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: colors.accentInk, fontSize: 13, fontWeight: '800' },

  field: { color: colors.text, fontSize: 17, paddingVertical: spacing.md, paddingHorizontal: 0, borderBottomWidth: 1, borderBottomColor: colors.lineStrong },
  fieldOn: { borderBottomColor: colors.accent },
  error: { color: colors.danger, marginTop: spacing.xs, fontSize: 12, lineHeight: 17 },

  banner: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', marginVertical: spacing.md },
  bannerBar: { width: 3, backgroundColor: colors.danger },
  bannerText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19, padding: spacing.md },

  // minimal split nav: wordmark left, one control right
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: gutter, paddingTop: spacing.sm, paddingBottom: spacing.md },
  navDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginRight: spacing.sm },
  backPill: { flexDirection: 'row', alignItems: 'center', minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineStrong },
  backText: { color: colors.text, fontSize: 13, fontWeight: '700' },

  // floating glass pill tab bar, in flow so nothing overlaps the scroll
  dock: { paddingHorizontal: gutter, paddingTop: spacing.sm, paddingBottom: spacing.md, backgroundColor: colors.bg },
  dockPill: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, padding: 5 },
  tabItem: { flex: 1, minHeight: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tabItemOn: { backgroundColor: colors.accent },
  tabLabel: { fontSize: 13, fontWeight: '700', color: colors.muted },
  tabLabelOn: { color: colors.accentInk, fontWeight: '800' },
});

// ponytail: naive relative time, no dep
export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 30) return `${Math.floor(d)}d ago`;
  return new Date(iso).toLocaleDateString();
}
