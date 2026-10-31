import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { resolveTheme, ROYAL_GOLD } from '@/lib/palettes';
import { H } from './Heading';

// The SSVI brand colours (always light: ivory, forest green and gold), see src/lib/palettes.ts.
const theme = resolveTheme();

export const colors = theme.colors;

/** strong: sidebar/headers/icons, button: primary buttons, soft: hero cards. */
export const brand = theme.brand;

export const shadow = { boxShadow: theme.shadow } as ViewStyle;

export function BrandGradient({
  children,
  style,
  tone = 'strong',
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: keyof typeof brand;
}) {
  return (
    <LinearGradient colors={brand[tone]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

/** Brand gradient used behind navigation headers. */
export function BrandHeader() {
  return <BrandGradient style={StyleSheet.absoluteFill} />;
}

/** Rounded brand-coloured tile holding an icon. */
export function IconTile({ name, size = 44 }: { name: IconName; size?: number }) {
  return (
    <BrandGradient style={{ width: size, height: size, borderRadius: size * 0.3, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size * 0.48} color={ROYAL_GOLD} />
    </BrandGradient>
  );
}

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
      <H style={styles.sectionTitle}>{children}</H>
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
  const fg = variant === 'primary' ? '#fff' : variant === 'danger' ? colors.danger : colors.primaryDark;
  const content = loading ? (
    <ActivityIndicator color={fg} />
  ) : (
    <>
      {icon && <Ionicons name={icon} size={small ? 16 : 18} color={fg} style={{ marginRight: 6 }} />}
      <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text>
    </>
  );
  const box = [styles.button, small && styles.buttonSmall];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        { marginBottom: small ? 0 : 10, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'primary' && shadow,
        { borderRadius: small ? 10 : 14 },
      ]}
    >
      {variant === 'primary' ? (
        <BrandGradient tone="button" style={box}>{content}</BrandGradient>
      ) : (
        <View
          style={[
            box,
            variant === 'danger'
              ? { backgroundColor: colors.dangerLight }
              : { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.border },
          ]}
        >
          {content}
        </View>
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
      {options.map((o) => {
        const active = value === o.value;
        const label = <Text style={[styles.segmentText, active && { color: '#fff' }]}>{o.label}</Text>;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[{ flex: 1, borderRadius: 10 }, active && shadow]}>
            {active ? <BrandGradient tone="button" style={styles.segmentItem}>{label}</BrandGradient> : <View style={styles.segmentItem}>{label}</View>}
          </Pressable>
        );
      })}
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
  screenPad: { padding: 16, paddingBottom: 48, width: '100%', maxWidth: 1080, alignSelf: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  label: { fontSize: 13, color: colors.muted, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  rowSub: { fontSize: 13, color: colors.muted, marginTop: 3 },
  rowRight: { fontSize: 15, fontWeight: '700', color: colors.text },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...shadow,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentItem: { paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segmentText: { fontWeight: '600', color: colors.text, fontSize: 14 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 32, fontSize: 15 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  kvLabel: { color: colors.muted, fontSize: 15 },
  kvValue: { color: colors.text, fontSize: 15 },
  bold: { fontWeight: '700', color: colors.text },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 14,
    backgroundColor: colors.card,
    ...shadow,
  },
});
