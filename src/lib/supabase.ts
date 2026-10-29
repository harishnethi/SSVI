import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isConfigured = url.startsWith('http') && anonKey.length > 20;

export const supabase = createClient(isConfigured ? url : 'http://localhost', isConfigured ? anonKey : 'missing', {
  auth: {
    // On web, supabase-js uses localStorage by default; AsyncStorage is for iOS/Android.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
