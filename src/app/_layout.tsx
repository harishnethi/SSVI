import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { DialogHost } from '@/components/DialogHost';
import { colors, Card, BrandHeader } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import { isConfigured } from '@/lib/supabase';

function RootStack() {
  const { session, role, loading } = useAuth();

  if (!isConfigured) return <SetupNeeded />;
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const admin = role === 'admin';
  const worker = role === 'worker';
  const customer = role === 'customer';

  // Each account type only has its own screens. When someone opens a screen they may not see (or signs in on
  // the log-in page), they are sent to the first screen they can open, which is listed first: their home page.
  return (
    <Stack
      screenOptions={{
        headerTransparent: false,
        headerBackground: BrandHeader,
        headerTintColor: '#fff',
        headerTitleStyle: Platform.OS === 'web' ? { fontWeight: '700' } : { fontFamily: 'PlayfairDisplay_700Bold' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={admin}>
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="customer/[id]" options={{ title: 'Customer' }} />
        <Stack.Screen name="customer/edit" options={{ title: 'Customer' }} />
        <Stack.Screen name="product/edit" options={{ title: 'Product' }} />
        <Stack.Screen name="order/new" options={{ title: 'New order' }} />
        <Stack.Screen name="invoice/new" options={{ title: 'New invoice' }} />
        <Stack.Screen name="settings" options={{ title: 'Business settings' }} />
      </Stack.Protected>

      <Stack.Protected guard={worker}>
        <Stack.Screen name="worker" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={customer}>
        <Stack.Screen name="account" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={role === 'none'}>
        <Stack.Screen name="pending" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={admin || worker}>
        <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
      </Stack.Protected>

      <Stack.Protected guard={admin || worker || customer}>
        <Stack.Screen name="order/[id]" options={{ title: 'Order' }} />
      </Stack.Protected>

      <Stack.Protected guard={admin || customer}>
        <Stack.Screen name="invoice/[id]" options={{ title: 'Invoice' }} />
      </Stack.Protected>

      {/* The public home page is open to everyone, signed in or not. It comes after the role screens so that
          signing in lands each person on their own home page rather than here. */}
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Sai Venkateshwara Industries' }} />

      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false, title: 'Log in' }} />
        <Stack.Screen name="signup" options={{ headerShown: false, title: 'Create account' }} />
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

// The website gets its fonts from Google Fonts (see +html.tsx); phones load the heading font here.
const nativeFonts = Platform.OS === 'web' ? {} : { PlayfairDisplay_700Bold };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(nativeFonts);
  if (!fontsLoaded && !fontError) return null;
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootStack />
      <DialogHost />
    </AuthProvider>
  );
}
