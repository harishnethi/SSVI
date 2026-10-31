import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Button, colors, Field, FieldRow, Screen, Segmented } from '@/components/ui';
import { confirm, notify } from '@/lib/dialog';
import { supabase } from '@/lib/supabase';
import type { Product, ProductKind } from '@/lib/types';

const blank = { kind: 'finished' as ProductKind, name: '', sku: '', hsn: '', unit: 'kg', price: '0', gst_rate: '5', low_stock: '0', opening: '0' };

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const p = data as Product;
        setForm({
          kind: p.kind,
          name: p.name,
          sku: p.sku,
          hsn: p.hsn,
          unit: p.unit,
          price: String(p.price),
          gst_rate: String(p.gst_rate),
          low_stock: String(p.low_stock),
          opening: '0',
        });
      });
  }, [id]);

  const set = (k: Exclude<keyof typeof blank, 'kind'>) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const num = (s: string) => (Number.isFinite(parseFloat(s)) ? parseFloat(s) : 0);

  const save = async () => {
    if (!form.name.trim()) return notify('Name is required');
    setSaving(true);
    const payload = {
      kind: form.kind,
      name: form.name.trim(),
      sku: form.sku.trim(),
      hsn: form.hsn.trim(),
      unit: form.unit.trim() || 'pcs',
      price: num(form.price),
      gst_rate: num(form.gst_rate),
      low_stock: num(form.low_stock),
    };
    if (id) {
      const { error } = await supabase.from('products').update(payload).eq('id', id);
      setSaving(false);
      if (error) return notify('Could not save', error.message);
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select('id').single();
      if (!error && num(form.opening) !== 0) {
        await supabase
          .from('stock_movements')
          .insert({ product_id: data.id, qty: num(form.opening), reason: 'adjustment', note: 'Opening stock' });
      }
      setSaving(false);
      if (error) return notify('Could not save', error.message);
    }
    router.back();
  };

  const remove = async () => {
    if (!(await confirm('Delete product?', 'Its stock history will also be deleted. Past invoices keep their lines.', 'Delete'))) return;
    const { error } = await supabase.from('products').delete().eq('id', id!);
    if (error) return notify('Could not delete', error.message);
    router.dismissTo('/admin/products');
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: id ? 'Edit product' : 'New product' }} />
      <Segmented
        value={form.kind}
        onChange={(kind) => setForm((f) => ({ ...f, kind }))}
        options={[
          { value: 'finished', label: 'Murmura for sale' },
          { value: 'raw', label: 'Paddy / raw material' },
        ]}
      />
      <Field label="Name *" value={form.name} onChangeText={set('name')} />
      <FieldRow>
        <Field label="SKU / Code" value={form.sku} onChangeText={set('sku')} autoCapitalize="characters" />
        <Field label="HSN code" value={form.hsn} onChangeText={set('hsn')} keyboardType="number-pad" />
      </FieldRow>
      <FieldRow>
        <Field label="Unit" value={form.unit} onChangeText={set('unit')} placeholder="pcs, kg, m, box" autoCapitalize="none" />
        <Field label="Selling price ₹" value={form.price} onChangeText={set('price')} keyboardType="decimal-pad" />
      </FieldRow>
      <FieldRow>
        <Field label="GST %" value={form.gst_rate} onChangeText={set('gst_rate')} keyboardType="decimal-pad" />
        <Field label="Low stock alert at" value={form.low_stock} onChangeText={set('low_stock')} keyboardType="decimal-pad" />
      </FieldRow>
      {!id ? (
        <Field label="Opening stock" value={form.opening} onChangeText={set('opening')} keyboardType="decimal-pad" />
      ) : (
        <Text style={{ color: colors.muted, marginBottom: 12 }}>To change stock, use “Stock in / out” on the product page.</Text>
      )}
      <Button title="Save" icon="checkmark" onPress={save} loading={saving} />
      {!!id && <Button title="Delete product" variant="danger" icon="trash-outline" onPress={remove} />}
    </Screen>
  );
}
