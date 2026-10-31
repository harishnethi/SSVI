import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { signInWithGoogle } from '@/lib/supabase';
import { colors } from './ui';

/** "Continue with Google" button with an "or" divider below it, for the log-in and sign-up pages. */
export function GoogleButton({ onError }: { onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    const error = await signInWithGoogle();
    // On success the browser leaves for Google, so only errors come back here.
    setBusy(false);
    if (error) onError(error);
  };

  return (
    <>
      <Pressable
        onPress={go}
        disabled={busy}
        accessibilityRole="button"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingVertical: 13,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          opacity: busy ? 0.6 : pressed ? 0.85 : 1,
        })}
      >
        {busy ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="logo-google" size={20} color="#4285F4" />}
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Continue with Google</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ color: colors.muted, fontWeight: '600' }}>or with email</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
    </>
  );
}
