import { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { GENRES, isValidJamPost } from '../lib/spotify';
import { supabase } from '../lib/supabase';
import { colors, spacing, styles } from '../theme';
import { EmptyState, ErrorBanner } from '../ui';

const TITLE_MAX = 80;
const DESC_MAX = 280;

export default function Post({ onDone, onLogin }: { onDone: (id: string) => void; onLogin: () => void }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState<string>('pop');
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const [err, setErr] = useState('');
  const [gated, setGated] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase()?.auth.getUser().then(({ data }) => {
      if (!data.user) setGated(true);
    });
  }, []);

  if (gated) {
    return (
      <View>
        <EmptyState message="Log in to post a jam." actionLabel="Go to Login →" onAction={onLogin} />
      </View>
    );
  }

  async function submit() {
    setErr('');
    const e: typeof errors = {};
    if (!title.trim()) e.title = 'Title is required.';
    else if (title.trim().length > TITLE_MAX) e.title = `Keep it under ${TITLE_MAX} chars.`;
    if (!isValidJamPost(url, title)) e.url = 'Invalid Spotify link (need open.spotify.com or spotify: with /jam/, or any Spotify link + title).';
    setErrors(e);
    if (Object.keys(e).length) return;
    const sb = supabase();
    if (!sb) { setErr('Supabase not configured.'); return; }
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setGated(true); return; }
    setSending(true);
    const { data, error } = await sb.from('jams').insert({
      host_id: user.id, title: title.trim(), spotify_url: url.trim(), genre, description: description.trim(),
    }).select('id').single();
    setSending(false);
    if (error) setErr(error.message);
    else onDone((data as { id: string }).id);
  }

  return (
    <ScrollView style={{ flex: 1 }}>
      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} maxLength={TITLE_MAX} placeholder="Late-night lofi session"
        placeholderTextColor={colors.muted} style={styles.input} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {errors.title ? <Text style={styles.error}>{errors.title}</Text> : <Text />}
        <Text style={styles.muted}>{title.length}/{TITLE_MAX}</Text>
      </View>
      <Text style={styles.label}>Spotify Jam link</Text>
      <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false}
        placeholder="https://open.spotify.com/jam/…" placeholderTextColor={colors.muted} style={styles.input} />
      {errors.url ? <Text style={styles.error}>{errors.url}</Text> : null}
      <Text style={styles.label}>Description (optional)</Text>
      <TextInput value={description} onChangeText={setDescription} maxLength={DESC_MAX} multiline
        placeholder="What are we listening to?" placeholderTextColor={colors.muted} style={[styles.input, { minHeight: 64 }]} />
      <Text style={[styles.muted, { textAlign: 'right' }]}>{description.length}/{DESC_MAX}</Text>
      <Text style={styles.label}>Genre</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm }}>
        {GENRES.map((g) => (
          <TouchableOpacity key={g} onPress={() => setGenre(g)}
            style={[styles.chip, { marginBottom: spacing.sm }, genre === g && { backgroundColor: colors.accent }]}>
            <Text style={{ color: genre === g ? colors.accentText : colors.text }}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ErrorBanner message={err} />
      <TouchableOpacity onPress={submit} disabled={sending} style={[styles.bigButton, sending && { opacity: 0.6 }]}>
        <Text style={styles.bigButtonText}>{sending ? 'Posting…' : 'Post jam'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
