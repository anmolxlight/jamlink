import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { GENRES } from '../lib/spotify';
import { isConfigured, supabase, type Jam } from '../lib/supabase';
import { rankTrending } from '../lib/trending';
import { colors, spacing, styles, timeAgo } from '../theme';
import { EmptyState, ErrorBanner, SkeletonRow } from '../ui';

export default function Feed({ onOpen, onRandom }: { onOpen: (id: string) => void; onRandom: () => void }) {
  const [genre, setGenre] = useState<string | null>(null);
  const [all, setAll] = useState<Jam[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    const sb = supabase();
    if (!sb) return;
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setErr('');
    // ponytail: one query, genre counts + trending derived client-side, no extra round trips
    const { data, error } = await sb.from('jams').select('*').eq('is_open', true).order('created_at', { ascending: false }).limit(200);
    if (error) setErr(error.message);
    else setAll((data ?? []) as Jam[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    all.forEach((j) => { c[j.genre] = (c[j.genre] ?? 0) + 1; });
    return c;
  }, [all]);

  const trending = useMemo(() => rankTrending(all), [all]);

  const shown = useMemo(() => (genre ? all.filter((j) => j.genre === genre) : all).slice(0, 50), [all, genre]);

  if (!isConfigured) return <EmptyState message="Set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY to browse jams." />;

  function confirmRandom() {
    Alert.alert('Random jam', 'Join a random open jam?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Go', onPress: onRandom },
    ]);
  }

  return (
    // ponytail: one ScrollView owns pull-to-refresh; cards are .map (max 50 rows, no FlatList needed)
    <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}>
      <TouchableOpacity onPress={confirmRandom} style={styles.bigButton}>
        <Text style={styles.bigButtonText}>🎲 Random jam</Text>
      </TouchableOpacity>
      {loading ? null : trending.length > 0 ? (
        <View>
          <Text style={styles.sectionTitle}>Trending now</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {trending.map((j, i) => (
              <TouchableOpacity
                key={j.id}
                onPress={() => onOpen(j.id)}
                accessibilityRole="button"
                accessibilityLabel={`${j.title}, number ${i + 1} trending, ${j.member_count} members`}
                style={styles.trendTile}>
                <Text style={styles.rank}>#{i + 1}</Text>
                <Text numberOfLines={2} style={{ color: colors.text, fontWeight: 'bold', marginTop: spacing.xs }}>{j.title}</Text>
                <Text style={[styles.muted, { marginTop: spacing.xs }]}>{j.member_count} members</Text>
                <Text style={styles.muted}>{j.genre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: spacing.sm }}>
        <TouchableOpacity
          onPress={() => setGenre(null)}
          style={[styles.chip, !genre && { backgroundColor: colors.accent }]}>
          <Text style={{ color: !genre ? colors.accentText : colors.text, fontWeight: 'bold' }}>all</Text>
        </TouchableOpacity>
        {GENRES.map((g) => {
          const active = genre === g;
          return (
            <TouchableOpacity
              key={g}
              onPress={() => setGenre(active ? null : g)}
              style={[styles.chip, active && { backgroundColor: colors.accent }]}>
              <Text style={{ color: active ? colors.accentText : colors.text, fontWeight: active ? 'bold' : 'normal' }}>
                {g}{counts[g] ? ` · ${counts[g]}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <ErrorBanner message={err} />
      {loading ? (
        <View>{[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}</View>
      ) : shown.length === 0 ? (
        <EmptyState message={genre ? `No open jams in ${genre} yet.` : 'No open jams yet. Be the first to post one!'} />
      ) : (
        <View>
          {shown.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => onOpen(item.id)} style={styles.card}>
              <Text style={{ color: colors.text, fontWeight: 'bold' }}>{item.title}</Text>
              <Text style={styles.muted}>{item.genre} · {item.member_count} members · {timeAgo(item.created_at)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
