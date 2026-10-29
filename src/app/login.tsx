import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Button, Card, colors, Field } from '@/components/ui';
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
    if (error) setError(error.message);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.primary }}
    >
      <View style={{ alignItems: 'center', marginBottom: 28 }}>
        <Text style={{ fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: 2 }}>SSVI</Text>
        <Text style={{ fontSize: 15, color: '#C9D8E8', marginTop: 4 }}>Orders · Inventory · Billing</Text>
      </View>
      <Card style={{ padding: 20, maxWidth: 440, width: '100%', alignSelf: 'center' }}>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" onSubmitEditing={signIn} />
        {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
        <Button title="Sign in" onPress={signIn} loading={busy} disabled={!email || !password} />
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>
          Staff accounts are created by the owner in Supabase.
        </Text>
      </Card>
    </KeyboardAvoidingView>
  );
}
