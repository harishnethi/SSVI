import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { InvoiceBadge } from '@/components/InvoiceBadge';
import { Button, Card, colors, Empty, Field, KeyValue, ListRow, SectionTitle, Screen, Segmented, styles } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { orderHref } from '@/lib/paths';
import { billMessage, openWhatsApp, waNumber } from '@/lib/whatsapp';
import { confirm, notify } from '@/lib/dialog';
import { date, money, qty, round2, today } from '@/lib/format';
import { invoiceHtml } from '@/lib/invoiceHtml';
import { PRINT_ACCENT } from '@/lib/palettes';
import { isValidDate } from '@/lib/lookups';
import { supabase } from '@/lib/supabase';
import type { Customer, Invoice, InvoiceItem, Payment, Settings } from '@/lib/types';
import { must, useData } from '@/lib/useData';

type Method = 'cash' | 'upi' | 'bank' | 'cheque';

export function InvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { role } = useAuth();
  const admin = role === 'admin';
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(today());
  const [method, setMethod] = useState<Method>('cash');
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const { data, loading, error, reload } = useData(async () => {
    const [inv, items, pays, s] = await Promise.all([
      supabase.from('invoices').select('*, customers(*)').eq('id', id).single(),
      supabase.from('invoice_items').select('*').eq('invoice_id', id),
      supabase.from('payments').select('*').eq('invoice_id', id).order('paid_on'),
      supabase.from('settings').select('*').eq('id', 1).single(),
    ]);
    return {
      invoice: must(inv) as Invoice & { customers: Customer },
      items: must(items) as InvoiceItem[],
      payments: must(pays) as Payment[],
      settings: must(s) as Settings,
    };
  }, [id]);

  if (!data) return <Empty text="" loading={loading} error={error} />;
  const { invoice: inv, items, payments, settings } = data;
  const balance = round2(Number(inv.total) - Number(inv.paid));
  const gst = inv.tax_mode === 'gst';

  const addPayment = async () => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return notify('Enter the amount received');
    if (!isValidDate(paidOn)) return notify('Date must be YYYY-MM-DD');
    setSaving(true);
    const { error } = await supabase.from('payments').insert({ invoice_id: inv.id, amount: n, paid_on: paidOn, method });
    setSaving(false);
    if (error) return notify('Could not save payment', error.message);
    setAmount('');
    reload();
  };

  const deletePayment = async (p: Payment) => {
    if (!(await confirm('Delete payment?', `${money(p.amount)} on ${date(p.paid_on)}`, 'Delete'))) return;
    const { error } = await supabase.from('payments').delete().eq('id', p.id);
    if (error) return notify('Could not delete', error.message);
    reload();
  };

  const share = async () => {
    const html = invoiceHtml(inv, items, inv.customers, settings, PRINT_ACCENT);
    setSharing(true);
    try {
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: inv.invoice_no, UTI: 'com.adobe.pdf' });
      }
    } catch (e) {
      notify('Could not create PDF', e instanceof Error ? e.message : String(e));
    } finally {
      setSharing(false);
    }
  };

  const cancel = async () => {
    if (!(await confirm('Cancel invoice?', 'The invoice stays on record marked CANCELLED and its stock is added back.', 'Cancel invoice'))) return;
    const { error } = await supabase.rpc('cancel_invoice', { invoice: inv.id });
    if (error) return notify('Could not cancel', error.message);
    reload();
  };

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Stack.Screen options={{ title: inv.invoice_no }} />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{inv.invoice_no}</Text>
          <InvoiceBadge invoice={inv} />
        </View>
        <Text style={{ color: colors.muted, marginTop: 2 }}>
          {gst ? `GST tax invoice · ${inv.inter_state ? 'IGST' : 'CGST + SGST'}` : 'Bill without tax'}
        </Text>
        <Text
          style={{ fontSize: 16, color: admin ? colors.primary : colors.text, fontWeight: '600', marginTop: 8 }}
          onPress={admin ? () => router.push({ pathname: '/customer/[id]', params: { id: inv.customer_id } }) : undefined}
        >
          {inv.customers.name}
        </Text>
        <KeyValue label="Date" value={date(inv.invoice_date)} />
        {!!inv.due_date && <KeyValue label="Due" value={date(inv.due_date)} />}
        {!!inv.notes && <Text style={{ color: colors.muted, marginTop: 6 }}>{inv.notes}</Text>}
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <View style={{ flexGrow: 1, minWidth: 200 }}>
          <Button title={Platform.OS === 'web' ? 'Print / save PDF' : 'Share PDF'} icon="share-outline" onPress={share} loading={sharing} />
        </View>
        <View style={{ flexGrow: 1, minWidth: 200 }}>
          <Button
            title={admin && waNumber(inv.customers.phone) ? `Send to ${inv.customers.name} on WhatsApp` : 'Send on WhatsApp'}
            icon="logo-whatsapp"
            variant="secondary"
            onPress={() => openWhatsApp(billMessage(inv, items, inv.customers, settings), admin ? inv.customers.phone : undefined)}
          />
        </View>
      </View>

      <SectionTitle>Items</SectionTitle>
      <Card>
        {items.map((it) => (
          <View key={it.id} style={{ flexDirection: 'row', paddingVertical: 6 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{it.description}</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                {qty(it.qty)} {it.unit} × {money(it.rate)}
                {gst ? ` · GST ${Number(it.gst_rate)}%` : ''}
                {gst && it.hsn ? ` · HSN ${it.hsn}` : ''}
              </Text>
            </View>
            <Text style={{ fontWeight: '600', color: colors.text }}>{money(it.amount)}</Text>
          </View>
        ))}
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6, paddingTop: 6 }}>
          <KeyValue label="Subtotal" value={money(inv.subtotal)} />
          {gst && !inv.inter_state && (
            <>
              <KeyValue label="CGST" value={money(inv.cgst)} />
              <KeyValue label="SGST" value={money(inv.sgst)} />
            </>
          )}
          {gst && inv.inter_state && <KeyValue label="IGST" value={money(inv.igst)} />}
          {Number(inv.round_off) !== 0 && <KeyValue label="Round off" value={money(inv.round_off)} />}
          <KeyValue label="Total" value={money(inv.total)} bold />
          <KeyValue label="Paid" value={money(inv.paid)} />
          <KeyValue label="Balance" value={money(balance)} bold />
        </View>
      </Card>

      <SectionTitle>Payments</SectionTitle>
      {payments.length > 0 && (
        <View style={styles.listCard}>
          {payments.map((p) => (
            <ListRow
              key={p.id}
              title={money(p.amount)}
              subtitle={`${date(p.paid_on)} · ${p.method.toUpperCase()}`}
              right={admin ? 'Delete' : undefined}
              onPress={admin ? () => deletePayment(p) : undefined}
            />
          ))}
        </View>
      )}
      {!admin && payments.length === 0 && <Text style={{ color: colors.muted, marginBottom: 14 }}>No payments received yet.</Text>}
      {admin && !inv.cancelled && balance > 0 && (
        <Card>
          <Segmented
            value={method}
            onChange={setMethod}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'upi', label: 'UPI' },
              { value: 'bank', label: 'Bank' },
              { value: 'cheque', label: 'Cheque' },
            ]}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field label="Amount ₹" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={String(balance)} />
            <Field label="Date" value={paidOn} onChangeText={setPaidOn} placeholder="YYYY-MM-DD" />
          </View>
          <Button title="Record payment" icon="cash-outline" onPress={addPayment} loading={saving} />
          <Button title={`Mark fully paid (${money(balance)})`} variant="secondary" onPress={() => setAmount(String(balance))} />
        </Card>
      )}

      {!!inv.order_id && (
        <Button title="View order" variant="secondary" icon="clipboard-outline" onPress={() => router.push(orderHref(role, inv.order_id!))} />
      )}
      {admin && !inv.cancelled && <Button title="Cancel invoice" variant="danger" icon="close-circle-outline" onPress={cancel} />}
    </Screen>
  );
}
