import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { H } from '@/components/Heading';
import { BrandGradient, Button, colors, Empty, IconTile, Screen, styles } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { money, qty } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Invoice, Product } from '@/lib/types';
import { must, useData } from '@/lib/useData';

/** Customer home: the product catalogue with prices and add-to-cart. */
export default function Products() {
  const router = useRouter();
  const { profile } = useAuth();
  const cart = useCart();
  const { width } = useWindowDimensions();
  const cols = width >= 1000 ? 3 : width >= 640 ? 2 : 1;

  const { data, loading, error, reload } = useData(async () => {
    const [p, i] = await Promise.all([
      supabase.from('products').select('*').eq('kind', 'finished').order('name'),
      supabase.from('invoices').select('total, paid').eq('cancelled', false),
    ]);
    return { products: must(p) as Product[], invoices: must(i) as Pick<Invoice, 'total' | 'paid'>[] };
  });

  if (!data) return <Empty text="" loading={loading} error={error} />;
  const due = data.invoices.reduce((s, i) => s + Math.max(0, Number(i.total) - Number(i.paid)), 0);

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <BrandGradient tone="soft" style={[styles.card, { padding: 22, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 }]}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <H style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>
            Namaste{profile?.full_name ? `, ${profile.full_name}` : ''}
          </H>
          <Text style={{ color: colors.text, opacity: 0.8, marginTop: 4 }}>Choose your murmura, add to cart and place your order.</Text>
        </View>
        {due > 0 && (
          <Pressable onPress={() => router.push('/account/bills')} style={[styles.card, { marginBottom: 0, paddingVertical: 12 }]}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Amount due</Text>
            <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 20 }}>{money(due)}</Text>
          </Pressable>
        )}
      </BrandGradient>

      {data.products.length === 0 ? (
        <View style={[styles.card, { padding: 22 }]}>
          <Text style={{ color: colors.muted, fontSize: 16 }}>No products available right now. Please call or WhatsApp us.</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {data.products.map((p) => (
            <View key={p.id} style={{ width: cols === 1 ? '100%' : cols === 2 ? '48.5%' : '31.8%' }}>
              <ProductCard product={p} inCart={cart.items[p.id] ?? 0} onSet={(q) => cart.setQty(p.id, q)} />
            </View>
          ))}
        </View>
      )}

      {cart.count > 0 && (
        <View style={{ marginTop: 20 }}>
          <Button title={`Go to cart (${cart.count})`} icon="cart-outline" onPress={() => router.push('/account/cart')} />
        </View>
      )}
    </Screen>
  );
}

function ProductCard({ product: p, inCart, onSet }: { product: Product; inCart: number; onSet: (qty: number) => void }) {
  return (
    <View style={[styles.card, { marginBottom: 0, padding: 0, overflow: 'hidden', height: '100%' }]}>
      <BrandGradient tone="soft" style={{ height: 110, alignItems: 'center', justifyContent: 'center' }}>
        <IconTile name="leaf-outline" size={58} />
      </BrandGradient>
      <View style={{ padding: 16, gap: 6, flexGrow: 1 }}>
        <H style={{ fontSize: 19, fontWeight: '700', color: colors.text }}>{p.name}</H>
        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '800' }}>
          {money(p.price)}
          <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '600' }}> / {p.unit}</Text>
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          {Number(p.gst_rate) ? `+ GST ${Number(p.gst_rate)}%` : 'No GST'}
          {p.hsn ? ` · HSN ${p.hsn}` : ''}
        </Text>
        <View style={{ flexGrow: 1 }} />
        {inCart > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Step icon="remove" onPress={() => onSet(inCart - 1)} />
            <TextInput
              value={String(qty(inCart))}
              onChangeText={(v) => onSet(parseFloat(v.replace(/[^0-9.]/g, '')) || 0)}
              keyboardType="decimal-pad"
              style={[styles.input, { flex: 1, textAlign: 'center', paddingVertical: 9, fontWeight: '700' }]}
            />
            <Step icon="add" onPress={() => onSet(inCart + 1)} />
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            <Button small title="Add to cart" icon="cart-outline" onPress={() => onSet(1)} />
          </View>
        )}
        {inCart > 0 && (
          <Text style={{ color: colors.success, fontWeight: '700', fontSize: 13, textAlign: 'center' }}>
            {qty(inCart)} {p.unit} in cart · {money(inCart * Number(p.price))}
          </Text>
        )}
      </View>
    </View>
  );
}

function Step({ icon, onPress }: { icon: 'add' | 'remove'; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityLabel={icon === 'add' ? 'More' : 'Less'}
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
    </Pressable>
  );
}
