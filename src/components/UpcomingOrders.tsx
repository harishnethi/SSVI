import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge, colors, ListRow, styles } from './ui';
import { date, qty } from '@/lib/format';
import { statusTone, type Order, type OrderItem } from '@/lib/types';

export type OrderWithItems = Order & { order_items: Pick<OrderItem, 'description' | 'qty' | 'unit'>[] };

/** Orders still to make or deliver, showing quantities but no prices. */
export function UpcomingOrders({ orders, empty }: { orders: OrderWithItems[]; empty: string }) {
  const router = useRouter();
  if (!orders.length) {
    return (
      <View style={styles.listCard}>
        <Text style={{ padding: 16, color: colors.muted }}>{empty}</Text>
      </View>
    );
  }
  return (
    <View style={styles.listCard}>
      {orders.map((o) => (
        <ListRow
          key={o.id}
          title={o.customers?.name ?? o.order_no}
          subtitle={[
            o.order_items.map((it) => `${qty(it.qty)} ${it.unit} ${it.description}`).join(', '),
            o.delivery_date ? `deliver by ${date(o.delivery_date)}` : `ordered ${date(o.order_date)}`,
          ]
            .filter(Boolean)
            .join(' · ')}
          badge={<Badge label={o.status} tone={statusTone[o.status]} />}
          onPress={() => router.push({ pathname: '/order/[id]', params: { id: o.id } })}
        />
      ))}
    </View>
  );
}

export const UPCOMING_SELECT = '*, customers(name), order_items(description, qty, unit)';
export const UPCOMING_STATUSES = ['pending', 'confirmed', 'dispatched'];
