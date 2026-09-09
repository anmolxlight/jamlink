import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors, spacing, styles } from '../theme';
import { ErrorBanner } from '../ui';

type State = 'idle' | 'sending' | 'sent' | 'error';

export default function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [err, setErr] = useState('');

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

  const label = state === 'sending' ? 'Sending…' : state === 'sent' ? 'Resend link' : 'Send magic link';

  return (
    <ScrollView style={{ flex: 1 }}>
      <Text style={[styles.title, { marginTop: spacing.md }]}>Sign up or log in</Text>
      <Text style={[styles.muted, { marginTop: spacing.xs }]}>
        One email link does both. If you are new it creates your account, and if you are already here it opens it.
      </Text>
      <Text style={styles.label}>Email</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
        keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.muted} style={styles.input} />
      <ErrorBanner message={state === 'error' ? err : ''} />
      {state === 'sent' ? (
        <Text style={[styles.body, { marginTop: 8 }]}>Check your email for the magic link. It may take a minute.</Text>
      ) : null}
      <Text style={[styles.muted, { marginTop: spacing.sm }]}>
        Heads up: the link opens JamLink in your browser, not in this app. Finish signing in there, then come
        back and pull to refresh.
      </Text>
      <TouchableOpacity onPress={send} disabled={state === 'sending'} style={[styles.bigButton, state === 'sending' && { opacity: 0.6 }]}>
        <Text style={styles.bigButtonText}>{label}</Text>
      </TouchableOpacity>
      {state === 'sent' ? (
        <TouchableOpacity onPress={onDone}>
          <Text style={{ color: colors.accent, textAlign: 'center' }}>I've logged in, back to Feed →</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}
