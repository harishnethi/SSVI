import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { H } from '@/components/Heading';
import { Badge, Card, colors, Empty, BrandGradient, IconTile, ListRow, SectionTitle, Screen, styles } from '@/components/ui';
import { money, qty, today } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Invoice, Order, Product } from '@/lib/types';
import { must, useData } from '@/lib/useData';

export default function Dashboard() {
  const router = useRouter();
  const { data, loading, error, reload } = useData(async () => {
    const [invoices, orders, products, web, att, workers] = await Promise.all([
      supabase.from('invoices').select('id, total, paid, invoice_date').eq('cancelled', false),
      supabase
        .from('orders')
        .select('*, customers(name)')
        .in('status', ['pending', 'confirmed'])
        .order('delivery_date', { ascending: true, nullsFirst: false })
        .limit(5),
      supabase.from('products').select('*').order('name'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('placed_by_customer', true).eq('status', 'pending'),
      supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('work_date', today()).in('status', ['present', 'half_day']),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'worker').eq('active', true),
    ]);
    if (web.error) throw new Error(web.error.message);
    return {
      invoices: must(invoices) as Pick<Invoice, 'id' | 'total' | 'paid' | 'invoice_date'>[],
      orders: must(orders) as Order[],
      products: must(products) as Product[],
      webOrders: web.count ?? 0,
      present: att.count ?? 0,
      workers: workers.count ?? 0,
    };
  });

  const month = today().slice(0, 7);
  const monthSales = data?.invoices.filter((i) => i.invoice_date.startsWith(month)).reduce((s, i) => s + Number(i.total), 0) ?? 0;
  const todaySales = data?.invoices.filter((i) => i.invoice_date === today()).reduce((s, i) => s + Number(i.total), 0) ?? 0;
  const outstanding = data?.invoices.reduce((s, i) => s + Math.max(0, Number(i.total) - Number(i.paid)), 0) ?? 0;
  const lowStock = data?.products.filter((p) => Number(p.stock) <= Number(p.low_stock)) ?? [];

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      {!!error && <Empty text="" error={error} />}

      <BrandGradient tone="soft" style={[styles.card, { padding: 22, borderColor: colors.border }]}>
        <H style={{ fontSize: 32, fontWeight: '700', color: colors.primary }}>{greeting()}</H>
        <Text style={{ fontSize: 15, color: colors.text, opacity: 0.7, marginTop: 2 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 28, marginTop: 20 }}>
          <View>
            <Text style={{ fontSize: 14, color: colors.text, opacity: 0.75 }}>Sales this month</Text>
            <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text }}>{money(monthSales)}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 14, color: colors.text, opacity: 0.75 }}>Today</Text>
            <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text }}>{money(todaySales)}</Text>
          </View>
        </View>
      </BrandGradient>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat icon="wallet-outline" label="To collect" value={money(outstanding)} note={outstanding > 0 ? 'unpaid invoices' : 'all paid'} />
        <Stat
          icon="cube-outline"
          label="Low stock"
          value={String(lowStock.length)}
          note={lowStock.length ? 'items to restock' : 'stock is fine'}
          alert={lowStock.length > 0}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat
          icon="globe-outline"
          label="Website orders"
          value={String(data?.webOrders ?? 0)}
          note={data?.webOrders ? 'waiting to confirm' : 'none waiting'}
          alert={!!data?.webOrders}
        />
        <Stat icon="people-outline" label="Workers today" value={`${data?.present ?? 0} / ${data?.workers ?? 0}`} note="present" />
      </View>

      <SectionTitle>Quick actions</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <Action icon="receipt-outline" label="New invoice" onPress={() => router.push('/invoice/new')} />
        <Action icon="clipboard-outline" label="New order" onPress={() => router.push('/order/new')} />
        <Action icon="person-add-outline" label="Add customer" onPress={() => router.push('/customer/edit')} />
        <Action icon="add-circle-outline" label="Add product" onPress={() => router.push('/product/edit')} />
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

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

type IconName = ComponentProps<typeof Ionicons>['name'];

function Stat({ icon, label, value, note, alert }: { icon: IconName; label: string; value: string; note: string; alert?: boolean }) {
  return (
    <View style={[styles.card, { flex: 1, padding: 0, overflow: 'hidden' }]}>
      <BrandGradient style={{ height: 4 }} />
      <View style={{ padding: 16 }}>
        <IconTile name={icon} />
        <Text style={{ color: colors.muted, fontSize: 14, marginTop: 12 }}>{label}</Text>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={{ color: alert ? colors.danger : colors.primary, fontSize: 13, fontWeight: '600', marginTop: 4 }}>{note}</Text>
      </View>
    </View>
  );
}

function Action({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { flexBasis: '46%', flexGrow: 1, marginBottom: 0, alignItems: 'center', opacity: pressed ? 0.85 : 1 }]}
    >
      <IconTile name={icon} size={48} />
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 10 }}>{label}</Text>
    </Pressable>
  );
}
