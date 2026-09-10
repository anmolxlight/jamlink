import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, RefreshControl, ScrollView, Text, View } from 'react-native';
import { bentoRows, seedFor } from '../lib/layout';
import { GENRES } from '../lib/spotify';
import { isConfigured, supabase, type Jam } from '../lib/supabase';
import { rankTrending } from '../lib/trending';
import { colors, gutter, radius, spacing, styles, timeAgo, typo } from '../theme';
import { Cover, EmptyState, ErrorBanner, Ghost, JamRow, Marquee, Press, Reveal, SectionHead, SkeletonBlock, SkeletonRow, Solid } from '../ui';

const { width: W, height: H } = Dimensions.get('window');
const GAP = 10;
const FULL = W - gutter * 2;
const HALF = (FULL - GAP) / 2;
const HERO_H = Math.min(400, Math.round(H * 0.46));

export default function Feed({ onOpen, onRandom, onPost }: { onOpen: (id: string) => void; onRandom: () => void; onPost: () => void }) {
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

  const trending = useMemo(() => rankTrending(all, 5), [all]);

  const shown = useMemo(() => (genre ? all.filter((j) => j.genre === genre) : all).slice(0, 50), [all, genre]);

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

  function confirmRandom() {
    Alert.alert('Random jam', 'Join a random open jam?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Go', onPress: onRandom },
    ]);
  }

  return (
    // ponytail: one ScrollView owns pull-to-refresh; cards are .map (max 50 rows, no FlatList needed)
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: spacing.section }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}>

      {/* Attention: full bleed cinematic hero, headline capped at two lines, exactly two calls to action */}
      <Cover seed="jamlink-night-crowd-sound" height={HERO_H}>
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: gutter, paddingBottom: spacing.xl }}>
          <Reveal>
            <Text style={typo.display} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
              Live rooms, one tap away
            </Text>
          </Reveal>
          <Reveal delay={110}>
            <Text style={[typo.muted, { marginTop: spacing.md, maxWidth: 340 }]}>
              Open jams from people listening right now. Drop into one, or run your own room.
            </Text>
          </Reveal>
          <Reveal delay={190} style={[styles.row, { marginTop: spacing.xl }]}>
            <Solid label="Surprise me" onPress={confirmRandom} style={{ flex: 1, marginRight: GAP }} />
            <Ghost label="Post a jam" onPress={onPost} style={{ flex: 1 }} />
          </Reveal>
        </View>
      </Cover>

      <View style={{ marginTop: spacing.xl }}>
        <Marquee words={GENRES} />
      </View>

      <View style={styles.gutter}>
        <ErrorBanner message={err} />
      </View>

      {/* Interest: the bento. Rows are one full tile or two halves, so it can never leave a hole. */}
      {loading ? (
        <View style={[styles.gutter, { marginTop: spacing.xl }]}>
          <SkeletonBlock height={190} />
          <View style={[styles.row, { marginTop: GAP }]}>
            <SkeletonBlock height={150} style={{ width: HALF, marginRight: GAP }} />
            <SkeletonBlock height={150} style={{ width: HALF }} />
          </View>
        </View>
      ) : trending.length > 0 ? (
        <View style={styles.gutter}>
          <SectionHead title="Trending now" meta={`${all.length} open`} top={spacing.xxl} />
          {bentoRows(trending.length).map((row, r) => (
            <View key={r} style={[styles.row, { marginBottom: GAP }]}>
              {row.map((idx, c) => {
                const j = trending[idx];
                const full = row.length === 1;
                return (
                  <Press
                    key={j.id}
                    onPress={() => onOpen(j.id)}
                    accessibilityLabel={`${j.title}, number ${idx + 1} trending, ${j.member_count} members`}
                    style={{ width: full ? FULL : HALF, marginRight: c === 0 && !full ? GAP : 0 }}>
                    <Cover seed={seedFor(j.genre, j.id)} height={full ? 190 : 150} width={full ? FULL : HALF} round={radius.lg} dim={0.28} wash={0.92}>
                      <View style={{ flex: 1, justifyContent: 'space-between', padding: spacing.lg }}>
                        <Text style={typo.numeral}>{String(idx + 1).padStart(2, '0')}</Text>
                        <View>
                          <Text style={typo.h2} numberOfLines={2}>{j.title}</Text>
                          <Text style={[typo.micro, { marginTop: 3 }]} numberOfLines={1}>{j.genre} · {j.member_count} listening</Text>
                        </View>
                      </View>
                    </Cover>
                  </Press>
                );
              })}
            </View>
          ))}
        </View>
      ) : null}

      {/* Desire: filter the room, then the full editorial list */}
      <View style={styles.gutter}>
        <SectionHead title={genre ? `Open in ${genre}` : 'Open right now'} meta={`${shown.length} shown`} top={spacing.xxl} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: spacing.lg }}>
        <Press onPress={() => setGenre(null)} accessibilityLabel="Show all genres" style={[styles.chip, !genre && styles.chipOn]}>
          <Text style={!genre ? styles.chipTextOn : styles.chipText}>all</Text>
        </Press>
        {GENRES.map((g) => {
          const active = genre === g;
          return (
            <Press
              key={g}
              onPress={() => setGenre(active ? null : g)}
              accessibilityLabel={`Filter by ${g}`}
              style={[styles.chip, active && styles.chipOn]}>
              <Text style={active ? styles.chipTextOn : styles.chipText}>
                {g}{counts[g] ? ` ${counts[g]}` : ''}
              </Text>
            </Press>
          );
        })}
      </ScrollView>

      <View style={styles.gutter}>
        {loading ? (
          <View>{[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}</View>
        ) : shown.length === 0 ? (
          <EmptyState
            title={genre ? 'Nothing in this lane' : 'Silence, for now'}
            message={genre ? `No open jams in ${genre} yet. Post one and it lands at the top of this list.` : 'No open jams yet. The first jam posted here is the one everyone sees.'}
            actionLabel="Post a jam"
            onAction={onPost}
            seed={seedFor('empty', genre ?? 'feed')}
          />
        ) : (
          shown.map((item, i) => (
            <Reveal key={item.id} delay={Math.min(i, 6) * 45}>
              <JamRow
                seed={seedFor(item.genre, item.id)}
                title={item.title}
                meta={`${item.genre} · ${item.member_count} listening · ${timeAgo(item.created_at)}`}
                onPress={() => onOpen(item.id)}
                accessibilityLabel={`${item.title}, ${item.member_count} members`}
                last={i === shown.length - 1}
              />
            </Reveal>
          ))
        )}
      </View>

      {/* Action: the closing pitch */}
      <View style={[styles.gutter, { marginTop: spacing.section }]}>
        <Cover seed="jamlink-host-your-room" height={230} round={radius.lg} dim={0.5}>
          <View style={{ flex: 1, justifyContent: 'flex-end', padding: spacing.xl }}>
            <Text style={typo.h1} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>Run the room tonight</Text>
            <Text style={[typo.muted, { marginTop: spacing.sm, marginBottom: spacing.lg }]}>Paste a Spotify jam link and anyone here can listen along with you.</Text>
            <Solid label="Post a jam" onPress={onPost} />
          </View>
        </Cover>
      </View>
    </ScrollView>
  );
}
