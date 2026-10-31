import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Badge, colors, Empty, ListRow, SearchBar, Segmented } from '@/components/ui';
import { qty } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Product, ProductKind } from '@/lib/types';
import { must, useData } from '@/lib/useData';

export default function WorkerStock() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<ProductKind>('finished');
  const { data, loading, error, reload } = useData(async () => must(await supabase.from('products').select('*').order('name')) as Product[]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter((p) => p.kind === kind && (!s || p.name.toLowerCase().includes(s)));
  }, [data, q, kind]);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={list}
      keyExtractor={(p) => p.id}
      refreshing={loading}
      onRefresh={reload}
      ListHeaderComponent={
        <View style={{ padding: 16, paddingBottom: 4 }}>
          <Segmented
            value={kind}
            onChange={setKind}
            options={[
              { value: 'finished', label: 'Murmura' },
              { value: 'raw', label: 'Paddy & raw' },
            ]}
          />
          <SearchBar value={q} onChangeText={setQ} placeholder="Search" />
        </View>
      }
      renderItem={({ item: p }) => (
        <ListRow
          title={p.name}
          subtitle="Tap to add or remove stock"
          right={`${qty(p.stock)} ${p.unit}`}
          badge={Number(p.stock) <= Number(p.low_stock) ? <Badge label="Low" tone="danger" /> : undefined}
          onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
        />
      )}
      ListEmptyComponent={<Empty text="No products" loading={loading && !data} error={error} />}
    />
  );
}
