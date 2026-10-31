import { Link } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { AuthPage } from '@/components/AuthPage';
import { GoogleButton } from '@/components/GoogleButton';
import { Button, colors, Field } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(error.message === 'Email not confirmed' ? 'Please open the link we emailed you first, then log in.' : error.message);
  };

  return (
    <AuthPage title="Log in" subtitle="Customers, workers and admin all log in here.">
      <GoogleButton onError={setError} />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" onSubmitEditing={signIn} />
      {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
      <Button title="Log in" icon="log-in-outline" onPress={signIn} loading={busy} disabled={!email || !password} />
      <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 4 }}>
        New customer?{' '}
        <Link href="/signup" style={{ color: colors.primary, fontWeight: '700' }}>
          Create an account
        </Link>
      </Text>
    </AuthPage>
  );
}
