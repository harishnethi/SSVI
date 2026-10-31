import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { H } from '@/components/Heading';
import { Badge, colors, Empty, IconTile, ListRow, Screen, styles } from '@/components/ui';
import { date, money, round2 } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Invoice, Payment } from '@/lib/types';
import { must, useData } from '@/lib/useData';

type Row = Payment & { invoices: Pick<Invoice, 'invoice_no'> | null };

const METHOD: Record<string, string> = { cash: 'Cash', upi: 'UPI', bank: 'Bank transfer', cheque: 'Cheque' };

/** Every payment the customer has made, newest first. */
export default function Payments() {
  const router = useRouter();
  const { data, loading, error, reload } = useData(async () => {
    const [p, i] = await Promise.all([
      supabase.from('payments').select('*, invoices(invoice_no)').order('paid_on', { ascending: false }),
      supabase.from('invoices').select('total, paid').eq('cancelled', false),
    ]);
    return { payments: must(p) as Row[], invoices: must(i) as Pick<Invoice, 'total' | 'paid'>[] };
  });

  if (!data) return <Empty text="" loading={loading} error={error} />;
  const paid = round2(data.payments.reduce((s, p) => s + Number(p.amount), 0));
  const due = round2(data.invoices.reduce((s, i) => s + Math.max(0, Number(i.total) - Number(i.paid)), 0));

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <Total icon="checkmark-circle-outline" label="Total paid" value={money(paid)} />
        <Total icon="alert-circle-outline" label="Still due" value={money(due)} alert={due > 0} />
      </View>
      {data.payments.length ? (
        <View style={styles.listCard}>
          {data.payments.map((p) => (
            <ListRow
              key={p.id}
              title={money(p.amount)}
              subtitle={`${date(p.paid_on)}${p.invoices ? ` · for ${p.invoices.invoice_no}` : ''}${p.note ? ` · ${p.note}` : ''}`}
              badge={<Badge label={METHOD[p.method] ?? p.method} tone="success" />}
              onPress={() => router.push(`/account/bills/${p.invoice_id}`)}
            />
          ))}
        </View>
      ) : (
        <Empty text="No payments recorded yet." />
      )}
    </Screen>
  );
}

function Total({ icon, label, value, alert }: { icon: 'checkmark-circle-outline' | 'alert-circle-outline'; label: string; value: string; alert?: boolean }) {
  return (
    <View style={[styles.card, { flexGrow: 1, flexBasis: 220, marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
      <IconTile name={icon} size={40} />
      <View>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
        <H style={{ fontSize: 24, fontWeight: '700', color: alert ? colors.danger : colors.text }}>{value}</H>
      </View>
    </View>
  );
}
