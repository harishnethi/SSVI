import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { CustomerSelect } from '@/components/CustomerSelect';
import { LineItemsEditor } from '@/components/LineItemsEditor';
import { Button, Card, Empty, Field, FieldRow, KeyValue, Screen } from '@/components/ui';
import { notify } from '@/lib/dialog';
import { money, round2, today } from '@/lib/format';
import { isValidDate, loadLookups } from '@/lib/lookups';
import { supabase } from '@/lib/supabase';
import type { Customer, LineItem } from '@/lib/types';
import { useData } from '@/lib/useData';

export default function NewOrder() {
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const { data, loading, error } = useData(loadLookups);
  if (!data) return <Empty text="" loading={loading} error={error} />;
  return <OrderForm data={data} customerId={customerId} />;
}

function OrderForm({ data, customerId }: { data: Awaited<ReturnType<typeof loadLookups>>; customerId?: string }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(() => data.customers.find((c) => c.id === customerId) ?? null);
  const [orderDate, setOrderDate] = useState(today());
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);

  const total = round2(items.reduce((s, it) => s + round2(it.qty * it.rate), 0));

  const save = async () => {
    if (!customer) return notify('Choose a customer');
    if (!items.length) return notify('Add at least one item');
    if (items.some((it) => !it.description.trim() || it.qty <= 0)) return notify('Every item needs a description and quantity');
    if (!isValidDate(orderDate)) return notify('Order date must be YYYY-MM-DD');
    if (deliveryDate && !isValidDate(deliveryDate)) return notify('Delivery date must be YYYY-MM-DD');
    setSaving(true);
    const { data: order, error } = await supabase.rpc('create_order', {
      p: { customer_id: customer.id, order_date: orderDate, delivery_date: deliveryDate, notes, items },
    });
    setSaving(false);
    if (error) return notify('Could not save order', error.message);
    router.replace({ pathname: '/order/[id]', params: { id: order.id } });
  };

  return (
    <Screen>
      <CustomerSelect customers={data.customers} value={customer} onChange={setCustomer} />
      <FieldRow>
        <Field label="Order date" value={orderDate} onChangeText={setOrderDate} placeholder="YYYY-MM-DD" />
        <Field label="Deliver by" value={deliveryDate} onChangeText={setDeliveryDate} placeholder="YYYY-MM-DD" />
      </FieldRow>
      <LineItemsEditor items={items} onChange={setItems} products={data.products} taxMode="gst" />
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Packing, transport, special instructions" />
      <Card>
        <KeyValue label="Order value (before tax)" value={money(total)} bold />
      </Card>
      <Button title="Save order" icon="checkmark" onPress={save} loading={saving} />
    </Screen>
  );
}
