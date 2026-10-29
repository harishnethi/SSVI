import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { money, qty as fmtQty, round2 } from '@/lib/format';
import type { LineItem, Product, TaxMode } from '@/lib/types';
import { PickerModal } from './PickerModal';
import { Button, Card, colors, Field, FieldRow, SectionTitle } from './ui';

/** Editable list of order / invoice lines. Numbers are kept as text while typing. */
export function LineItemsEditor({
  items,
  onChange,
  products,
  taxMode,
}: {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  products: Product[];
  taxMode: TaxMode;
}) {
  const [picking, setPicking] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const update = (i: number, patch: Partial<LineItem>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => {
    setDrafts({});
    onChange(items.filter((_, j) => j !== i));
  };

  const numField = (i: number, key: 'qty' | 'rate' | 'gst_rate') => ({
    value: drafts[`${i}.${key}`] ?? String(items[i][key]),
    keyboardType: 'decimal-pad' as const,
    onChangeText: (t: string) => {
      setDrafts((d) => ({ ...d, [`${i}.${key}`]: t }));
      const n = parseFloat(t);
      update(i, { [key]: Number.isFinite(n) ? n : 0 });
    },
  });

  const addProduct = (p: Product) => {
    setPicking(false);
    onChange([
      ...items,
      { product_id: p.id, description: p.name, hsn: p.hsn, unit: p.unit, qty: 1, rate: Number(p.price), gst_rate: Number(p.gst_rate) },
    ]);
  };

  const addCustom = () => {
    setPicking(false);
    onChange([...items, { product_id: null, description: '', hsn: '', unit: 'pcs', qty: 1, rate: 0, gst_rate: 18 }]);
  };

  return (
    <View>
      <SectionTitle>Items</SectionTitle>
      {items.map((it, i) => {
        const product = products.find((p) => p.id === it.product_id);
        const short = product && it.qty > Number(product.stock);
        return (
          <Card key={i}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Field label={`Item ${i + 1}`} value={it.description} onChangeText={(t) => update(i, { description: t })} placeholder="Description" />
              </View>
              <Pressable onPress={() => remove(i)} hitSlop={10} style={{ marginLeft: 8, marginTop: 26 }}>
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
              </Pressable>
            </View>
            <FieldRow>
              <Field label={`Qty (${it.unit})`} {...numField(i, 'qty')} />
              <Field label="Rate ₹" {...numField(i, 'rate')} />
              {taxMode === 'gst' && <Field label="GST %" {...numField(i, 'gst_rate')} />}
            </FieldRow>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: short ? colors.warning : colors.muted, fontSize: 13 }}>
                {product ? `In stock: ${fmtQty(product.stock)} ${product.unit}${short ? ' — not enough' : ''}` : 'Custom item (no stock tracking)'}
              </Text>
              <Text style={{ fontWeight: '700', color: colors.text }}>{money(round2(it.qty * it.rate))}</Text>
            </View>
          </Card>
        );
      })}
      <Button title="Add item" icon="add" variant="secondary" onPress={() => setPicking(true)} />

      <PickerModal
        visible={picking}
        title="Choose product"
        items={products}
        onClose={() => setPicking(false)}
        onSelect={addProduct}
        label={(p) => p.name}
        sub={(p) => `Stock ${fmtQty(p.stock)} ${p.unit}${p.sku ? ' · ' + p.sku : ''}`}
        right={(p) => money(p.price)}
        footer={<Button title="Add custom item instead" variant="secondary" onPress={addCustom} />}
      />
    </View>
  );
}
