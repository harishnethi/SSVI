import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, colors, Empty, Field, KeyValue, ListRow, SectionTitle, Screen, Segmented, styles } from '@/components/ui';
import { date, money, qty } from '@/lib/format';
import { notify } from '@/lib/dialog';
import { supabase } from '@/lib/supabase';
import type { Product, StockMovement } from '@/lib/types';
import { must, useData } from '@/lib/useData';

type Direction = 'purchase' | 'production' | 'out';

const reasonLabel: Record<StockMovement['reason'], string> = {
  purchase: 'Purchased',
  production: 'Produced',
  sale: 'Sold',
  adjustment: 'Adjustment',
  return: 'Returned',
};

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [direction, setDirection] = useState<Direction>('purchase');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useData(async () => {
    const [p, m] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('stock_movements').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(50),
    ]);
    return { product: must(p) as Product, moves: must(m) as StockMovement[] };
  }, [id]);

  if (!data) return <Empty text="" loading={loading} error={error} />;
  const { product: p, moves } = data;

  const record = async () => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return notify('Enter a quantity greater than 0');
    setSaving(true);
    const { error } = await supabase.from('stock_movements').insert({
      product_id: p.id,
      qty: direction === 'out' ? -n : n,
      reason: direction === 'out' ? 'adjustment' : direction,
      note: note.trim(),
    });
    setSaving(false);
    if (error) return notify('Could not save', error.message);
    setAmount('');
    setNote('');
    reload();
  };

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Stack.Screen options={{ title: p.name }} />
      <Card>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{p.name}</Text>
        <Text style={{ fontSize: 32, fontWeight: '800', color: Number(p.stock) <= Number(p.low_stock) ? colors.danger : colors.primary, marginVertical: 8 }}>
          {qty(p.stock)} <Text style={{ fontSize: 18 }}>{p.unit}</Text>
        </Text>
        <KeyValue label="Price" value={`${money(p.price)} / ${p.unit}`} />
        <KeyValue label="GST" value={`${Number(p.gst_rate)}%`} />
        {!!p.sku && <KeyValue label="SKU" value={p.sku} />}
        {!!p.hsn && <KeyValue label="HSN" value={p.hsn} />}
        <KeyValue label="Low stock alert at" value={`${qty(p.low_stock)} ${p.unit}`} />
        <KeyValue label="Stock value" value={money(Number(p.stock) * Number(p.price))} />
      </Card>
      <Button title="Edit product" icon="create-outline" variant="secondary" onPress={() => router.push({ pathname: '/product/edit', params: { id: p.id } })} />

      <SectionTitle>Stock in / out</SectionTitle>
      <Card>
        <Segmented
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'purchase', label: 'Purchased' },
            { value: 'production', label: 'Produced' },
            { value: 'out', label: 'Remove' },
          ]}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Field label={`Quantity (${p.unit})`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          <Field label="Note" value={note} onChangeText={setNote} placeholder={direction === 'out' ? 'Damaged, sample…' : 'Supplier, bill no…'} />
        </View>
        <Button title={direction === 'out' ? 'Remove stock' : 'Add stock'} onPress={record} loading={saving} />
        <Text style={{ color: colors.muted, fontSize: 13 }}>Sales reduce stock automatically when you create an invoice.</Text>
      </Card>

      <SectionTitle>History</SectionTitle>
      <View style={styles.listCard}>
        {moves.length ? (
          moves.map((m) => (
            <ListRow
              key={m.id}
              title={reasonLabel[m.reason]}
              subtitle={[date(m.created_at), m.note].filter(Boolean).join(' · ')}
              right={`${Number(m.qty) > 0 ? '+' : ''}${qty(m.qty)}`}
            />
          ))
        ) : (
          <Text style={{ padding: 14, color: colors.muted, backgroundColor: '#fff' }}>No stock changes yet</Text>
        )}
      </View>
    </Screen>
  );
}
