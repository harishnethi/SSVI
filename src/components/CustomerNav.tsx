import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/lib/cart';
import { confirm } from '@/lib/dialog';
import { supabase } from '@/lib/supabase';
import { H } from './Heading';
import { Logo } from './Logo';
import { colors } from './ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Home', icon: 'home-outline' },
  { href: '/account', label: 'Products', icon: 'leaf-outline' },
  { href: '/account/orders', label: 'My orders', icon: 'cube-outline' },
  { href: '/account/purchases', label: 'Purchases', icon: 'bag-handle-outline' },
  { href: '/account/bills', label: 'Bills', icon: 'receipt-outline' },
  { href: '/account/payments', label: 'Payments', icon: 'wallet-outline' },
];

const isActive = (pathname: string, href: string) => (href === '/' || href === '/account' ? pathname === href : pathname.startsWith(href));

async function signOut() {
  if (await confirm('Sign out?', 'You will need to log in again (with Google or your email and password).', 'Sign out')) {
    await supabase.auth.signOut();
  }
}

/** Website-style top navigation for customers: logo, page links, cart and account. */
export function CustomerNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { count } = useCart();
  const wide = useWindowDimensions().width >= 900;

  const links = LINKS.map((l) => {
    const active = isActive(pathname, l.href);
    return (
      <Pressable
        key={l.href}
        onPress={() => router.push(l.href as never)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: active ? colors.primaryLight : 'transparent',
        }}
      >
        {!wide && <Ionicons name={l.icon} size={16} color={active ? colors.primary : colors.muted} />}
        <Text style={{ fontWeight: active ? '800' : '600', color: active ? colors.primary : colors.text, fontSize: 15 }}>{l.label}</Text>
      </Pressable>
    );
  });

  return (
    <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: insets.top }}>
      <View
        style={{
          width: '100%',
          maxWidth: 1160,
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <Pressable onPress={() => router.push('/')} accessibilityLabel="Home page" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: wide ? undefined : 1 }}>
          <Logo height={30} style={{ borderWidth: 1, borderColor: colors.border }} />
          {wide && <H style={{ fontSize: 17, fontWeight: '700', color: colors.primary }}>Sai Venkateshwara</H>}
        </Pressable>
        {wide && <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>{links}</View>}
        <IconButton icon="cart-outline" label="Cart" badge={count} active={pathname === '/account/cart'} onPress={() => router.push('/account/cart')} />
        <IconButton icon="person-circle-outline" label="Profile" active={pathname === '/account/profile'} onPress={() => router.push('/account/profile')} />
        <IconButton icon="log-out-outline" label="Sign out" onPress={signOut} />
      </View>
      {!wide && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8, gap: 4 }}>
          {links}
        </ScrollView>
      )}
    </View>
  );
}

function IconButton({ icon, label, onPress, badge, active }: { icon: IconName; label: string; onPress: () => void; badge?: number; active?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel={label} style={{ padding: 4 }}>
      <Ionicons name={icon} size={26} color={active ? colors.primary : colors.text} />
      {!!badge && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -4,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 4,
            backgroundColor: colors.gold,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}
