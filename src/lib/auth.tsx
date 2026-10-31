import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isConfigured } from './supabase';
import type { Profile, Role } from './types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  role: null,
  loading: true,
  refreshProfile: async () => {},
});

async function loadProfile(session: Session | null): Promise<Profile | null> {
  if (!session) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  useEffect(() => {
    if (!isConfigured) return;
    let active = true;
    const apply = async (s: Session | null) => {
      const p = await loadProfile(s);
      if (!active) return;
      setSession(s);
      setProfile(p);
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      // Token refreshes keep the same user, so there is no need to reload the profile.
      if (event === 'TOKEN_REFRESHED') return setSession(s);
      // Defer so the Supabase client finishes its own auth work before we query.
      setTimeout(() => apply(s), 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => setProfile(await loadProfile(session)), [session]);

  const role: Role | null = session ? (profile?.active ? profile.role : 'none') : null;

  return <AuthContext.Provider value={{ session, profile, role, loading, refreshProfile }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Home page for each kind of account. */
export const homeFor = (role: Role | null) =>
  role === 'admin' ? '/admin' : role === 'worker' ? '/worker' : role === 'customer' ? '/account' : role === 'none' ? '/pending' : '/';
