import { UPCOMING_SELECT, UPCOMING_STATUSES, UpcomingOrders, type OrderWithItems } from '@/components/UpcomingOrders';
import { Empty, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { must, useData } from '@/lib/useData';

export default function WorkerOrders() {
  const { data, loading, error, reload } = useData(
    async () =>
      must(
        await supabase
          .from('orders')
          .select(UPCOMING_SELECT)
          .in('status', UPCOMING_STATUSES)
          .order('delivery_date', { ascending: true, nullsFirst: false }),
      ) as OrderWithItems[],
  );
  if (!data) return <Empty text="" loading={loading} error={error} />;
  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <UpcomingOrders orders={data} empty="No orders waiting." />
    </Screen>
  );
}
