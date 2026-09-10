import { useEffect, useState } from 'react';
import { Animated, Text, TextInput, View } from 'react-native';
import { seedFor } from '../lib/layout';
import { isConfigured, supabase, type Jam } from '../lib/supabase';
import { colors, gutter, spacing, styles, timeAgo, typo } from '../theme';
import { Cover, EmptyState, ErrorBanner, JamRow, Reveal, SkeletonRow, useParallax } from '../ui';

export default function Search({ onOpen, onPost }: { onOpen: (id: string) => void; onPost: () => void }) {
  const [term, setTerm] = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<Jam[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { scrollY, scrollProps } = useParallax();

  const q = term.trim();

  // ponytail: setTimeout debounce + cancelled flag, covers both the delay and out-of-order responses
  useEffect(() => {
    if (!q) { setResults([]); setLoading(false); setErr(''); return; }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      const sb = supabase();
      if (!sb) { setLoading(false); return; }
      const { data, error } = await sb
        .from('jams').select('*').eq('is_open', true).ilike('title', `%${q}%`)
        .order('member_count', { ascending: false }).limit(50);
      if (cancelled) return;
      setErr(error ? error.message : '');
      setResults(error ? [] : ((data ?? []) as Jam[]));
      setLoading(false);
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  if (!isConfigured) {
    return (
      <View style={styles.gutter}>
        <EmptyState
          title="Not wired up yet"
          message="Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then reopen the app to browse jams."
          seed="jamlink-offline-static"
        />
      </View>
    );
  }

  return (
    <Animated.ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.section }} keyboardShouldPersistTaps="handled" {...scrollProps}>
      <Cover seed="jamlink-search-vinyl-wall" height={180} scrollY={scrollY}>
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: gutter, paddingBottom: spacing.lg }}>
          <Reveal>
            <Text style={typo.display} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
              Find the room
            </Text>
          </Reveal>
        </View>
      </Cover>

      <View style={[styles.gutter, { marginTop: spacing.xl }]}>
        <TextInput
          value={term}
          onChangeText={setTerm}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search jams by title"
          placeholder="Search by title"
          placeholderTextColor={colors.dim}
          style={[styles.field, focused && styles.fieldOn]}
        />
        <ErrorBanner message={err} />

        {!q ? (
          <EmptyState
            title="Type a title"
            message="Search runs across every open jam. Nothing here yet that matches what you want to hear? Post it."
            actionLabel="Post a jam"
            onAction={onPost}
            seed="jamlink-search-empty-room"
          />
        ) : loading ? (
          <View style={{ marginTop: spacing.lg }}>{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</View>
        ) : results.length === 0 ? (
          <EmptyState
            title="No match"
            message={`No open jams match "${q}". Post it yourself and it shows up here for everyone else searching the same thing.`}
            actionLabel="Post a jam"
            onAction={onPost}
            seed={seedFor('search-miss', q)}
          />
        ) : (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[typo.eyebrow, { marginBottom: spacing.sm }]}>{`${results.length} OPEN JAM${results.length === 1 ? '' : 'S'}`}</Text>
            <View style={styles.hairline} />
            {results.map((j, i) => (
              <Reveal key={j.id} delay={Math.min(i, 6) * 45}>
                <JamRow
                  seed={seedFor(j.genre, j.id)}
                  title={j.title}
                  meta={`${j.genre} · ${j.member_count} listening · ${timeAgo(j.created_at)}`}
                  onPress={() => onOpen(j.id)}
                  accessibilityLabel={`${j.title}, ${j.member_count} members`}
                  last={i === results.length - 1}
                />
              </Reveal>
            ))}
          </View>
        )}
      </View>
    </Animated.ScrollView>
  );
}
