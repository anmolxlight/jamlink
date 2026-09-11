import { useState } from 'react';
import { Animated, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors, gutter, spacing, styles, typo } from '../theme';
import { Cover, ErrorBanner, Eyebrow, Ghost, Reveal, Solid, useParallax } from '../ui';

type State = 'idle' | 'sending' | 'sent' | 'error';
type Mode = 'link' | 'password';

export default function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>('link');
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const { scrollY, scrollProps } = useParallax();

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());

  async function send() {
    const sb = supabase();
    if (!sb) { setState('error'); setErr('Supabase not configured.'); return; }
    if (!emailOk) { setState('error'); setErr('Enter a valid email.'); return; }
    setState('sending');
    setErr('');
    const { error } = await sb.auth.signInWithOtp({ email: email.trim() });
    if (error) { setState('error'); setErr(error.message); }
    else {
      setState('sent');
      setNote(`The magic link is on its way to ${email.trim()}. It can take a minute to land.`);
    }
  }

  async function passwordAuth(kind: 'signin' | 'signup') {
    const sb = supabase();
    if (!sb) { setState('error'); setErr('Supabase not configured.'); return; }
    if (!emailOk) { setState('error'); setErr('Enter a valid email.'); return; }
    if (password.length < 6) { setState('error'); setErr('Password needs at least 6 characters.'); return; }
    setBusy(true);
    setErr('');
    const { data, error } =
      kind === 'signin'
        ? await sb.auth.signInWithPassword({ email: email.trim(), password })
        : await sb.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) { setState('error'); setErr(error.message); return; }
    if (data.session) { onDone(); return; }
    setState('sent');
    setNote(`Account created for ${email.trim()}. Check your inbox to confirm it, then come back and sign in.`);
  }

  const label = state === 'sending' ? 'Sending' : state === 'sent' ? 'Resend link' : 'Send magic link';

  const pill = (m: Mode, text: string) => (
    <TouchableOpacity
      key={m}
      onPress={() => { setMode(m); setState('idle'); setErr(''); }}
      accessibilityRole="tab"
      accessibilityState={{ selected: mode === m }}
      accessibilityLabel={text}
      style={{
        flex: 1,
        borderRadius: 999,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        backgroundColor: mode === m ? colors.accent : 'transparent',
        borderWidth: 1,
        borderColor: mode === m ? colors.accent : colors.line,
      }}>
      <Text style={[typo.body, { fontWeight: 'bold', color: mode === m ? '#000' : colors.text }]}>
        {text}
      </Text>
    </TouchableOpacity>
  );

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
            {mode === 'link'
              ? 'New here or coming back, it is the same email link. It creates your account or opens it.'
              : 'Use your email and password. New here? Create your account below.'}
          </Text>
        </Reveal>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
          {pill('link', 'Email link')}
          {pill('password', 'Password')}
        </View>

        <View style={{ marginTop: spacing.xxl }}>
          <Eyebrow>Email</Eyebrow>
          <TextInput
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            accessibilityLabel="Email address"
            placeholder="you@example.com"
            placeholderTextColor={colors.dim}
            style={[styles.field, focused === 'email' && styles.fieldOn]}
          />
        </View>

        {mode === 'password' ? (
          <View style={{ marginTop: spacing.md }}>
            <Eyebrow>Password</Eyebrow>
            <TextInput
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Password"
              placeholder="At least 6 characters"
              placeholderTextColor={colors.dim}
              style={[styles.field, focused === 'password' && styles.fieldOn]}
            />
          </View>
        ) : null}

        <ErrorBanner message={state === 'error' ? err : ''} />

        {state === 'sent' ? (
          <Reveal style={[styles.card, { marginTop: spacing.lg, padding: spacing.lg }]}>
            <Eyebrow>{mode === 'link' ? 'Check your inbox' : 'Almost there'}</Eyebrow>
            <Text style={[typo.body, { marginTop: spacing.sm }]}>
              {note}
            </Text>
          </Reveal>
        ) : null}

        {mode === 'link' ? (
          <Solid label={label} onPress={send} disabled={state === 'sending'} style={{ marginTop: spacing.xl }} />
        ) : (
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Solid label={busy ? 'Signing in...' : 'Sign in'} onPress={() => passwordAuth('signin')} disabled={busy} />
            <Ghost label="Create account" onPress={() => passwordAuth('signup')} disabled={busy} />
          </View>
        )}

        {state === 'sent' && mode === 'link' ? (
          <Ghost label="I am logged in, back to the feed" onPress={onDone} style={{ marginTop: spacing.md }} />
        ) : null}

        <Text style={[typo.micro, { marginTop: spacing.xl }]}>
          {mode === 'link'
            ? 'Heads up: the link opens JamLink in your browser, not in this app. Finish signing in there, then come back and pull to refresh.'
            : 'Passwords are stored as salted hashes and never touch our code.'}
        </Text>
      </View>
    </Animated.ScrollView>
  );
}
