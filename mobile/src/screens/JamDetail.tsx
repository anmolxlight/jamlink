import { useEffect, useState } from 'react';
import { Animated, Linking, Text, View } from 'react-native';
import { seedFor } from '../lib/layout';
import { supabase, type Jam } from '../lib/supabase';
import { colors, gutter, radius, spacing, styles, timeAgo, typo } from '../theme';
import { Cover, EmptyState, ErrorBanner, Eyebrow, Ghost, Reveal, SkeletonBlock, SkeletonRow, Solid, useParallax } from '../ui';

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
  // ponytail: one flag, so a success line never renders inside the error banner
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const { scrollY, scrollProps } = useParallax();

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

  function fail(m: string) { setOk(false); setMsg(m); }

  async function toggleJoin() {
    const sb = supabase();
    if (!sb || !jam) return;
    setMsg('');
    setOk(false);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { fail('Login required to join.'); return; }
    // ponytail: RPCs not raw writes, so is_open / max_members / duplicate checks are enforced server side
    if (joined) {
      const { error } = await sb.rpc('leave_jam', { p_jam_id: jam.id });
      if (error) fail(error.message);
      else {
        setJoined(false);
        setMembers((m) => m.filter((x) => x.user_id !== user.id));
        setJam((j) => (j ? { ...j, member_count: Math.max(0, j.member_count - 1) } : j));
      }
    } else {
      const { error } = await sb.rpc('join_jam', { p_jam_id: jam.id });
      if (error) fail(error.message);
      else {
        setJoined(true);
        setMembers((m) => [...m, { user_id: user.id, joined_at: new Date().toISOString() }]);
        setJam((j) => (j ? { ...j, member_count: j.member_count + 1 } : j));
        setOk(true);
        setMsg('You are in. Open Spotify to hear it.');
      }
    }
  }

  if (loading) {
    return (
      <View>
        <SkeletonBlock height={280} style={{ borderRadius: 0 }} />
        <View style={styles.gutter}>{[0, 1].map((i) => <SkeletonRow key={i} />)}</View>
      </View>
    );
  }

  if (!jam) {
    return (
      <View style={styles.gutter}>
        <ErrorBanner message={ok ? '' : msg} />
        <EmptyState title="Jam not found" message="This room is gone, or the link points at nothing. Head back and pick another." seed="jamlink-lost-signal" />
      </View>
    );
  }

  return (
    <Animated.ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.section }} {...scrollProps}>
      <Cover seed={seedFor(jam.genre, jam.id)} height={300} dim={0.34} scrollY={scrollY}>
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: gutter, paddingBottom: spacing.xl }}>
          <Reveal>
            <Eyebrow>{`${jam.genre}  ${jam.is_open ? 'open' : 'closed'}`}</Eyebrow>
            <Text style={[typo.display, { marginTop: spacing.sm }]} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.6}>
              {jam.title}
            </Text>
            <Text style={[typo.muted, { marginTop: spacing.sm }]}>
              {jam.member_count} listening · started {timeAgo(jam.created_at)}
            </Text>
          </Reveal>
        </View>
      </Cover>

      <View style={styles.gutter}>
        {jam.description ? (
          <Reveal delay={90}>
            <Text style={[typo.body, { marginTop: spacing.xl }]}>{jam.description}</Text>
          </Reveal>
        ) : null}

        {jam.is_open ? (
          <Solid label={joined ? 'Leave jam' : 'Join jam'} onPress={toggleJoin} style={{ marginTop: spacing.xl }} />
        ) : (
          <View style={[styles.card, { marginTop: spacing.xl, padding: spacing.lg }]}>
            <Eyebrow>Closed</Eyebrow>
            <Text style={[typo.muted, { marginTop: spacing.xs }]}>The host closed this room, so joining is off. The link may still play.</Text>
          </View>
        )}

        <Ghost label="Open in Spotify" onPress={() => openInSpotify(jam.spotify_url, fail)} style={{ marginTop: spacing.md }} />

        {ok && msg ? (
          <Reveal style={[styles.card, { marginTop: spacing.lg, padding: spacing.lg, borderColor: colors.accent }]}>
            <Text style={typo.body}>{msg}</Text>
          </Reveal>
        ) : (
          <ErrorBanner message={msg} />
        )}

        <View style={{ marginTop: spacing.section }}>
          <View style={styles.rowBetween}>
            <Text style={typo.h1}>In the room</Text>
            <Text style={typo.micro}>{members.length}</Text>
          </View>
          <View style={[styles.hairline, { marginTop: spacing.md, marginBottom: spacing.lg }]} />
          {members.length === 0 ? (
            <Text style={typo.muted}>Nobody yet. Join first and the rest follow the crowd.</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {members.map((m) => (
                <View
                  key={m.user_id}
                  accessibilityLabel={`Listener ${m.user_id.slice(0, 4)}`}
                  style={{
                    width: 46, height: 46, borderRadius: radius.pill, marginRight: spacing.sm, marginBottom: spacing.sm,
                    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                  <Text style={[typo.h3, { color: colors.muted }]}>{m.user_id.slice(0, 2).toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Animated.ScrollView>
  );
}
