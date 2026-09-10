import { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, Image, StyleSheet, Text, TouchableOpacity, View,
  type StyleProp, type ViewStyle,
} from 'react-native';
import { coverUrl } from './lib/layout';
import { colors, radius, spacing, styles, typo } from './theme';

const SCREEN_W = Dimensions.get('window').width;

// ponytail: the whole kit lives in one file. No component library, no gradient
// native module: a stack of flat layers is a gradient the moment you step it finely.
export function Wash({ steps = 20, from = 0, to = 0.96, color = colors.bg, style }: {
  steps?: number; from?: number; to?: number; color?: string; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {Array.from({ length: steps }, (_, i) => (
        <View
          key={i}
          style={{ flex: 1, backgroundColor: color, opacity: from + (to - from) * Math.pow(i / (steps - 1), 1.8) }}
        />
      ))}
    </View>
  );
}

// Seeded grayscale picture under a dark wash. Never a raw stock photo.
export function Cover({ seed, height, width = SCREEN_W, dim = 0.32, wash = 0.96, washSteps = 18, round, style, children }: {
  seed: string; height: number; width?: number; dim?: number; wash?: number; washSteps?: number;
  round?: number; style?: StyleProp<ViewStyle>; children?: React.ReactNode;
}) {
  return (
    <View style={[{ height, backgroundColor: colors.surface, overflow: 'hidden', borderRadius: round }, style]}>
      <Image source={{ uri: coverUrl(seed, width * 2, height * 2) }} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: dim }]} />
      {/* ponytail: a stepped wash costs one view per step, so list thumbnails pass
          washSteps={0} and settle for the flat scrim above. 50 rows, not 1000 views. */}
      {washSteps > 0 ? <Wash to={wash} steps={washSteps} /> : null}
      {children}
    </View>
  );
}

// Entrance motion: rise and fade, staggered by delay. Native driver, so it never
// touches the JS thread while a list is scrolling.
export function Reveal({ delay = 0, style, children }: { delay?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(v, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// ponytail: animate the touchable itself, not a child wrapper, so a caller can pass
// flex: 1 and still get the press scale. Two nested views would break one or the other.
const Touchable = Animated.createAnimatedComponent(TouchableOpacity);

// Press physics: everything tappable reacts. Same a11y surface as TouchableOpacity.
export function Press({ onPress, disabled, style, children, accessibilityLabel, accessibilityHint }: {
  onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; children: React.ReactNode;
  accessibilityLabel?: string; accessibilityHint?: string;
}) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (toValue: number) => Animated.spring(s, { toValue, useNativeDriver: true, speed: 45, bounciness: 0 }).start();
  return (
    <Touchable
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => to(0.975)}
      onPressOut={() => to(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={[style, { transform: [{ scale: s }] }]}>
      {children}
    </Touchable>
  );
}

export function Solid({ label, onPress, disabled, style }: { label: string; onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Press onPress={onPress} disabled={disabled} accessibilityLabel={label} style={[styles.solid, disabled && { opacity: 0.55 }, style]}>
      <Text style={styles.solidText}>{label}</Text>
    </Press>
  );
}

export function Ghost({ label, onPress, disabled, style }: { label: string; onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Press onPress={onPress} disabled={disabled} accessibilityLabel={label} style={[styles.ghost, disabled && { opacity: 0.55 }, style]}>
      <Text style={styles.ghostText}>{label}</Text>
    </Press>
  );
}

export function Eyebrow({ children }: { children: string }) {
  return <Text style={typo.eyebrow}>{children.toUpperCase()}</Text>;
}

export function SectionHead({ title, meta, top = spacing.section }: { title: string; meta?: string; top?: number }) {
  return (
    <View style={{ marginTop: top, marginBottom: spacing.lg }}>
      <View style={styles.rowBetween}>
        <Text style={typo.h1} numberOfLines={1}>{title}</Text>
        {meta ? <Text style={typo.micro}>{meta}</Text> : null}
      </View>
      <View style={[styles.hairline, { marginTop: spacing.md }]} />
    </View>
  );
}

// Continuous ticker. Decorative only, so it is hidden from the reader and from touch.
export function Marquee({ words, duration = 26000 }: { words: readonly string[]; duration?: number }) {
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!w) return;
    x.setValue(0);
    const a = Animated.loop(Animated.timing(x, { toValue: -w, duration, easing: Easing.linear, useNativeDriver: true }));
    a.start();
    return () => a.stop();
  }, [w, duration, x]);

  const strip = (measured: boolean) => (
    <View style={styles.row} onLayout={measured ? (e) => setW(e.nativeEvent.layout.width) : undefined}>
      {words.map((word) => (
        <View key={word} style={styles.row}>
          <Text style={[typo.h2, { color: colors.lineStrong }]}>{word.toUpperCase()}</Text>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent, marginHorizontal: spacing.md, opacity: 0.6 }} />
        </View>
      ))}
    </View>
  );

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: 30, overflow: 'hidden', justifyContent: 'center' }}>
      <Animated.View style={[styles.row, { transform: [{ translateX: x }] }]}>
        {strip(true)}
        {strip(false)}
      </Animated.View>
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <View style={styles.bannerBar} />
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

