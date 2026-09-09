import { StyleSheet } from 'react-native';

// ponytail: single source of truth for the dark Spotify-adjacent theme
export const colors = {
  bg: '#121212',
  surface: '#1e1e1e',
  card: '#282828',
  text: '#ffffff',
  muted: '#b3b3b3',
  accent: '#1DB954',
  accentText: '#000000',
  danger: '#e22134',
  border: '#333333',
  input: '#2a2a2a',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 6, md: 12, lg: 16, pill: 999 } as const;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.lg },
  title: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  body: { color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, fontSize: 13 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.input, color: colors.text, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginTop: spacing.xs,
  },
  label: { color: colors.text, fontWeight: '600', marginTop: spacing.md },
  error: { color: colors.danger, marginTop: spacing.xs, fontSize: 13 },
  banner: { backgroundColor: '#3a1518', borderRadius: radius.sm, padding: spacing.sm, marginVertical: spacing.sm },
  bannerText: { color: '#ff8a8a', fontSize: 13 },
  bigButton: { backgroundColor: colors.accent, borderRadius: radius.pill, padding: spacing.md, alignItems: 'center', marginVertical: spacing.md },
  bigButtonText: { color: colors.accentText, fontWeight: 'bold', fontSize: 16 },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, marginRight: spacing.sm, backgroundColor: colors.card },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // ponytail: hand-rolled tab bar, no navigation lib for 4 tabs
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  tabItem: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  tabLabel: { fontSize: 13 },
  backButton: { minHeight: 44, justifyContent: 'center', paddingRight: spacing.md },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  trendTile: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginRight: spacing.sm, width: 160 },
  rank: { color: colors.accent, fontWeight: 'bold', fontSize: 13 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginRight: spacing.sm },
  statValue: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  smallButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  smallButtonText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: spacing.md, marginBottom: spacing.sm },
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
