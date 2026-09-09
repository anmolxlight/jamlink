import { useEffect, useState } from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase, type Jam } from '../lib/supabase';
import { colors, spacing, styles } from '../theme';
import { EmptyState, ErrorBanner } from '../ui';

type Member = { user_id: string; joined_at: string };

// ponytail: try spotify: URI first, fall back to https
export function spotifyDeepLink(httpsUrl: string): { app: string; web: string } {
  const m = httpsUrl.match(/open\.spotify\.com\/(\S+)/);
  const app = m ? `spotify:${m[1].replace(/\//g, ':').split('?')[0]}` : httpsUrl;
  return { app, web: httpsUrl };
}

async function openInSpotify(httpsUrl: string, setErr: (m: string) => void) {
  const { app, web } = spotifyDeepLink(httpsUrl);
  try {
    if (await Linking.canOpenURL(app)) await Linking.openURL(app);
    else await Linking.openURL(web);
  } catch (e: any) {
    setErr(e?.message ?? 'Could not open Spotify.');
  }
}

export default function JamDetail({ id }: { id: string }) {
  const [jam, setJam] = useState<Jam | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [joined, setJoined] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      if (!sb) { setLoading(false); return; }
      const { data, error } = await sb.from('jams').select('*').eq('id', id).single();
      if (error) setMsg(error.message);
      else {
        setJam(data as Jam);
        const { data: mems } = await sb.from('jam_members').select('user_id,joined_at').eq('jam_id', id);
        setMembers((mems ?? []) as Member[]);
        const { data: { user } } = await sb.auth.getUser();
        if (user) setJoined((mems ?? []).some((m: any) => m.user_id === user.id));
      }
      setLoading(false);
    })();
  }, [id]);

  async function toggleJoin() {
    const sb = supabase();
    if (!sb || !jam) return;
    setMsg('');
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setMsg('Login required to join.'); return; }
    // ponytail: RPCs not raw writes, so is_open / max_members / duplicate checks are enforced server side
    if (joined) {
      const { error } = await sb.rpc('leave_jam', { p_jam_id: jam.id });
      if (error) setMsg(error.message);
      else {
        setJoined(false);
        setMembers((m) => m.filter((x) => x.user_id !== user.id));
        setJam((j) => (j ? { ...j, member_count: Math.max(0, j.member_count - 1) } : j));
      }
    } else {
      const { error } = await sb.rpc('join_jam', { p_jam_id: jam.id });
      if (error) setMsg(error.message);
      else {
        setJoined(true);
        setMembers((m) => [...m, { user_id: user.id, joined_at: new Date().toISOString() }]);
        setJam((j) => (j ? { ...j, member_count: j.member_count + 1 } : j));
        setMsg('Joined! Open Spotify to listen.');
      }
    }
  }

  if (loading) return <Text style={styles.muted}>Loading…</Text>;
  if (!jam) return <View><ErrorBanner message={msg} /><EmptyState message="Jam not found." /></View>;

  return (
    <ScrollView style={{ flex: 1 }}>
      <Text style={styles.title}>{jam.title}</Text>
      <Text style={[styles.muted, { marginTop: spacing.xs }]}>{jam.genre} · {jam.member_count} members</Text>
      {jam.description ? <Text style={[styles.body, { marginTop: spacing.sm }]}>{jam.description}</Text> : null}
      {!jam.is_open ? (
        <View><ErrorBanner message="This jam is closed." /></View>
      ) : (
        <TouchableOpacity onPress={toggleJoin} style={styles.bigButton}>
          <Text style={styles.bigButtonText}>{joined ? 'Leave jam' : 'Join jam'}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => openInSpotify(jam.spotify_url, setMsg)} style={{ marginVertical: spacing.sm }}>
        <Text style={{ color: colors.accent, fontWeight: 'bold' }}>Open in Spotify ↗</Text>
      </TouchableOpacity>
      <ErrorBanner message={msg} />
      <Text style={[styles.label, { marginBottom: spacing.sm }]}>Members ({members.length})</Text>
      {members.length === 0 ? (
        <Text style={styles.muted}>No members yet.</Text>
      ) : (
        members.map((m) => (
          <Text key={m.user_id} style={styles.muted}>• {m.user_id.slice(0, 8)}…</Text>
        ))
      )}
    </ScrollView>
  );
}