export function EmptyState({ title, message, actionLabel, onAction, seed }: {
  title?: string; message: string; actionLabel?: string; onAction?: () => void; seed?: string;
}) {
  return (
    <Reveal style={{ paddingVertical: spacing.xl }}>
      {seed ? <Cover seed={seed} height={130} round={radius.lg} dim={0.55} wash={0.9} style={{ marginBottom: spacing.xl }} /> : null}
      {title ? <Text style={[typo.h1, { marginBottom: spacing.sm }]} numberOfLines={2} adjustsFontSizeToFit>{title}</Text> : null}
      <Text style={[typo.muted, { maxWidth: 460 }]}>{message}</Text>
      {actionLabel && onAction ? <Ghost label={actionLabel} onPress={onAction} style={{ marginTop: spacing.xl, alignSelf: 'flex-start' }} /> : null}
    </Reveal>
  );
}

// One row shape for every jam list (feed, search, hosting, joined). The trailing
// control is a sibling, never a touchable nested inside a touchable.
export function JamRow({ seed, title, meta, onPress, accessibilityLabel, right, last }: {
  seed: string; title: string; meta: string; onPress: () => void;
  accessibilityLabel: string; right?: React.ReactNode; last?: boolean;
}) {
  return (
    <View>
      <View style={styles.row}>
        <Press onPress={onPress} accessibilityLabel={accessibilityLabel} style={[styles.row, { flex: 1, paddingVertical: spacing.lg }]}>
          <Cover seed={seed} height={58} width={58} round={radius.md} dim={0.22} washSteps={0} style={{ width: 58 }} />
          <View style={{ flex: 1, marginLeft: spacing.lg, paddingRight: spacing.sm }}>
            <Text style={typo.h3} numberOfLines={2}>{title}</Text>
            <Text style={[typo.micro, { marginTop: 3 }]} numberOfLines={1}>{meta}</Text>
          </View>
        </Press>
        {right ?? <Text style={[typo.h2, { color: colors.dim }]}>{'›'}</Text>}
      </View>
      {last ? null : <View style={styles.hairline} />}
    </View>
  );
}

// Shimmer, not a static gray block: a still skeleton reads as a broken screen.
function useShimmer() {
  const v = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 0.8, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.35, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [v]);
  return v;
}

export function SkeletonRow() {
  const v = useShimmer();
  return (
    <Animated.View style={[styles.row, { opacity: v, paddingVertical: spacing.lg }]}>
      <View style={{ width: 58, height: 58, borderRadius: radius.md, backgroundColor: colors.raised }} />
      <View style={{ flex: 1, marginLeft: spacing.lg }}>
        <View style={{ height: 13, borderRadius: 4, backgroundColor: colors.raised, marginBottom: spacing.sm }} />
        <View style={{ height: 11, width: '55%', borderRadius: 4, backgroundColor: colors.raised }} />
      </View>
    </Animated.View>
  );
}

export function SkeletonBlock({ height, style }: { height: number; style?: StyleProp<ViewStyle> }) {
  const v = useShimmer();
  return <Animated.View style={[{ height, borderRadius: radius.lg, backgroundColor: colors.raised, opacity: v }, style]} />;
}
