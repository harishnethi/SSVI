import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { H } from '@/components/Heading';
import { colors, Empty, IconTile, ListRow, Screen, SectionTitle, styles } from '@/components/ui';
import { date, money, qty, round2 } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Invoice, InvoiceItem } from '@/lib/types';
import { must, useData } from '@/lib/useData';

type Line = InvoiceItem & { invoices: Pick<Invoice, 'id' | 'invoice_no' | 'invoice_date' | 'cancelled'> };

const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

/** Everything the customer has bought, from their bills, grouped by month. */
export default function Purchases() {
  const router = useRouter();
  const { data, loading, error, reload } = useData(
    async () =>
      must(
        await supabase
          .from('invoice_items')
          .select('*, invoices!inner(id, invoice_no, invoice_date, cancelled)')
          .eq('invoices.cancelled', false),
      ) as Line[],
  );

  if (!data) return <Empty text="" loading={loading} error={error} />;
  if (!data.length) {
    return (
      <Screen>
        <Empty text="No purchases yet. Items appear here once your orders are billed." />
      </Screen>
    );
  }

  const lines = [...data].sort((a, b) => b.invoices.invoice_date.localeCompare(a.invoices.invoice_date));
  const value = (l: Line) => round2(Number(l.amount) + Number(l.tax));
  const total = round2(lines.reduce((s, l) => s + value(l), 0));

  // Per product, across all time.
  const byProduct = new Map<string, { name: string; unit: string; qty: number; value: number }>();
  for (const l of lines) {
    const k = `${l.description}|${l.unit}`;
    const p = byProduct.get(k) ?? { name: l.description, unit: l.unit, qty: 0, value: 0 };
    p.qty += Number(l.qty);
    p.value = round2(p.value + value(l));
    byProduct.set(k, p);
  }
  const products = [...byProduct.values()].sort((a, b) => b.value - a.value);

  // By month, newest first.
  const months = new Map<string, Line[]>();
  for (const l of lines) {
    const ym = l.invoices.invoice_date.slice(0, 7);
    months.set(ym, [...(months.get(ym) ?? []), l]);
  }

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
        <Stat label="Total purchases" value={money(total)} />
        <Stat label="Bills" value={String(new Set(lines.map((l) => l.invoices.id)).size)} />
        <Stat label="Most bought" value={products[0]?.name ?? '–'} />
      </View>

      <SectionTitle>By product</SectionTitle>
      <View style={styles.listCard}>
        {products.map((p) => (
          <ListRow key={`${p.name}|${p.unit}`} title={p.name} subtitle={`${qty(p.qty)} ${p.unit} in total`} right={money(p.value)} />
        ))}
      </View>

      {[...months.entries()].map(([ym, ls]) => (
        <View key={ym}>
          <SectionTitle right={<Text style={{ fontWeight: '800', color: colors.primary }}>{money(round2(ls.reduce((s, l) => s + value(l), 0)))}</Text>}>
            {monthLabel(ym)}
          </SectionTitle>
          <View style={styles.listCard}>
            {ls.map((l) => (
              <ListRow
                key={l.id}
                title={`${l.description} · ${qty(l.qty)} ${l.unit}`}
                subtitle={`${date(l.invoices.invoice_date)} · ${l.invoices.invoice_no}`}
                right={money(value(l))}
                onPress={() => router.push(`/account/bills/${l.invoices.id}`)}
              />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.card, { flexGrow: 1, flexBasis: 180, marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
      <IconTile name="bag-handle-outline" size={40} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
        <H style={{ fontSize: 20, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {value}
        </H>
      </View>
    </View>
  );
}
