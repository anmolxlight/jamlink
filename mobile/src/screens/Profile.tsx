import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { isConfigured, supabase, type Jam } from '../lib/supabase';
import { colors, spacing, styles, timeAgo } from '../theme';
import { EmptyState, ErrorBanner, SkeletonRow } from '../ui';

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

  if (!isConfigured) return <EmptyState message="Set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY to browse jams." />;

  if (loading) return <View style={{ marginTop: spacing.md }}>{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</View>;

  if (!userId) {
    return (
      <View>
        <ErrorBanner message={err} />
        <EmptyState message="Log in to see the jams you host and joined." actionLabel="Go to Login →" onAction={onLogin} />
      </View>
    );
  }

  const totalMembers = hosted.reduce((n, j) => n + j.member_count, 0);

  return (
    <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}>
      <ErrorBanner message={err} />
      <View style={[styles.row, { marginTop: spacing.md }]}>
        {[
          { label: 'Hosted', value: hosted.length },
          { label: 'Joined', value: joined.length },
          { label: 'Members', value: totalMembers },
        ].map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.muted}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Hosting</Text>
      {hosted.length === 0 ? (
        <EmptyState message="You have not posted a jam yet." actionLabel="Post a jam" onAction={onPost} />
      ) : (
        hosted.map((j) => {
          const key = `${j.is_open ? 'close_jam' : 'reopen_jam'}:${j.id}`;
          const pending = busy === key;
          return (
            <View key={j.id} style={[styles.card, styles.rowBetween]}>
              <TouchableOpacity
                onPress={() => onOpen(j.id)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${j.title}`}
                style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={{ color: colors.text, fontWeight: 'bold' }}>{j.title}</Text>
                <Text style={styles.muted}>{j.is_open ? 'Open' : 'Closed'} · {j.member_count} members · {timeAgo(j.created_at)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleOpen(j)}
                disabled={pending}
                accessibilityRole="button"
                accessibilityState={{ disabled: pending }}
                accessibilityLabel={`${j.is_open ? 'Close' : 'Reopen'} ${j.title}`}
                style={[styles.smallButton, pending && { opacity: 0.6 }]}>
                <Text style={styles.smallButtonText}>{pending ? 'Working…' : j.is_open ? 'Close' : 'Reopen'}</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <Text style={styles.sectionTitle}>Joined</Text>
      {joined.length === 0 ? (
        <EmptyState message="You have not joined a jam yet. Post one and listeners can join you." actionLabel="Post a jam" onAction={onPost} />
      ) : (
        joined.map((j) => {
          const pending = busy === `leave:${j.id}`;
          return (
            <View key={j.id} style={[styles.card, styles.rowBetween]}>
              <TouchableOpacity
                onPress={() => onOpen(j.id)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${j.title}`}
                style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={{ color: colors.text, fontWeight: 'bold' }}>{j.title}</Text>
                <Text style={styles.muted}>{j.genre} · {j.member_count} members</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => leave(j)}
                disabled={pending}
                accessibilityRole="button"
                accessibilityState={{ disabled: pending }}
                accessibilityLabel={`Leave ${j.title}`}
                style={[styles.smallButton, pending && { opacity: 0.6 }]}>
                <Text style={styles.smallButtonText}>{pending ? 'Working…' : 'Leave'}</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <TouchableOpacity
        onPress={signOut}
        disabled={busy === 'signout'}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        style={[styles.bigButton, { backgroundColor: colors.card, marginTop: spacing.xl }, busy === 'signout' && { opacity: 0.6 }]}>
        <Text style={[styles.bigButtonText, { color: colors.text }]}>{busy === 'signout' ? 'Signing out…' : 'Sign out'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
