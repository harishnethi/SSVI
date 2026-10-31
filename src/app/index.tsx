import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H } from '@/components/Heading';
import { Logo } from '@/components/Logo';
import { homeFor, useAuth } from '@/lib/auth';
import { BrandGradient, Button, colors, IconTile, shadow, styles } from '@/components/ui';
import { ROYAL_GOLD } from '@/lib/palettes';
import { supabase } from '@/lib/supabase';

type IconName = ComponentProps<typeof Ionicons>['name'];
type CatalogItem = { name: string; unit: string; hsn: string };
type Business = { business_name: string; address: string; phone: string; email: string };
type Section = 'products' | 'about' | 'contact';

const MAX = 1160;
const TELUGU_NAME = 'సాయి వెంకటేశ్వర ఇండస్ట్రీస్';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, role } = useAuth();
  // Signed-in visitors get a button back to their own pages instead of Log in / Sign up.
  const accountLabel = role === 'customer' ? 'My account' : role === 'admin' || role === 'worker' ? 'Dashboard' : 'My account';
  const goAccount = () => router.push(homeFor(role) as never);
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [biz, setBiz] = useState<Business | null>(null);
  const scroller = useRef<{ scrollTo: (o: { y: number; animated?: boolean }) => void } | null>(null);
  const offsets = useRef<Partial<Record<Section, number>>>({});

  useEffect(() => {
    supabase.rpc('public_catalog').then(({ data }) => setCatalog((data as CatalogItem[]) ?? []));
    supabase.rpc('public_business').then(({ data }) => setBiz(((data as Business[]) ?? [])[0] ?? null));
  }, []);

  const goTo = (s: Section) => scroller.current?.scrollTo({ y: Math.max(0, (offsets.current[s] ?? 0) - 12), animated: true });

  const phoneDigits = (biz?.phone ?? '').replace(/\D/g, '');
  const whatsapp = phoneDigits ? `https://wa.me/${phoneDigits.length === 10 ? '91' + phoneDigits : phoneDigits}` : null;

  return (
    <ScrollView ref={scroller as never} style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top }}>
      {/* This page has a plain top bar instead of a coloured header, so the status bar icons are dark. */}
      <StatusBar style="dark" />

      {/* Top navigation */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card }}>
        <Row style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <Logo height={34} style={{ borderWidth: 1, borderColor: colors.border }} />
            {wide && (
              <View>
                <H style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>Sai Venkateshwara Industries</H>
                <Text style={{ fontSize: 12, color: colors.muted }}>{TELUGU_NAME}</Text>
              </View>
            )}
          </View>
          {wide && (
            <View style={{ flexDirection: 'row', gap: 28 }}>
              <NavLink label="Products" onPress={() => goTo('products')} />
              <NavLink label="About" onPress={() => goTo('about')} />
              <NavLink label="Contact" onPress={() => goTo('contact')} />
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {session ? (
              <Button small title={accountLabel} icon="person-circle-outline" onPress={goAccount} />
            ) : (
              <>
                <Link href="/login" style={{ fontWeight: '700', color: colors.text, paddingHorizontal: 6 }}>
                  Log in
                </Link>
                <Button small title="Sign up" onPress={() => router.push('/signup')} />
              </>
            )}
          </View>
        </Row>
      </View>

      {/* Hero */}
      <BrandGradient tone="soft">
        <Row
          style={{
            paddingVertical: wide ? 80 : 44,
            flexDirection: wide ? 'row' : 'column',
            gap: wide ? 56 : 32,
            alignItems: 'center',
          }}
        >
          <View style={{ flex: wide ? 1.15 : undefined, width: wide ? undefined : '100%' }}>
            <Eyebrow>Murmura · Puffed rice</Eyebrow>
            <H style={{ fontSize: wide ? 58 : 38, lineHeight: wide ? 66 : 46, fontWeight: '700', color: colors.primary }}>
              Pure Quality.{'\n'}Trusted Tradition.
            </H>
            <Text style={{ fontSize: wide ? 20 : 17, color: colors.gold, fontWeight: '700', marginTop: 14 }}>{TELUGU_NAME}</Text>
            <Text style={{ fontSize: 17, lineHeight: 27, color: colors.text, opacity: 0.85, marginTop: 14, maxWidth: 560 }}>
              Delivering quality murmura with consistency — crisp, light and freshly puffed from selected paddy, for shops,
              dealers and caterers. Order online, follow your delivery and download your bills any time.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
              <View style={{ minWidth: 190 }}>
                <Button title={session ? accountLabel : 'Order online'} icon="cart-outline" onPress={session ? goAccount : () => router.push('/signup')} />
              </View>
              <View style={{ minWidth: 150 }}>
                <Button title="View products" variant="secondary" icon="leaf-outline" onPress={() => goTo('products')} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: wide ? 28 : 18, marginTop: 26 }}>
              <Trust icon="leaf-outline" label="100% natural" />
              <Trust icon="sparkles-outline" label="Fresh every batch" />
              <Trust icon="shield-checkmark-outline" label="Hygienically processed" />
            </View>
          </View>

          <View style={{ flex: wide ? 0.85 : undefined, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                padding: wide ? 22 : 16,
                borderRadius: 999,
                backgroundColor: colors.primaryLight,
                borderWidth: 2,
                borderColor: ROYAL_GOLD,
              }}
            >
              <View
                style={{
                  width: wide ? 380 : 280,
                  height: wide ? 380 : 280,
                  borderRadius: 999,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...shadow,
                }}
              >
                <Logo variant="full" height={wide ? 230 : 170} style={{ alignSelf: 'center', padding: 0 }} />
              </View>
            </View>
          </View>
        </Row>
      </BrandGradient>

      {/* Products / Process / Promise */}
      <View onLayout={(e) => (offsets.current.about = e.nativeEvent.layout.y)}>
        <Row style={{ paddingVertical: 56 }}>
          <SectionHeading eyebrow="Who we are" title="From selected paddy to your shelf" center />
          <Grid wide={wide}>
            <FeatureCard
              icon="leaf-outline"
              title="Our Products"
              text="Crisp, light murmura in sizes for retail shops, dealers, caterers and bulk buyers."
              action="Explore products"
              onPress={() => goTo('products')}
            />
            <FeatureCard
              icon="construct-outline"
              title="Our Process"
              text="Paddy is cleaned, roasted and puffed under hygienic conditions, batch after batch, for the same taste every time."
              action="Know more"
              onPress={() => goTo('contact')}
            />
            <FeatureCard
              icon="ribbon-outline"
              title="Our Promise"
              text="Honest weights, fair wholesale rates and a proper GST bill with every order."
              action="Start ordering"
              onPress={session ? goAccount : () => router.push('/signup')}
            />
          </Grid>
        </Row>
      </View>

      {/* Quality row */}
      <View style={{ backgroundColor: colors.primaryLight, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border }}>
        <Row style={{ paddingVertical: 36, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 24 }}>
          <Quality icon="leaf-outline" label="100% natural" wide={wide} />
          <Quality icon="nutrition-outline" label="Light & wholesome" wide={wide} />
          <Quality icon="flask-outline" label="No artificial additives" wide={wide} />
          <Quality icon="shield-checkmark-outline" label="Hygienically processed" wide={wide} />
          <Quality icon="receipt-outline" label="GST invoices" wide={wide} />
          <Quality icon="car-outline" label="Reliable delivery" wide={wide} />
        </Row>
      </View>

      {/* Products */}
      <View onLayout={(e) => (offsets.current.products = e.nativeEvent.layout.y)}>
        <Row style={{ paddingVertical: 56 }}>
          <SectionHeading eyebrow="Our range" title="Our products" sub="Log in to see today’s prices and place an order." />
          {catalog.length ? (
            <Grid wide={wide}>
              {catalog.map((p) => (
                <View key={p.name} style={[styles.card, { marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
                  <IconTile name="leaf-outline" size={50} />
                  <View style={{ flex: 1 }}>
                    <H style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{p.name}</H>
                    <Text style={{ color: colors.muted, marginTop: 3 }}>
                      Sold per {p.unit}
                      {p.hsn ? ` · HSN ${p.hsn}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </Grid>
          ) : (
            <View style={[styles.card, { padding: 22 }]}>
              <Text style={{ color: colors.muted, fontSize: 16 }}>Our product list is coming soon. Call or WhatsApp us for today’s rates.</Text>
            </View>
          )}

          <View style={[styles.card, { marginTop: 28, padding: 24, flexDirection: wide ? 'row' : 'column', gap: 20 }]}>
            <Step wide={wide} n={1} title="Create your account" text="Your shop name, phone and address." />
            <Step wide={wide} n={2} title="Choose products" text="See today’s prices and place your order." />
            <Step wide={wide} n={3} title="Track & pay" text="Follow dispatch and download GST bills." />
          </View>
        </Row>
      </View>

      {/* Contact */}
      <View onLayout={(e) => (offsets.current.contact = e.nativeEvent.layout.y)}>
        <BrandGradient>
          <Row style={{ paddingVertical: 56, flexDirection: wide ? 'row' : 'column', gap: 32 }}>
            <View style={{ flex: wide ? 1 : undefined }}>
              <Eyebrow light>Get in touch</Eyebrow>
              <H style={{ fontSize: wide ? 38 : 30, fontWeight: '700', color: '#FFFFFF' }}>Order fresh murmura today</H>
              <Text style={{ color: '#FFFFFF', opacity: 0.85, fontSize: 16, lineHeight: 25, marginTop: 10, maxWidth: 480 }}>
                For wholesale rates, bulk orders or a new dealership, contact us directly or create an account to order online.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 22 }}>
                {whatsapp && <GoldButton icon="logo-whatsapp" label="Chat on WhatsApp" onPress={() => Linking.openURL(whatsapp)} />}
                {session ? (
                  <GoldButton icon="person-circle-outline" label={accountLabel} outline onPress={goAccount} />
                ) : (
                  <GoldButton icon="person-add-outline" label="Create account" outline onPress={() => router.push('/signup')} />
                )}
              </View>
            </View>
            <View
              style={{
                flex: wide ? 1 : undefined,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 18,
                padding: 24,
                gap: 16,
                borderWidth: 1,
                borderColor: 'rgba(212,160,68,0.45)',
              }}
            >
              <H style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF' }}>{biz?.business_name || 'Sai Venkateshwara Industries'}</H>
              {!!biz?.address && <Contact icon="location-outline" text={biz.address} />}
              {!!biz?.phone && <Contact icon="call-outline" text={biz.phone} onPress={() => Linking.openURL(`tel:${phoneDigits}`)} />}
              {!!biz?.email && <Contact icon="mail-outline" text={biz.email} onPress={() => Linking.openURL(`mailto:${biz.email}`)} />}
              {!biz?.address && !biz?.phone && !biz?.email && (
                <Text style={{ color: '#FFFFFF', opacity: 0.8 }}>Contact details will appear here once they are added in Settings.</Text>
              )}
            </View>
          </Row>
        </BrandGradient>
      </View>

      {/* Footer */}
      <View style={{ backgroundColor: '#0A2216' }}>
        <Row
          style={{
            paddingVertical: 22,
            paddingBottom: 22 + insets.bottom,
            flexDirection: wide ? 'row' : 'column',
            justifyContent: 'space-between',
            gap: 6,
          }}
        >
          <Text style={{ color: '#FFFFFF', opacity: 0.85 }}>
            © {new Date().getFullYear()} Sai Venkateshwara Industries (Murmura Industries)
          </Text>
          <Text style={{ color: ROYAL_GOLD, fontWeight: '600' }}>{TELUGU_NAME}</Text>
        </Row>
      </View>
    </ScrollView>
  );
}

function Row({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[{ width: '100%', maxWidth: MAX, alignSelf: 'center', paddingHorizontal: 20 }, style]}>{children}</View>;
}

function Grid({ children, wide }: { children: ReactNode; wide: boolean }) {
  return (
    <View style={{ flexDirection: wide ? 'row' : 'column', flexWrap: 'wrap', gap: 18 }}>
      {Array.isArray(children)
        ? children.map((c, i) => (
            <View key={i} style={{ flexBasis: wide ? '30%' : 'auto', flexGrow: 1 }}>
              {c}
            </View>
          ))
        : children}
    </View>
  );
}

function NavLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={{ fontWeight: '600', color: colors.text, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <Text
      style={{
        color: light ? ROYAL_GOLD : colors.gold,
        fontWeight: '800',
        letterSpacing: 2.5,
        fontSize: 13,
        textTransform: 'uppercase',
        marginBottom: 14,
      }}
    >
      {children}
    </Text>
  );
}

/** Gold rule with a small diamond, used under section headings. */
function Ornament({ center }: { center?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: center ? 'center' : 'flex-start', marginVertical: 12 }}>
      <View style={{ width: 40, height: 1.5, backgroundColor: ROYAL_GOLD }} />
      <View style={{ width: 8, height: 8, backgroundColor: ROYAL_GOLD, transform: [{ rotate: '45deg' }] }} />
      <View style={{ width: 40, height: 1.5, backgroundColor: ROYAL_GOLD }} />
    </View>
  );
}

function SectionHeading({ eyebrow, title, sub, center }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <View style={{ marginBottom: 28, alignItems: center ? 'center' : 'flex-start' }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <H style={{ fontSize: 36, fontWeight: '700', color: colors.primary, textAlign: center ? 'center' : 'left' }}>{title}</H>
      <Ornament center={center} />
      {!!sub && <Text style={{ fontSize: 16, color: colors.muted, textAlign: center ? 'center' : 'left' }}>{sub}</Text>}
    </View>
  );
}

function Trust({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={20} color={colors.gold} />
      <Text style={{ fontWeight: '700', color: colors.primary, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
    </View>
  );
}

function FeatureCard({ icon, title, text, action, onPress }: { icon: IconName; title: string; text: string; action: string; onPress: () => void }) {
  return (
    <BrandGradient style={{ borderRadius: 20, padding: 26, height: '100%', ...shadow }}>
      <IconTile name={icon} size={50} />
      <H style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginTop: 18 }}>{title}</H>
      <View style={{ width: 44, height: 2, backgroundColor: ROYAL_GOLD, marginVertical: 12 }} />
      <Text style={{ color: '#FFFFFF', opacity: 0.88, fontSize: 15, lineHeight: 23, flexGrow: 1 }}>{text}</Text>
      <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 }}>
        <Text style={{ color: ROYAL_GOLD, fontWeight: '800' }}>{action}</Text>
        <Ionicons name="arrow-forward" size={16} color={ROYAL_GOLD} />
      </Pressable>
    </BrandGradient>
  );
}

function Quality({ icon, label, wide }: { icon: IconName; label: string; wide: boolean }) {
  return (
    <View style={{ width: wide ? '15%' : '33%', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          borderWidth: 1.5,
          borderColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={{ fontWeight: '700', color: colors.primary, textAlign: 'center', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}
      </Text>
    </View>
  );
}

function Step({ n, title, text, wide }: { n: number; title: string; text: string; wide: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14, flex: wide ? 1 : undefined }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.onPrimary, fontWeight: '800' }}>{n}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>{title}</Text>
        <Text style={{ color: colors.muted, marginTop: 2 }}>{text}</Text>
      </View>
    </View>
  );
}

function GoldButton({ icon, label, onPress, outline }: { icon: IconName; label: string; onPress: () => void; outline?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 13,
        paddingHorizontal: 20,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: ROYAL_GOLD,
        backgroundColor: outline ? 'transparent' : ROYAL_GOLD,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Ionicons name={icon} size={18} color={outline ? ROYAL_GOLD : '#123B27'} />
      <Text style={{ fontWeight: '800', color: outline ? ROYAL_GOLD : '#123B27' }}>{label}</Text>
    </Pressable>
  );
}

function Contact({ icon, text, onPress }: { icon: IconName; text: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <Ionicons name={icon} size={20} color={ROYAL_GOLD} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, fontSize: 16, color: '#FFFFFF', lineHeight: 22 }}>{text}</Text>
    </Pressable>
  );
}
