import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Badge, Button, colors, Empty, ListRow, SearchBar, Segmented } from '@/components/ui';
import { date, money } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { statusTone, type Order } from '@/lib/types';
import { must, useData } from '@/lib/useData';

export default function Orders() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const { data, loading, error, reload } = useData(
    async () =>
      must(await supabase.from('orders').select('*, customers(name)').order('created_at', { ascending: false }).limit(500)) as Order[],
  );

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter(
      (o) =>
        (filter === 'all' || ['pending', 'confirmed', 'dispatched'].includes(o.status)) &&
        (!s || `${o.order_no} ${o.customers?.name ?? ''}`.toLowerCase().includes(s)),
    );
  }, [data, q, filter]);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      data={list}
      keyExtractor={(o) => o.id}
      refreshing={loading}
      onRefresh={reload}
      ListHeaderComponent={
        <View style={{ padding: 16, paddingBottom: 4 }}>
          <Button title="New order" icon="add" onPress={() => router.push('/order/new')} />
          <SearchBar value={q} onChangeText={setQ} placeholder="Search order no. or customer" />
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'all', label: 'All' },
            ]}
          />
        </View>
      }
      renderItem={({ item: o }) => (
        <ListRow
          title={o.customers?.name ?? ''}
          subtitle={`${o.order_no} · ${date(o.order_date)}${o.delivery_date ? ' · due ' + date(o.delivery_date) : ''}`}
          right={money(o.total)}
          badge={
            <>
              <Badge label={o.status} tone={statusTone[o.status]} />
              {o.placed_by_customer && <Badge label="Website" tone="success" />}
            </>
          }
          onPress={() => router.push({ pathname: '/order/[id]', params: { id: o.id } })}
        />
      )}
      ListEmptyComponent={<Empty text="No orders" loading={loading && !data} error={error} />}
    />
  );
}
