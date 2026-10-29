import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, colors, Empty, ListRow, SectionTitle, Screen, styles } from '@/components/ui';
import { money, qty, today } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Invoice, Order, Product } from '@/lib/types';
import { must, useData } from '@/lib/useData';

export default function Dashboard() {
  const router = useRouter();
  const { data, loading, error, reload } = useData(async () => {
    const [invoices, orders, products] = await Promise.all([
      supabase.from('invoices').select('id, total, paid, invoice_date').eq('cancelled', false),
      supabase
        .from('orders')
        .select('*, customers(name)')
        .in('status', ['pending', 'confirmed'])
        .order('delivery_date', { ascending: true, nullsFirst: false })
        .limit(5),
      supabase.from('products').select('*').order('name'),
    ]);
    return {
      invoices: must(invoices) as Pick<Invoice, 'id' | 'total' | 'paid' | 'invoice_date'>[],
      orders: must(orders) as Order[],
      products: must(products) as Product[],
    };
  });

  const month = today().slice(0, 7);
  const monthSales = data?.invoices.filter((i) => i.invoice_date.startsWith(month)).reduce((s, i) => s + Number(i.total), 0) ?? 0;
  const todaySales = data?.invoices.filter((i) => i.invoice_date === today()).reduce((s, i) => s + Number(i.total), 0) ?? 0;
  const outstanding = data?.invoices.reduce((s, i) => s + Math.max(0, Number(i.total) - Number(i.paid)), 0) ?? 0;
  const lowStock = data?.products.filter((p) => Number(p.stock) <= Number(p.low_stock)) ?? [];

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/settings')} hitSlop={10} style={{ marginRight: 16 }}>
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </Pressable>
          ),
        }}
      />
      {!!error && <Empty text="" error={error} />}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat label="Today's sales" value={money(todaySales)} />
        <Stat label="This month" value={money(monthSales)} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat label="To collect" value={money(outstanding)} tone={outstanding > 0 ? colors.warning : undefined} />
        <Stat label="Low stock items" value={String(lowStock.length)} tone={lowStock.length ? colors.danger : undefined} />
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <Button title="New invoice" icon="receipt-outline" onPress={() => router.push('/invoice/new')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="New order" icon="clipboard-outline" variant="secondary" onPress={() => router.push('/order/new')} />
        </View>
      </View>

      <SectionTitle>Open orders</SectionTitle>
      <View style={styles.listCard}>
        {data?.orders.length ? (
          data.orders.map((o) => (
            <ListRow
              key={o.id}
              title={o.customers?.name ?? ''}
              subtitle={`${o.order_no}${o.delivery_date ? ' · deliver by ' + o.delivery_date.split('-').reverse().join('/') : ''}`}
              right={money(o.total)}
              badge={<Badge label={o.status} tone={o.status === 'pending' ? 'warning' : 'info'} />}
              onPress={() => router.push({ pathname: '/order/[id]', params: { id: o.id } })}
            />
          ))
        ) : (
          <Card style={{ marginBottom: 0, borderWidth: 0 }}>
            <Text style={{ color: colors.muted }}>{loading ? 'Loading…' : 'No open orders.'}</Text>
          </Card>
        )}
      </View>

      {lowStock.length > 0 && (
        <>
          <SectionTitle>Low stock</SectionTitle>
          <View style={styles.listCard}>
            {lowStock.slice(0, 8).map((p) => (
              <ListRow
                key={p.id}
                title={p.name}
                subtitle={`Reorder level ${qty(p.low_stock)} ${p.unit}`}
                right={`${qty(p.stock)} ${p.unit}`}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card style={{ flex: 1, marginBottom: 10 }}>
      <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: tone ?? colors.text, fontSize: 20, fontWeight: '800', marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </Card>
  );
}
