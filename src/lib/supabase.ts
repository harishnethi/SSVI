import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isConfigured = url.startsWith('http') && anonKey.length > 20;

/**
 * Creates a login for someone else (e.g. the admin adding a worker) without replacing
 * the admin's own session: a throwaway client that never stores what it signs in as.
 */
export async function createLoginFor(email: string, password: string, data: Record<string, string>) {
  const temp = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'ssvi-temp' },
  });
  return temp.auth.signUp({ email, password, options: { data } });
}

export const supabase = createClient(isConfigured ? url : 'http://localhost', isConfigured ? anonKey : 'missing', {
  auth: {
    // On web, supabase-js uses localStorage by default; AsyncStorage is for iOS/Android.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On the website, Google sends the visitor back with a one-time code in the address,
    // which the client swaps for a session (PKCE flow).
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});

/**
 * "Continue with Google". Returns an error message instead of redirecting when Google sign-in
 * is not switched on in Supabase yet, so the visitor never lands on a raw error page.
 */
export async function signInWithGoogle(): Promise<string | null> {
  if (Platform.OS !== 'web') return 'Google sign-in is available on the website. In the app, use email and password.';
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anonKey } });
    const settings = (await res.json()) as { external?: { google?: boolean } };
    if (!settings.external?.google) return 'Google sign-in is not switched on yet. Please use email and password for now.';
  } catch {
    // If the check itself fails, try anyway; Supabase will show its own message.
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/login` },
  });
  return error?.message ?? null;
}
