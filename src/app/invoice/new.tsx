import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { CustomerSelect } from '@/components/CustomerSelect';
import { LineItemsEditor } from '@/components/LineItemsEditor';
import { Button, Card, colors, Empty, Field, FieldRow, KeyValue, Screen, SectionTitle, Segmented } from '@/components/ui';
import { notify } from '@/lib/dialog';
import { computeTotals, money, today } from '@/lib/format';
import { isValidDate, loadLookups } from '@/lib/lookups';
import { supabase } from '@/lib/supabase';
import type { Customer, LineItem, Order, OrderItem, TaxMode } from '@/lib/types';
import { must, useData } from '@/lib/useData';

const sameState = (a: string, b: string) => !a.trim() || !b.trim() || a.trim().toLowerCase() === b.trim().toLowerCase();

async function loadForm(orderId?: string) {
  const lookups = await loadLookups();
  let order: { order: Order; items: OrderItem[] } | null = null;
  if (orderId) {
    const [o, items] = await Promise.all([
      supabase.from('orders').select('*').eq('id', orderId).single(),
      supabase.from('order_items').select('*').eq('order_id', orderId),
    ]);
    order = { order: must(o) as Order, items: must(items) as OrderItem[] };
  }
  return { ...lookups, order };
}

export default function NewInvoice() {
  const { orderId, customerId } = useLocalSearchParams<{ orderId?: string; customerId?: string }>();
  const { data, loading, error } = useData(() => loadForm(orderId), [orderId]);
  if (!data) return <Empty text="" loading={loading} error={error} />;
  return <InvoiceForm data={data} orderId={orderId} customerId={customerId} />;
}

function InvoiceForm({
  data,
  orderId,
  customerId,
}: {
  data: Awaited<ReturnType<typeof loadForm>>;
  orderId?: string;
  customerId?: string;
}) {
  const router = useRouter();
  // Prefill from the order, or from the customer page the user came from.
  const initialCustomer = data.customers.find((x) => x.id === (data.order?.order.customer_id ?? customerId)) ?? null;
  const [taxMode, setTaxMode] = useState<TaxMode>('gst');
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [interState, setInterState] = useState(() => !!initialCustomer && !sameState(initialCustomer.state, data.settings.state));
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>(() =>
    (data.order?.items ?? []).map(({ product_id, description, hsn, unit, qty, rate, gst_rate }) => ({
      product_id,
      description,
      hsn,
      unit,
      qty: Number(qty),
      rate: Number(rate),
      gst_rate: Number(gst_rate),
    })),
  );
  const [saving, setSaving] = useState(false);

  const pickCustomer = (c: Customer) => {
    setCustomer(c);
    setInterState(!sameState(c.state, data.settings.state));
  };

  const t = computeTotals(items, taxMode, interState);

  const save = async () => {
    if (!customer) return notify('Choose a customer');
    if (!items.length) return notify('Add at least one item');
    if (items.some((it) => !it.description.trim() || it.qty <= 0)) return notify('Every item needs a description and quantity');
    if (!isValidDate(invoiceDate)) return notify('Invoice date must be YYYY-MM-DD');
    if (dueDate && !isValidDate(dueDate)) return notify('Due date must be YYYY-MM-DD');
    setSaving(true);
    const { data: inv, error } = await supabase.rpc('create_invoice', {
      p: {
        tax_mode: taxMode,
        inter_state: interState,
        customer_id: customer.id,
        order_id: orderId ?? '',
        invoice_date: invoiceDate,
        due_date: dueDate,
        notes,
        items,
      },
    });
    setSaving(false);
    if (error) return notify('Could not save invoice', error.message);
    router.replace({ pathname: '/invoice/[id]', params: { id: inv.id } });
  };

  return (
    <Screen>
      <SectionTitle>Invoice type</SectionTitle>
      <Segmented
        value={taxMode}
        onChange={setTaxMode}
        options={[
          { value: 'gst', label: 'GST tax invoice' },
          { value: 'none', label: 'Bill (no tax)' },
        ]}
      />
      {taxMode === 'gst' && (
        <Segmented
          value={interState ? 'inter' : 'intra'}
          onChange={(v) => setInterState(v === 'inter')}
          options={[
            { value: 'intra', label: 'Same state (CGST+SGST)' },
            { value: 'inter', label: 'Other state (IGST)' },
          ]}
        />
      )}

      <CustomerSelect customers={data.customers} value={customer} onChange={pickCustomer} />
      <FieldRow>
        <Field label="Invoice date" value={invoiceDate} onChangeText={setInvoiceDate} placeholder="YYYY-MM-DD" />
        <Field label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" />
      </FieldRow>
      {!!data.order && <Text style={{ color: colors.muted, marginBottom: 12 }}>From order {data.order.order.order_no}</Text>}

      <LineItemsEditor items={items} onChange={setItems} products={data.products} taxMode={taxMode} />
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Vehicle no., e-way bill, remarks" />

      <Card>
        <KeyValue label="Subtotal" value={money(t.subtotal)} />
        {taxMode === 'gst' && !interState && (
          <>
            <KeyValue label="CGST" value={money(t.cgst)} />
            <KeyValue label="SGST" value={money(t.sgst)} />
          </>
        )}
        {taxMode === 'gst' && interState && <KeyValue label="IGST" value={money(t.igst)} />}
        {t.roundOff !== 0 && <KeyValue label="Round off" value={money(t.roundOff)} />}
        <KeyValue label="Total" value={money(t.total)} bold />
      </Card>
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10 }}>
        Saving reduces stock for the products on this invoice. Number: {taxMode === 'gst' ? 'INV-xxxx' : 'BILL-xxxx'}.
      </Text>
      <Button title="Save invoice" icon="checkmark" onPress={save} loading={saving} />
    </Screen>
  );
}
