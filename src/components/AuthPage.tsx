import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { H } from './Heading';
import { Logo } from './Logo';
import { Card, colors, BrandGradient, shadow } from './ui';

/** Brand page with the SSVI logo and a white card, shared by log in and sign up. */
export function AuthPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <BrandGradient style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Link href="/" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel="Back to website">
                <Logo variant="full" height={150} style={{ alignSelf: 'center', ...shadow }} />
              </Pressable>
            </Link>
          </View>
          <Card style={{ padding: 24, maxWidth: 460, width: '100%', alignSelf: 'center' }}>
            <H style={{ fontSize: 26, fontWeight: '700', color: colors.primary }}>{title}</H>
            <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 18 }}>{subtitle}</Text>
            {children}
          </Card>
          <Link href="/" style={{ color: '#fff', fontWeight: '700', textAlign: 'center', marginTop: 18 }}>
            ← Back to website
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </BrandGradient>
  );
}
