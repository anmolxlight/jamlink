import { useState } from 'react';
import { Animated, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors, gutter, spacing, styles, typo } from '../theme';
import { Cover, ErrorBanner, Eyebrow, Ghost, Reveal, Solid, useParallax } from '../ui';

type State = 'idle' | 'sending' | 'sent' | 'error';

export default function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [err, setErr] = useState('');
  const { scrollY, scrollProps } = useParallax();

  async function send() {
    const sb = supabase();
    if (!sb) { setState('error'); setErr('Supabase not configured.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setState('error'); setErr('Enter a valid email.'); return; }
    setState('sending');
    setErr('');
    const { error } = await sb.auth.signInWithOtp({ email: email.trim() });
    if (error) { setState('error'); setErr(error.message); }
    else setState('sent');
  }

  const label = state === 'sending' ? 'Sending' : state === 'sent' ? 'Resend link' : 'Send magic link';

  return (
    <Animated.ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.section }} keyboardShouldPersistTaps="handled" {...scrollProps}>
      {/* cinematic centre: one picture, one headline, one thing to do */}
      <Cover seed="jamlink-late-night-radio-glow" height={260} dim={0.42} scrollY={scrollY}>
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: gutter, paddingBottom: spacing.xl }}>
          <Reveal>
            <Text style={[typo.display, { textAlign: 'center' }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
              One link gets you in
            </Text>
          </Reveal>
        </View>
      </Cover>

      <View style={styles.gutter}>
        <Reveal delay={90}>
          <Text style={[typo.muted, { textAlign: 'center', marginTop: spacing.lg }]}>
            New here or coming back, it is the same email link. It creates your account or opens it.
          </Text>
        </Reveal>

        <View style={{ marginTop: spacing.xxl }}>
          <Eyebrow>Email</Eyebrow>
          <TextInput
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            accessibilityLabel="Email address"
            placeholder="you@example.com"
            placeholderTextColor={colors.dim}
            style={[styles.field, focused && styles.fieldOn]}
          />
        </View>

        <ErrorBanner message={state === 'error' ? err : ''} />

        {state === 'sent' ? (
          <Reveal style={[styles.card, { marginTop: spacing.lg, padding: spacing.lg }]}>
            <Eyebrow>Check your inbox</Eyebrow>
            <Text style={[typo.body, { marginTop: spacing.sm }]}>
              The magic link is on its way to {email.trim()}. It can take a minute to land.
            </Text>
          </Reveal>
        ) : null}

        <Solid label={label} onPress={send} disabled={state === 'sending'} style={{ marginTop: spacing.xl }} />

        {state === 'sent' ? (
          <Ghost label="I am logged in, back to the feed" onPress={onDone} style={{ marginTop: spacing.md }} />
        ) : null}

        <Text style={[typo.micro, { marginTop: spacing.xl }]}>
          Heads up: the link opens JamLink in your browser, not in this app. Finish signing in there, then come
          back and pull to refresh.
        </Text>
      </View>
    </Animated.ScrollView>
  );
}
