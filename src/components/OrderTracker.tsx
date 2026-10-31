import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';
import type { OrderStatus } from '@/lib/types';
import { colors, styles } from './ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

const STEPS: { status: OrderStatus; label: string; icon: IconName }[] = [
  { status: 'pending', label: 'Received', icon: 'receipt-outline' },
  { status: 'confirmed', label: 'Confirmed', icon: 'checkmark-done-outline' },
  { status: 'dispatched', label: 'Dispatched', icon: 'car-outline' },
  { status: 'delivered', label: 'Delivered', icon: 'home-outline' },
];

/** Progress line for an order: Received → Confirmed → Dispatched → Delivered. */
export function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <View style={[styles.card, { backgroundColor: colors.dangerLight, borderColor: colors.danger, flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
        <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
        <Text style={{ color: colors.danger, fontWeight: '700' }}>This order was cancelled.</Text>
      </View>
    );
  }
  const reached = STEPS.findIndex((s) => s.status === status);
  return (
    <View style={[styles.card, { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 20 }]}>
      {STEPS.map((s, i) => {
        const done = i <= reached;
        return (
          <View key={s.status} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              <View style={{ flex: 1, height: 3, backgroundColor: i === 0 ? 'transparent' : i <= reached ? colors.primary : colors.border }} />
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? colors.primary : colors.card,
                  borderWidth: 2,
                  borderColor: done ? colors.primary : colors.border,
                }}
              >
                <Ionicons name={s.icon} size={19} color={done ? colors.onPrimary : colors.muted} />
              </View>
              <View
                style={{ flex: 1, height: 3, backgroundColor: i === STEPS.length - 1 ? 'transparent' : i < reached ? colors.primary : colors.border }}
              />
            </View>
            <Text
              style={{
                marginTop: 8,
                fontSize: 13,
                fontWeight: i === reached ? '800' : '600',
                color: done ? colors.primary : colors.muted,
                textAlign: 'center',
              }}
            >
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
