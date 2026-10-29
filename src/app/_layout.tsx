import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors, Card } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import { isConfigured } from '@/lib/supabase';

function RootStack() {
  const { session, loading } = useAuth();

  if (!isConfigured) return <SetupNeeded />;
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerTransparent: false,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="customer/[id]" options={{ title: 'Customer' }} />
        <Stack.Screen name="customer/edit" options={{ title: 'Customer' }} />
        <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
        <Stack.Screen name="product/edit" options={{ title: 'Product' }} />
        <Stack.Screen name="order/new" options={{ title: 'New order' }} />
        <Stack.Screen name="order/[id]" options={{ title: 'Order' }} />
        <Stack.Screen name="invoice/new" options={{ title: 'New invoice' }} />
        <Stack.Screen name="invoice/[id]" options={{ title: 'Invoice' }} />
        <Stack.Screen name="settings" options={{ title: 'Business settings' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

function SetupNeeded() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
      <Card>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8, color: colors.text }}>Connect the database</Text>
        <Text style={{ fontSize: 15, color: colors.muted, lineHeight: 22 }}>
          Copy .env.example to .env and fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY from your
          Supabase project (Project Settings → API). Then restart the app. See SETUP.md for the full steps.
        </Text>
      </Card>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootStack />
    </AuthProvider>
  );
}
