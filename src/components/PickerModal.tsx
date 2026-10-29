import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, Empty, ListRow, SearchBar } from './ui';

export function PickerModal<T extends { id: string }>({
  visible,
  title,
  items,
  onClose,
  onSelect,
  label,
  sub,
  right,
  footer,
}: {
  visible: boolean;
  title: string;
  items: T[];
  onClose: () => void;
  onSelect: (item: T) => void;
  label: (item: T) => string;
  sub?: (item: T) => string;
  right?: (item: T) => string;
  footer?: React.ReactNode;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => (label(i) + ' ' + (sub?.(i) ?? '')).toLowerCase().includes(s));
  }, [items, q, label, sub]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: '700', color: colors.text }}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <SearchBar value={q} onChangeText={setQ} placeholder="Search" />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ListRow
              title={label(item)}
              subtitle={sub?.(item)}
              right={right?.(item)}
              onPress={() => {
                setQ('');
                onSelect(item);
              }}
            />
          )}
          ListEmptyComponent={<Empty text="Nothing found" />}
          ListFooterComponent={footer ? <View style={{ padding: 16 }}>{footer}</View> : undefined}
        />
      </SafeAreaView>
    </Modal>
  );
}
