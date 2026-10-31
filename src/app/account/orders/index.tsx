import { useRouter } from 'expo-router';
import { FlatList } from 'react-native';
import { Badge, colors, Empty, ListRow } from '@/components/ui';
import { date, money } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { statusTone, type Order } from '@/lib/types';
import { must, useData } from '@/lib/useData';

export default function MyOrders() {
  const router = useRouter();
  const { data, loading, error, reload } = useData(
    async () => must(await supabase.from('orders').select('*').order('created_at', { ascending: false })) as Order[],
  );
  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingVertical: 8 }}
      data={data ?? []}
      keyExtractor={(o) => o.id}
      refreshing={loading}
      onRefresh={reload}
      renderItem={({ item: o }) => (
        <ListRow
          title={o.order_no}
          subtitle={`${date(o.order_date)}${o.delivery_date ? ' · deliver by ' + date(o.delivery_date) : ''}`}
          right={money(o.total)}
          badge={<Badge label={o.status} tone={statusTone[o.status]} />}
          onPress={() => router.push(`/account/orders/${o.id}`)}
        />
      )}
      ListEmptyComponent={<Empty text="No orders yet. Add products to your cart to place one." loading={loading && !data} error={error} />}
    />
  );
}
