import { Linking, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { InvoiceBadge } from '@/components/InvoiceBadge';
import { Badge, Button, Card, colors, Empty, KeyValue, ListRow, SectionTitle, Screen, styles } from '@/components/ui';
import { date, money } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Customer, Invoice, Order } from '@/lib/types';
import { must, useData } from '@/lib/useData';

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, error, reload } = useData(async () => {
    const [c, inv, ord] = await Promise.all([
      supabase.from('customers').select('*').eq('id', id).single(),
      supabase.from('invoices').select('*').eq('customer_id', id).order('invoice_date', { ascending: false }),
      supabase.from('orders').select('*').eq('customer_id', id).order('order_date', { ascending: false }),
    ]);
    return { customer: must(c) as Customer, invoices: must(inv) as Invoice[], orders: must(ord) as Order[] };
  }, [id]);

  if (!data) return <Empty text="" loading={loading} error={error} />;
  const { customer: c, invoices, orders } = data;
  const active = invoices.filter((i) => !i.cancelled);
  const billed = active.reduce((s, i) => s + Number(i.total), 0);
  const due = active.reduce((s, i) => s + Math.max(0, Number(i.total) - Number(i.paid)), 0);

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Stack.Screen options={{ title: c.name }} />
      <Card>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{c.name}</Text>
        {!!c.gstin && <Text style={{ color: colors.muted, marginTop: 2 }}>GSTIN {c.gstin}</Text>}
        {!!c.address && <Text style={{ color: colors.text, marginTop: 8 }}>{c.address}</Text>}
        {!!c.state && <Text style={{ color: colors.muted }}>{c.state}</Text>}
        {!!c.phone && (
          <Text style={{ color: colors.primary, marginTop: 8, fontWeight: '600' }} onPress={() => Linking.openURL(`tel:${c.phone}`)}>
            {c.phone}
          </Text>
        )}
        {!!c.email && <Text style={{ color: colors.muted }}>{c.email}</Text>}
        {!!c.notes && <Text style={{ color: colors.muted, marginTop: 8, fontStyle: 'italic' }}>{c.notes}</Text>}
      </Card>

      <Card>
        <KeyValue label="Total billed" value={money(billed)} />
        <KeyValue label="Balance due" value={money(due)} bold />
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button title="Invoice" icon="receipt-outline" onPress={() => router.push({ pathname: '/invoice/new', params: { customerId: c.id } })} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Order" icon="clipboard-outline" variant="secondary" onPress={() => router.push({ pathname: '/order/new', params: { customerId: c.id } })} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Edit" icon="create-outline" variant="secondary" onPress={() => router.push({ pathname: '/customer/edit', params: { id: c.id } })} />
        </View>
      </View>

      <SectionTitle>Invoices</SectionTitle>
      <View style={styles.listCard}>
        {invoices.length ? (
          invoices.map((i) => (
            <ListRow
              key={i.id}
              title={i.invoice_no}
              subtitle={date(i.invoice_date)}
              right={money(i.total)}
              badge={<InvoiceBadge invoice={i} />}
              onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: i.id } })}
            />
          ))
        ) : (
          <Text style={{ padding: 14, color: colors.muted, backgroundColor: '#fff' }}>No invoices yet</Text>
        )}
      </View>

      <SectionTitle>Orders</SectionTitle>
      <View style={styles.listCard}>
        {orders.length ? (
          orders.map((o) => (
            <ListRow
              key={o.id}
              title={o.order_no}
              subtitle={date(o.order_date)}
              right={money(o.total)}
              badge={<Badge label={o.status} />}
              onPress={() => router.push({ pathname: '/order/[id]', params: { id: o.id } })}
            />
          ))
        ) : (
          <Text style={{ padding: 14, color: colors.muted, backgroundColor: '#fff' }}>No orders yet</Text>
        )}
      </View>
    </Screen>
  );
}
