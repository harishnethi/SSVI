import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, colors, Empty, ListRow, SearchBar } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { Customer } from '@/lib/types';
import { must, useData } from '@/lib/useData';

export default function Customers() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const { data, loading, error, reload } = useData(
    async () => must(await supabase.from('customers').select('*').order('name')) as Customer[],
  );

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter((c) => !s || `${c.name} ${c.phone} ${c.gstin}`.toLowerCase().includes(s));
  }, [data, q]);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      data={list}
      keyExtractor={(c) => c.id}
      refreshing={loading}
      onRefresh={reload}
      ListHeaderComponent={
        <View style={{ padding: 16, paddingBottom: 4 }}>
          <Button title="Add customer" icon="person-add-outline" onPress={() => router.push('/customer/edit')} />
          <SearchBar value={q} onChangeText={setQ} placeholder="Search name, phone, GSTIN" />
        </View>
      }
      renderItem={({ item }) => (
        <ListRow
          title={item.name}
          subtitle={[item.phone, item.state, item.gstin].filter(Boolean).join(' · ')}
          onPress={() => router.push({ pathname: '/customer/[id]', params: { id: item.id } })}
        />
      )}
      ListEmptyComponent={<Empty text={q ? 'No matching customers' : 'No customers yet'} loading={loading && !data} error={error} />}
    />
  );
}
