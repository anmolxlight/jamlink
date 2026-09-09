import { Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, styles } from './theme';

// ponytail: shared banner + empty state in one file, no component lib
export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

export function EmptyState({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={{ padding: spacing.xl, alignItems: 'center' }}>
      <Text style={{ color: colors.muted, textAlign: 'center', marginBottom: spacing.sm }}>{message}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} style={{ padding: spacing.sm }}>
          <Text style={{ color: colors.accent, fontWeight: 'bold' }}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function SkeletonRow() {
  return (
    <View style={[styles.card, { opacity: 0.5 }]}>
      <View style={{ height: 14, backgroundColor: colors.border, borderRadius: 4, marginBottom: 6 }} />
      <View style={{ height: 12, width: '60%', backgroundColor: colors.border, borderRadius: 4 }} />
    </View>
  );
}
