import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { confirm } from '@/lib/dialog';
import { supabase } from '@/lib/supabase';
import { H } from './Heading';
import { Logo } from './Logo';
import { colors, BrandGradient } from './ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface NavItem {
  name: string;
  href: string;
  label: string;
  icon: IconName;
}

/** Wide screens get a sidebar like a website; phones get a bottom bar. */
export const WIDE = 900;

/**
 * Page frame for each dashboard: saffron top bar, sidebar (wide) or bottom bar (narrow),
 * and the current page in between.
 */
export function Shell({ items, title, extra }: { items: NavItem[]; title: string; extra?: NavItem[] }) {
  const wide = useWindowDimensions().width >= WIDE;
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const current = [...items].sort((a, b) => b.href.length - a.href.length).find((i) => pathname.startsWith(i.href));

  return (
    <Tabs>
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', backgroundColor: colors.bg }}>
        {wide && (
          <BrandGradient style={{ width: 248, paddingTop: insets.top + 20, paddingHorizontal: 14 }}>
            <Brand subtitle={title} />
            <View style={{ marginTop: 24, gap: 4 }}>
              {items.map((i) => (
                <TabTrigger key={i.name} name={i.name} asChild>
                  <SideButton item={i} />
                </TabTrigger>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <AccountBox extra={extra} />
          </BrandGradient>
        )}

        <View style={{ flex: 1 }}>
          {!wide && (
            <BrandGradient style={{ paddingTop: insets.top + 10, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <H style={{ color: '#fff', fontSize: 21, fontWeight: '700' }}>{current?.label ?? title}</H>
                <Text style={{ color: '#fff', opacity: 0.85, fontSize: 12 }}>SSVI · {title}</Text>
              </View>
              <AccountButtons extra={extra} />
            </BrandGradient>
          )}
          {wide && (
            <View
              style={{
                paddingHorizontal: 32,
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <H style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>{current?.label ?? title}</H>
            </View>
          )}
          <TabSlot />
          {!wide && (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card, paddingBottom: insets.bottom }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                {items.map((i) => (
                  <TabTrigger key={i.name} name={i.name} asChild>
                    <BottomButton item={i} count={items.length} />
                  </TabTrigger>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <TabList style={{ display: 'none' }}>
        {items.map((i) => (
          <TabTrigger key={i.name} name={i.name} href={i.href as never} />
        ))}
      </TabList>
    </Tabs>
  );
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6 }}>
      <Logo height={30} />
      <View style={{ flex: 1 }}>
        <H style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Sai Venkateshwara</H>
        <Text style={{ color: '#fff', opacity: 0.85, fontSize: 12 }}>{subtitle}</Text>
      </View>
    </View>
  );
}

// TabTriggerSlotProps types `ref` as a component ref; at runtime it is the Pressable's view.
type SlotProps = Omit<TabTriggerSlotProps, 'ref'> & { ref?: unknown };

function SideButton({ item, isFocused, ref, ...props }: SlotProps & { item: NavItem }) {
  return (
    <Pressable
      ref={ref as never}
      {...props}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: isFocused ? colors.card : pressed ? 'rgba(255,255,255,0.18)' : 'transparent',
      })}
    >
      <Ionicons name={item.icon} size={20} color={isFocused ? colors.primaryDark : '#fff'} />
      <Text style={{ fontSize: 15, fontWeight: '700', color: isFocused ? colors.primaryDark : '#fff' }}>{item.label}</Text>
    </Pressable>
  );
}

function BottomButton({ item, count, isFocused, ref, ...props }: SlotProps & { item: NavItem; count: number }) {
  return (
    <Pressable
      ref={ref as never}
      {...props}
      style={{ flex: 1, minWidth: count > 5 ? 72 : undefined, alignItems: 'center', paddingVertical: 8 }}
    >
      <Ionicons name={item.icon} size={22} color={isFocused ? colors.primary : colors.muted} />
      <Text style={{ fontSize: 11, fontWeight: '600', marginTop: 2, color: isFocused ? colors.primary : colors.muted }}>{item.label}</Text>
    </Pressable>
  );
}

async function signOut() {
  if (await confirm('Sign out?', 'You will need to log in again (with Google or your email and password).', 'Sign out')) {
    await supabase.auth.signOut();
  }
}

/** Name, extra links (e.g. Settings) and sign out, at the bottom of the sidebar. */
function AccountBox({ extra }: { extra?: NavItem[] }) {
  const { profile, session } = useAuth();
  const router = useRouter();
  return (
    <View style={{ paddingVertical: 18, gap: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.35)' }}>
      <Text style={{ color: '#fff', fontWeight: '700', paddingHorizontal: 12 }} numberOfLines={1}>
        {profile?.full_name || session?.user.email}
      </Text>
      {extra?.map((i) => (
        <SideLink key={i.name} icon={i.icon} label={i.label} onPress={() => router.push(i.href as never)} />
      ))}
      <SideLink icon="globe-outline" label="Website home" onPress={() => router.push('/')} />
      <SideLink icon="log-out-outline" label="Sign out" onPress={signOut} />
    </View>
  );
}

function SideLink({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, paddingHorizontal: 12 }}>
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={{ color: '#fff', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

function AccountButtons({ extra }: { extra?: NavItem[] }) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Pressable onPress={() => router.push('/')} hitSlop={10} accessibilityLabel="Website home">
        <Ionicons name="globe-outline" size={22} color="#fff" />
      </Pressable>
      {extra?.map((i) => (
        <Pressable key={i.name} onPress={() => router.push(i.href as never)} hitSlop={10}>
          <Ionicons name={i.icon} size={22} color="#fff" />
        </Pressable>
      ))}
      <Pressable onPress={signOut} hitSlop={10}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}
