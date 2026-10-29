import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Customer } from '@/lib/types';
import { PickerModal } from './PickerModal';
import { colors, styles } from './ui';

export function CustomerSelect({
  customers,
  value,
  onChange,
}: {
  customers: Customer[];
  value: Customer | null;
  onChange: (c: Customer) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>Customer *</Text>
      <Pressable onPress={() => setOpen(true)} style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, color: value ? colors.text : colors.muted }}>{value?.name ?? 'Choose customer'}</Text>
          {!!value && (
            <Text style={{ fontSize: 13, color: colors.muted }}>
              {[value.state, value.gstin].filter(Boolean).join(' · ') || 'No GSTIN'}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      <PickerModal
        visible={open}
        title="Choose customer"
        items={customers}
        onClose={() => setOpen(false)}
        onSelect={(c) => {
          setOpen(false);
          onChange(c);
        }}
        label={(c) => c.name}
        sub={(c) => [c.phone, c.state, c.gstin].filter(Boolean).join(' · ')}
      />
    </View>
  );
}
