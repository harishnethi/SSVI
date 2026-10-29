import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

export const colors = {
  primary: '#1F4E79',
  primaryLight: '#E8F0F8',
  bg: '#F4F6F9',
  card: '#FFFFFF',
  text: '#1B1F24',
  muted: '#667085',
  border: '#D9DEE5',
  danger: '#C62828',
  dangerLight: '#FDECEC',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#B26A00',
  warningLight: '#FFF4E0',
};

type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({
  children,
  refreshing,
  onRefresh,
  scroll = true,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
}) {
  if (!scroll) return <View style={[styles.screen, styles.screenPad]}>{children}</View>;
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenPad}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 12, flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        style={[styles.input, props.multiline && { minHeight: 70, textAlignVertical: 'top' }, props.style]}
      />
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  small,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
}) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.dangerLight : colors.primaryLight;
  const fg = variant === 'primary' ? '#fff' : variant === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 16 : 18} color={fg} style={{ marginRight: 6 }} />}
          <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function ListRow({
  title,
  subtitle,
  right,
  rightSub,
  onPress,
  badge,
}: {
  title: string;
  subtitle?: string;
  right?: string;
  rightSub?: string;
  onPress?: () => void;
  badge?: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.bg }]}>
      <View style={{ flex: 1, marginRight: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {title}
          </Text>
          {badge}
        </View>
        {!!subtitle && (
          <Text style={styles.rowSub} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {(right || rightSub) && (
        <View style={{ alignItems: 'flex-end' }}>
          {!!right && <Text style={styles.rowRight}>{right}</Text>}
          {!!rightSub && <Text style={styles.rowSub}>{rightSub}</Text>}
        </View>
      )}
      {onPress && <Ionicons name="chevron-forward" size={18} color={colors.muted} style={{ marginLeft: 4 }} />}
    </Pressable>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const map = {
    neutral: [colors.bg, colors.muted],
    success: [colors.successLight, colors.success],
    warning: [colors.warningLight, colors.warning],
    danger: [colors.dangerLight, colors.danger],
    info: [colors.primaryLight, colors.primary],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (s: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={{ flex: 1, marginLeft: 8, fontSize: 16, color: colors.text, paddingVertical: 10 }}
      />
      {!!value && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.segmentItem, value === o.value && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, value === o.value && { color: '#fff' }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Empty({ text, loading, error }: { text: string; loading?: boolean; error?: string | null }) {
  if (loading) return <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />;
  return <Text style={[styles.empty, error && { color: colors.danger }]}>{error ?? text}</Text>;
}

export function KeyValue({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.kv}>
      <Text style={[styles.kvLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.kvValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenPad: { padding: 16, paddingBottom: 48 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 4, fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 12, marginBottom: 0 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  rowSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  rowRight: { fontSize: 15, fontWeight: '600', color: colors.text },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  segment: { flexDirection: 'row', backgroundColor: colors.primaryLight, borderRadius: 10, padding: 3, marginBottom: 12 },
  segmentItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontWeight: '600', color: colors.primary, fontSize: 14 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32, fontSize: 15 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  kvLabel: { color: colors.muted, fontSize: 15 },
  kvValue: { color: colors.text, fontSize: 15 },
  bold: { fontWeight: '700', color: colors.text },
  listCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 14,
  },
});
