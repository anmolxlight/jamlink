import { useEffect, useState } from 'react';
import { Animated, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { GENRES, isValidJamPost } from '../lib/spotify';
import { supabase } from '../lib/supabase';
import { colors, gutter, spacing, styles, typo } from '../theme';
import { Cover, EmptyState, ErrorBanner, Eyebrow, Press, Reveal, Solid, useParallax } from '../ui';

const TITLE_MAX = 80;
const DESC_MAX = 280;

// ponytail: one field shape, used three times. Owns its own focus underline so the
// screen does not carry three booleans.
function Field({ label, value, onChangeText, placeholder, error, onBlur, maxLength, multiline, keyboardType, sentences }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string;
  error?: string | false; onBlur?: () => void; maxLength?: number; multiline?: boolean;
  keyboardType?: KeyboardTypeOptions; sentences?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginTop: spacing.xxl }}>
      <Eyebrow>{label}</Eyebrow>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.dim}
        maxLength={maxLength}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={sentences ? 'sentences' : 'none'}
        autoCorrect={Boolean(sentences)}
        accessibilityLabel={label}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        style={[styles.field, focused && styles.fieldOn, multiline && { minHeight: 76, textAlignVertical: 'top' }]}
      />
      <View style={[styles.rowBetween, { marginTop: spacing.xs }]}>
        {error ? <Text style={[styles.error, { flex: 1, marginRight: spacing.md }]}>{error}</Text> : <View style={{ flex: 1 }} />}
        {maxLength ? <Text style={typo.micro}>{value.length}/{maxLength}</Text> : null}
      </View>
    </View>
  );
}

export default function Post({ onDone, onLogin }: { onDone: (id: string) => void; onLogin: () => void }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState<string>('pop');
  const [touched, setTouched] = useState({ title: false, url: false });
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState('');
  const [gated, setGated] = useState(false);
  const [sending, setSending] = useState(false);
  const { scrollY, scrollProps } = useParallax();

  useEffect(() => {
    supabase()?.auth.getUser().then(({ data }) => {
      if (!data.user) setGated(true);
    });
  }, []);

  if (gated) {
    return (
      <View style={styles.gutter}>
        <EmptyState
          title="Log in to host"
          message="A jam needs an owner, so posting needs an account. One email link gets you in and back here."
          actionLabel="Go to login"
          onAction={onLogin}
          seed="jamlink-locked-door-neon"
        />
      </View>
    );
  }

  // Same rule as web: errors are derived and only shown once a field has been
  // left or the form has been submitted, so pristine fields are never red.
  const titleErr = title.trim() ? '' : 'Give it a title so people know what is playing.';
  const urlErr = !url.trim()
    ? 'Paste the jam link you copied from Spotify.'
    : isValidJamPost(url, title)
      ? ''
      : 'That is not a Spotify jam link. Use an open.spotify.com or spotify: link, or add a title.';
  const showTitleErr = (touched.title || tried) && titleErr;
  const showUrlErr = (touched.url || tried) && urlErr;

  async function submit() {
    setErr('');
    setTried(true);
    if (titleErr || urlErr) return;
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
    <Animated.ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.section }} keyboardShouldPersistTaps="handled" {...scrollProps}>
      <Cover seed="jamlink-mixing-desk-dark" height={180} scrollY={scrollY}>
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: gutter, paddingBottom: spacing.lg }}>
          <Reveal>
            <Text style={typo.display} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
              Open your room
            </Text>
          </Reveal>
        </View>
      </Cover>

      <View style={styles.gutter}>
        <Reveal delay={90}>
          <Text style={[typo.muted, { marginTop: spacing.lg }]}>
            Start the jam in Spotify, copy the invite link, and drop it here. Everyone who joins listens on your queue.
          </Text>
        </Reveal>

        <Field
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Late night lofi session"
          maxLength={TITLE_MAX}
          sentences
          error={showTitleErr}
          onBlur={() => setTouched((t) => ({ ...t, title: true }))}
        />
        <Field
          label="Spotify jam link"
          value={url}
          onChangeText={setUrl}
          placeholder="https://open.spotify.com/jam/..."
          error={showUrlErr}
          keyboardType="url"
          onBlur={() => setTouched((t) => ({ ...t, url: true }))}
        />
        <Field
          label="Description, optional"
          value={description}
          onChangeText={setDescription}
          placeholder="What are we listening to?"
          maxLength={DESC_MAX}
          multiline
          sentences
        />

        <View style={{ marginTop: spacing.xxl }}>
          <Eyebrow>Genre</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md }}>
            {GENRES.map((g) => {
              const on = genre === g;
              return (
                <Press
                  key={g}
                  onPress={() => setGenre(g)}
                  accessibilityLabel={`Genre ${g}`}
                  style={[styles.chip, { marginBottom: spacing.sm }, on && styles.chipOn]}>
                  <Text style={on ? styles.chipTextOn : styles.chipText}>{g}</Text>
                </Press>
              );
            })}
          </View>
        </View>

        <ErrorBanner message={err} />
        <Solid label={sending ? 'Posting...' : 'Post jam'} onPress={submit} disabled={sending} style={{ marginTop: spacing.xl }} />
      </View>
    </Animated.ScrollView>
  );
}
