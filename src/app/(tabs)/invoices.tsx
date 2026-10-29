import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { InvoiceBadge } from '@/components/InvoiceBadge';
import { Button, colors, Empty, ListRow, SearchBar, Segmented } from '@/components/ui';
import { date, money } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Invoice } from '@/lib/types';
import { must, useData } from '@/lib/useData';

type Filter = 'all' | 'unpaid' | 'gst' | 'none';

export default function Invoices() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { data, loading, error, reload } = useData(
    async () =>
      must(
        await supabase.from('invoices').select('*, customers(name)').order('created_at', { ascending: false }).limit(500),
      ) as Invoice[],
  );

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter((i) => {
      if (filter === 'unpaid' && (i.cancelled || Number(i.paid) >= Number(i.total))) return false;
      if ((filter === 'gst' || filter === 'none') && i.tax_mode !== filter) return false;
      return !s || `${i.invoice_no} ${i.customers?.name ?? ''}`.toLowerCase().includes(s);
    });
  }, [data, q, filter]);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      data={list}
      keyExtractor={(i) => i.id}
      refreshing={loading}
      onRefresh={reload}
      ListHeaderComponent={
        <View style={{ padding: 16, paddingBottom: 4 }}>
          <Button title="New invoice" icon="add" onPress={() => router.push('/invoice/new')} />
          <SearchBar value={q} onChangeText={setQ} placeholder="Search invoice no. or customer" />
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'gst', label: 'GST' },
              { value: 'none', label: 'No tax' },
            ]}
          />
        </View>
      }
      renderItem={({ item: i }) => (
        <ListRow
          title={i.customers?.name ?? ''}
          subtitle={`${i.invoice_no} · ${date(i.invoice_date)}`}
          right={money(i.total)}
          rightSub={!i.cancelled && Number(i.paid) < Number(i.total) ? `Due ${money(Number(i.total) - Number(i.paid))}` : undefined}
          badge={<InvoiceBadge invoice={i} />}
          onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: i.id } })}
        />
      )}
      ListEmptyComponent={<Empty text="No invoices" loading={loading && !data} error={error} />}
    />
  );
}
