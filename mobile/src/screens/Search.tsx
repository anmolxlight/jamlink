import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { isConfigured, supabase, type Jam } from '../lib/supabase';
import { colors, spacing, styles, timeAgo } from '../theme';
import { EmptyState, ErrorBanner, SkeletonRow } from '../ui';

export default function Search({ onOpen, onPost }: { onOpen: (id: string) => void; onPost: () => void }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Jam[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

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

  if (!isConfigured) return <EmptyState message="Set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY to browse jams." />;

  return (
    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
      <TextInput
        value={term}
        onChangeText={setTerm}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Search jams by title"
        placeholder="Search jams by title"
        placeholderTextColor={colors.muted}
        style={[styles.input, { marginTop: spacing.md }]}
      />
      <ErrorBanner message={err} />
      {!q ? (
        <EmptyState message="Type a jam title to search open jams." actionLabel="Post a jam" onAction={onPost} />
      ) : loading ? (
        <View style={{ marginTop: spacing.md }}>{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</View>
      ) : results.length === 0 ? (
        <EmptyState message={`No open jams match "${q}". Post it yourself and it shows up here.`} actionLabel="Post a jam" onAction={onPost} />
      ) : (
        <View style={{ marginTop: spacing.md }}>
          {results.map((j) => (
            <TouchableOpacity
              key={j.id}
              onPress={() => onOpen(j.id)}
              accessibilityRole="button"
              accessibilityLabel={`${j.title}, ${j.member_count} members`}
              style={styles.card}>
              <Text style={{ color: colors.text, fontWeight: 'bold' }}>{j.title}</Text>
              <Text style={styles.muted}>{j.genre} · {j.member_count} members · {timeAgo(j.created_at)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
