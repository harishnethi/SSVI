import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { H } from '@/components/Heading';
import { Button, Card, colors, Empty, Field, FieldRow, IconTile, KeyValue, Screen, SectionTitle, styles } from '@/components/ui';
import { useCart } from '@/lib/cart';
import { notify } from '@/lib/dialog';
import { money, qty, round2 } from '@/lib/format';
import { isValidDate } from '@/lib/lookups';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import { must, useData } from '@/lib/useData';

export default function Cart() {
  const router = useRouter();
  const cart = useCart();
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { data, loading, error } = useData(
    async () => must(await supabase.from('products').select('*').eq('kind', 'finished').order('name')) as Product[],
  );

  if (!data) return <Empty text="" loading={loading} error={error} />;

  // Products can be removed from sale after they were added to the cart; those lines are skipped.
  const lines = data.filter((p) => cart.items[p.id] > 0).map((p) => ({ p, q: cart.items[p.id], amount: round2(cart.items[p.id] * Number(p.price)) }));
  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0));
  const tax = round2(lines.reduce((s, l) => s + round2((l.amount * Number(l.p.gst_rate)) / 100), 0));

  const place = async () => {
    if (!lines.length) return;
    if (deliveryDate && !isValidDate(deliveryDate)) return notify('Delivery date must be YYYY-MM-DD');
    setSaving(true);
    const { data: order, error } = await supabase.rpc('place_order', {
      p: { delivery_date: deliveryDate, notes: notes.trim(), items: lines.map((l) => ({ product_id: l.p.id, qty: l.q })) },
    });
    setSaving(false);
    if (error) return notify('Could not place order', error.message);
    cart.clear();
    notify('Order placed', `Your order ${order.order_no} has been received. We will confirm it soon.`);
    router.replace(`/account/orders/${order.id}`);
  };

  if (!lines.length) {
    return (
      <Screen>
        <View style={[styles.card, { alignItems: 'center', padding: 36, gap: 12 }]}>
          <Ionicons name="cart-outline" size={48} color={colors.muted} />
          <H style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>Your cart is empty</H>
          <Text style={{ color: colors.muted }}>Add murmura from the products page.</Text>
          <Button title="Browse products" icon="leaf-outline" onPress={() => router.push('/account')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionTitle right={<Text style={{ color: colors.muted }}>{lines.length} item{lines.length > 1 ? 's' : ''}</Text>}>Your cart</SectionTitle>
      <View style={styles.listCard}>
        {lines.map(({ p, q, amount }) => (
          <View key={p.id} style={[styles.row, { gap: 12, flexWrap: 'wrap' }]}>
            <IconTile name="leaf-outline" size={44} />
            <View style={{ flex: 1, minWidth: 140 }}>
              <Text style={styles.rowTitle}>{p.name}</Text>
              <Text style={styles.rowSub}>
                {money(p.price)} / {p.unit}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <QtyButton icon="remove" onPress={() => cart.setQty(p.id, q - 1)} />
              <TextInput
                value={String(qty(q))}
                onChangeText={(v) => cart.setQty(p.id, parseFloat(v.replace(/[^0-9.]/g, '')) || 0)}
                keyboardType="decimal-pad"
                style={[styles.input, { width: 64, textAlign: 'center', paddingVertical: 8, fontWeight: '700' }]}
              />
              <QtyButton icon="add" onPress={() => cart.setQty(p.id, q + 1)} />
            </View>
            <Text style={{ width: 96, textAlign: 'right', fontWeight: '800', color: colors.text }}>{money(amount)}</Text>
            <Pressable onPress={() => cart.remove(p.id)} hitSlop={8} accessibilityLabel={`Remove ${p.name}`}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        ))}
      </View>

      <SectionTitle>Delivery</SectionTitle>
      <FieldRow>
        <Field label="Deliver by (optional)" value={deliveryDate} onChangeText={setDeliveryDate} placeholder="YYYY-MM-DD" />
      </FieldRow>
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Delivery address, timing, packing…" />

      <Card>
        <KeyValue label="Subtotal" value={money(subtotal)} />
        {tax > 0 && <KeyValue label="GST (approx.)" value={money(tax)} />}
        <KeyValue label="Estimated total" value={money(subtotal + tax)} bold />
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>Prices are today’s rates. The final amount is on your bill.</Text>
      </Card>
      <Button title="Place order" icon="checkmark-circle-outline" onPress={place} loading={saving} />
      <Button title="Continue shopping" variant="secondary" icon="arrow-back" onPress={() => router.push('/account')} />
    </Screen>
  );
}

function QtyButton({ icon, onPress }: { icon: 'add' | 'remove'; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
    </Pressable>
  );
}
