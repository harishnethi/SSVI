import { Text } from 'react-native';
import { Button, colors } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { AuthPage } from '@/components/AuthPage';

export default function Pending() {
  const { session, refreshProfile } = useAuth();
  return (
    <AuthPage title="Waiting for access" subtitle={session?.user.email ?? ''}>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 16 }}>
        Your login works, but the owner has not given it access yet. Ask the owner to open Workers in the admin dashboard
        and approve you.
      </Text>
      <Button title="Check again" icon="refresh" onPress={refreshProfile} />
      <Button title="Sign out" variant="secondary" icon="log-out-outline" onPress={() => supabase.auth.signOut()} />
    </AuthPage>
  );
}
