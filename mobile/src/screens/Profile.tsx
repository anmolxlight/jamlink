import { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, RefreshControl, ScrollView, Text, View } from 'react-native';
import { seedFor } from '../lib/layout';
import { isConfigured, supabase, type Jam } from '../lib/supabase';
import { colors, gutter, spacing, styles, timeAgo, typo } from '../theme';
import { Cover, EmptyState, ErrorBanner, Eyebrow, Ghost, JamRow, Press, Reveal, SectionHead, SkeletonRow } from '../ui';

const GAP = 10;
const STAT_W = (Dimensions.get('window').width - gutter * 2 - GAP * 2) / 3;

export default function Profile({ onOpen, onLogin, onPost }: { onOpen: (id: string) => void; onLogin: () => void; onPost: () => void }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [hosted, setHosted] = useState<Jam[]>([]);
  const [joined, setJoined] = useState<Jam[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // ponytail: one in-flight key ("close:<id>") is enough, a user taps one row at a time
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    const sb = supabase();
    if (!sb) { setLoading(false); return; }
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setErr('');
    const { data: { user } } = await sb.auth.getUser();
    setUserId(user?.id ?? null);
    if (!user) { setHosted([]); setJoined([]); setLoading(false); setRefreshing(false); return; }
    const [own, mem] = await Promise.all([
      sb.from('jams').select('*').eq('host_id', user.id).order('created_at', { ascending: false }),
      sb.from('jam_members').select('jam_id').eq('user_id', user.id),
    ]);
    if (own.error || mem.error) setErr((own.error ?? mem.error)!.message);
    setHosted((own.data ?? []) as Jam[]);
    const ids = ((mem.data ?? []) as { jam_id: string }[]).map((m) => m.jam_id);
    if (ids.length) {
      const { data, error } = await sb.from('jams').select('*').in('id', ids).order('created_at', { ascending: false });
      if (error) setErr(error.message);
      setJoined((data ?? []) as Jam[]);
    } else setJoined([]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function confirm(title: string, message: string, action: string, run: () => void) {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: action, onPress: run },
    ]);
  }

  function toggleOpen(jam: Jam) {
    const rpc = jam.is_open ? 'close_jam' : 'reopen_jam';
    const verb = jam.is_open ? 'Close' : 'Reopen';
    confirm(`${verb} jam`, `${verb} "${jam.title}"?`, verb, async () => {
      const sb = supabase();
      if (!sb) return;
      setBusy(`${rpc}:${jam.id}`);
      setErr('');
      // ponytail: optimistic flip, reverted on error
      setHosted((h) => h.map((j) => (j.id === jam.id ? { ...j, is_open: !jam.is_open } : j)));
      const { error } = await sb.rpc(rpc, { p_jam_id: jam.id });
      if (error) {
        setErr(error.message);
        setHosted((h) => h.map((j) => (j.id === jam.id ? { ...j, is_open: jam.is_open } : j)));
      }
      setBusy(null);
    });
  }

  function leave(jam: Jam) {
    confirm('Leave jam', `Leave "${jam.title}"?`, 'Leave', async () => {
      const sb = supabase();
      if (!sb) return;
      setBusy(`leave:${jam.id}`);
      setErr('');
      const { error } = await sb.rpc('leave_jam', { p_jam_id: jam.id });
      if (error) setErr(error.message);
      else setJoined((list) => list.filter((j) => j.id !== jam.id));
      setBusy(null);
    });
  }

  async function signOut() {
    const sb = supabase();
    if (!sb) return;
    setBusy('signout');
    const { error } = await sb.auth.signOut();
    setBusy(null);
    if (error) setErr(error.message);
    else { setUserId(null); setHosted([]); setJoined([]); }
  }

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

  if (loading) return <View style={[styles.gutter, { marginTop: spacing.lg }]}>{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</View>;

  if (!userId) {
    return (
      <View style={styles.gutter}>
        <ErrorBanner message={err} />
        <EmptyState
          title="Nothing here yet"
          message="Log in to see the jams you host and the ones you joined. One email link does both."
          actionLabel="Go to login"
          onAction={onLogin}
          seed="jamlink-empty-headphones"
        />
      </View>
    );
  }

  const totalMembers = hosted.reduce((n, j) => n + j.member_count, 0);
  const stats = [
    { label: 'Hosted', value: hosted.length },
    { label: 'Joined', value: joined.length },
    { label: 'Listeners', value: totalMembers },
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: spacing.section }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}>

      <Cover seed={seedFor('profile', userId)} height={170}>
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: gutter, paddingBottom: spacing.lg }}>
          <Reveal>
            <Text style={typo.display} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
              Your rooms
            </Text>
          </Reveal>
        </View>
      </Cover>

      <View style={styles.gutter}>
        <ErrorBanner message={err} />

        {/* three tiles, three equal columns, one full row: no dead cell possible */}
        <Reveal delay={80} style={[styles.row, { marginTop: spacing.xl }]}>
          {stats.map((s, i) => (
            <View key={s.label} style={[styles.card, { width: STAT_W, marginRight: i === stats.length - 1 ? 0 : GAP, padding: spacing.lg }]}>
              <Text style={[typo.h1, { color: colors.accent }]}>{s.value}</Text>
              <Text style={[typo.eyebrow, { marginTop: spacing.xs }]}>{s.label.toUpperCase()}</Text>
            </View>
          ))}
        </Reveal>

        <SectionHead title="Hosting" meta={hosted.length ? `${hosted.length} total` : undefined} top={spacing.section} />
        {hosted.length === 0 ? (
          <EmptyState
            message="You have not posted a jam yet. The room only exists once someone opens it."
            actionLabel="Post a jam"
            onAction={onPost}
          />
        ) : (
          hosted.map((j, i) => {
            const key = `${j.is_open ? 'close_jam' : 'reopen_jam'}:${j.id}`;
            const pending = busy === key;
            return (
              <JamRow
                key={j.id}
                seed={seedFor(j.genre, j.id)}
                title={j.title}
                meta={`${j.is_open ? 'Open' : 'Closed'} · ${j.member_count} listening · ${timeAgo(j.created_at)}`}
                onPress={() => onOpen(j.id)}
                accessibilityLabel={`Open ${j.title}`}
                last={i === hosted.length - 1}
                right={
                  <Press
                    onPress={() => toggleOpen(j)}
                    disabled={pending}
                    accessibilityLabel={`${j.is_open ? 'Close' : 'Reopen'} ${j.title}`}
                    style={[styles.small, pending && { opacity: 0.55 }]}>
                    <Text style={styles.smallText}>{pending ? 'Working' : j.is_open ? 'Close' : 'Reopen'}</Text>
                  </Press>
                }
              />
            );
          })
        )}

        <SectionHead title="Joined" meta={joined.length ? `${joined.length} total` : undefined} top={spacing.section} />
        {joined.length === 0 ? (
          <EmptyState
            message="You have not joined a jam yet. Post one and listeners can join you instead."
            actionLabel="Post a jam"
            onAction={onPost}
          />
        ) : (
          joined.map((j, i) => {
            const pending = busy === `leave:${j.id}`;
            return (
              <JamRow
                key={j.id}
                seed={seedFor(j.genre, j.id)}
                title={j.title}
                meta={`${j.genre} · ${j.member_count} listening`}
                onPress={() => onOpen(j.id)}
                accessibilityLabel={`Open ${j.title}`}
                last={i === joined.length - 1}
                right={
                  <Press
                    onPress={() => leave(j)}
                    disabled={pending}
                    accessibilityLabel={`Leave ${j.title}`}
                    style={[styles.small, pending && { opacity: 0.55 }]}>
                    <Text style={styles.smallText}>{pending ? 'Working' : 'Leave'}</Text>
                  </Press>
                }
              />
            );
          })
        )}

        <View style={{ marginTop: spacing.section }}>
          <Eyebrow>Account</Eyebrow>
          <Ghost
            label={busy === 'signout' ? 'Signing out' : 'Sign out'}
            onPress={signOut}
            disabled={busy === 'signout'}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
