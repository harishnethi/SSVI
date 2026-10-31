import { Link } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { AuthPage } from '@/components/AuthPage';
import { GoogleButton } from '@/components/GoogleButton';
import { Button, colors, Field } from '@/components/ui';
import { supabase } from '@/lib/supabase';

// Only what is needed to start ordering; address, state and GSTIN can be added later on the Profile page.
const blank = { name: '', phone: '', email: '', password: '' };

/** Supabase's sign-up errors in plain words. */
function friendly(message: string) {
  if (/signups? not allowed/i.test(message)) return 'New accounts are switched off right now. Please call or WhatsApp us.';
  if (/already registered/i.test(message)) return 'This email already has an account. Please log in instead.';
  return message;
}

export default function Signup() {
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const set = (k: keyof typeof blank) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) return setError('Enter your name or shop name.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          signup: 'customer',
          name: form.name.trim(),
          phone: form.phone.trim(),
        },
      },
    });
    setBusy(false);
    if (error) return setError(friendly(error.message));
    // With email confirmation on, there is no session until the customer opens the emailed link.
    if (!data.session) setCheckEmail(true);
  };

  if (checkEmail) {
    return (
      <AuthPage title="Check your email" subtitle={`We sent a link to ${form.email.trim()}.`}>
        <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 16 }}>
          Open the link in that email to confirm your account, then come back and log in.
        </Text>
        <Link href="/login" style={{ color: colors.primary, fontWeight: '700' }}>
          Go to log in →
        </Link>
      </AuthPage>
    );
  }

  return (
    <AuthPage title="Create customer account" subtitle="Order murmura online, track deliveries and see your bills.">
      <GoogleButton onError={setError} />
      <Field label="Your name or shop name *" value={form.name} onChangeText={set('name')} autoComplete="name" />
      <Field label="Phone (optional)" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" />
      <Field label="Email *" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label="Password *" value={form.password} onChangeText={set('password')} secureTextEntry autoComplete="new-password" placeholder="At least 6 characters" />
      {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
      <Button title="Create account" icon="person-add-outline" onPress={submit} loading={busy} disabled={!form.email || !form.password} />
      <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 4 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: colors.primary, fontWeight: '700' }}>
          Log in
        </Link>
      </Text>
    </AuthPage>
  );
}
