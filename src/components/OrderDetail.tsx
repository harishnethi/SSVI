import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { OrderTracker } from '@/components/OrderTracker';
import { Badge, Button, Card, colors, Empty, KeyValue, SectionTitle, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { billHref } from '@/lib/paths';
import { confirm, notify } from '@/lib/dialog';
import { date, money, qty, round2 } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { ORDER_STATUSES, statusTone, type Customer, type Order, type OrderItem, type OrderStatus } from '@/lib/types';
import { must, useData } from '@/lib/useData';

export function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { role } = useAuth();
  const admin = role === 'admin';
  const showMoney = role !== 'worker';
  const { data, loading, error, reload } = useData(async () => {
    const [o, items] = await Promise.all([
      supabase.from('orders').select('*, customers(*)').eq('id', id).single(),
      supabase.from('order_items').select('*').eq('order_id', id),
    ]);
    return { order: must(o) as Order & { customers: Customer }, items: must(items) as OrderItem[] };
  }, [id]);

  if (!data) return <Empty text="" loading={loading} error={error} />;
  const { order: o, items } = data;

  const setStatus = async (status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', o.id);
    if (error) return notify('Could not update', error.message);
    reload();
  };

  const remove = async () => {
    if (!(await confirm('Delete order?', `${o.order_no} will be removed.`, 'Delete'))) return;
    const { error } = await supabase.from('orders').delete().eq('id', o.id);
    if (error) return notify('Could not delete', error.message);
    router.back();
  };

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Stack.Screen options={{ title: o.order_no }} />
      <OrderTracker status={o.status} />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{o.order_no}</Text>
          <Badge label={o.status} tone={statusTone[o.status]} />
        </View>
        {o.placed_by_customer && <Text style={{ color: colors.primary, fontWeight: '600', marginTop: 4 }}>Placed on the website</Text>}
        <Text
          style={{ fontSize: 16, color: admin ? colors.primary : colors.text, fontWeight: '600', marginTop: 6 }}
          onPress={admin ? () => router.push({ pathname: '/customer/[id]', params: { id: o.customer_id } }) : undefined}
        >
          {o.customers.name}
        </Text>
        <KeyValue label="Order date" value={date(o.order_date)} />
        {!!o.delivery_date && <KeyValue label="Deliver by" value={date(o.delivery_date)} />}
        {!!o.notes && <Text style={{ color: colors.muted, marginTop: 6 }}>{o.notes}</Text>}
      </Card>

      <SectionTitle>Items</SectionTitle>
      <Card>
        {items.map((it) => (
          <View key={it.id} style={{ flexDirection: 'row', paddingVertical: 6 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{it.description}</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                {qty(it.qty)} {it.unit}
                {showMoney ? ` × ${money(it.rate)} · GST ${Number(it.gst_rate)}%` : ''}
              </Text>
            </View>
            {showMoney && <Text style={{ fontWeight: '600', color: colors.text }}>{money(round2(it.qty * it.rate))}</Text>}
          </View>
        ))}
        {showMoney && (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6, paddingTop: 6 }}>
            <KeyValue label="Total (before tax)" value={money(o.total)} bold />
          </View>
        )}
      </Card>

      {o.invoice_id
        ? showMoney && (
            <Button title="View invoice" icon="receipt-outline" onPress={() => router.push(billHref(role, o.invoice_id!))} />
          )
        : admin &&
          o.status !== 'cancelled' && (
            <Button title="Create invoice from order" icon="receipt-outline" onPress={() => router.push({ pathname: '/invoice/new', params: { orderId: o.id } })} />
          )}

      {!admin && role === 'customer' && o.status === 'pending' && (
        <Text style={{ color: colors.muted, marginBottom: 12 }}>We have received your order and will confirm it soon.</Text>
      )}
      {admin && <SectionTitle>Status</SectionTitle>}
      {admin && (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {ORDER_STATUSES.map((s) => (
          <Pressable
            key={s}
            onPress={() => setStatus(s)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 20,
              backgroundColor: o.status === s ? colors.primary : colors.primaryLight,
            }}
          >
            <Text style={{ color: o.status === s ? colors.onPrimary : colors.primary, fontWeight: '600', textTransform: 'capitalize' }}>{s}</Text>
          </Pressable>
        ))}
      </View>
      )}

      {admin && !o.invoice_id && <Button title="Delete order" variant="danger" icon="trash-outline" onPress={remove} />}
    </Screen>
  );
}
