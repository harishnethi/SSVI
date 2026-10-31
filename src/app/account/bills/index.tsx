import { useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';
import { InvoiceBadge } from '@/components/InvoiceBadge';
import { colors, Empty, ListRow } from '@/components/ui';
import { date, money } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Invoice } from '@/lib/types';
import { must, useData } from '@/lib/useData';

export default function MyBills() {
  const router = useRouter();
  const { data, loading, error, reload } = useData(
    async () => must(await supabase.from('invoices').select('*').order('invoice_date', { ascending: false })) as Invoice[],
  );
  const due = (data ?? []).filter((i) => !i.cancelled).reduce((s, i) => s + Math.max(0, Number(i.total) - Number(i.paid)), 0);
  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={data ?? []}
      keyExtractor={(i) => i.id}
      refreshing={loading}
      onRefresh={reload}
      ListHeaderComponent={
        data?.length ? (
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 16, color: colors.text }}>
              Total due: <Text style={{ fontWeight: '800' }}>{money(due)}</Text>
            </Text>
          </View>
        ) : undefined
      }
      renderItem={({ item: i }) => (
        <ListRow
          title={i.invoice_no}
          subtitle={date(i.invoice_date)}
          right={money(i.total)}
          rightSub={!i.cancelled && Number(i.paid) < Number(i.total) ? `Due ${money(Number(i.total) - Number(i.paid))}` : undefined}
          badge={<InvoiceBadge invoice={i} />}
          onPress={() => router.push(`/account/bills/${i.id}`)}
        />
      )}
      ListEmptyComponent={<Empty text="No bills yet." loading={loading && !data} error={error} />}
    />
  );
}
