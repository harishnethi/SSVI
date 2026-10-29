import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Badge, Button, colors, Empty, ListRow, SearchBar, Segmented } from '@/components/ui';
import { money, qty } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import { must, useData } from '@/lib/useData';

export default function Products() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const { data, loading, error, reload } = useData(
    async () => must(await supabase.from('products').select('*').order('name')) as Product[],
  );

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter(
      (p) =>
        (filter === 'all' || Number(p.stock) <= Number(p.low_stock)) &&
        (!s || `${p.name} ${p.sku} ${p.hsn}`.toLowerCase().includes(s)),
    );
  }, [data, q, filter]);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      data={list}
      keyExtractor={(p) => p.id}
      refreshing={loading}
      onRefresh={reload}
      ListHeaderComponent={
        <View style={{ padding: 16, paddingBottom: 4 }}>
          <Button title="Add product" icon="add" onPress={() => router.push('/product/edit')} />
          <SearchBar value={q} onChangeText={setQ} placeholder="Search name, SKU, HSN" />
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All products' },
              { value: 'low', label: 'Low stock' },
            ]}
          />
        </View>
      }
      renderItem={({ item: p }) => {
        const low = Number(p.stock) <= Number(p.low_stock);
        return (
          <ListRow
            title={p.name}
            subtitle={[p.sku, money(p.price) + ' / ' + p.unit, `GST ${Number(p.gst_rate)}%`].filter(Boolean).join(' · ')}
            right={`${qty(p.stock)} ${p.unit}`}
            badge={low ? <Badge label="Low" tone="danger" /> : undefined}
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
          />
        );
      }}
      ListEmptyComponent={<Empty text={q || filter === 'low' ? 'No matching products' : 'No products yet'} loading={loading && !data} error={error} />}
    />
  );
}
