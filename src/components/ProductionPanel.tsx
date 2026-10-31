import { useState } from 'react';
import { Text, View } from 'react-native';
import { PickerModal } from './PickerModal';
import { Button, Card, colors, Empty, Field, FieldRow, ListRow, SectionTitle, Screen, styles } from './ui';
import { notify } from '@/lib/dialog';
import { date, qty, today } from '@/lib/format';
import { isValidDate } from '@/lib/lookups';
import { supabase } from '@/lib/supabase';
import type { Product, ProductionRun } from '@/lib/types';
import { must, useData } from '@/lib/useData';

/** Record paddy used and murmura made, and list recent production. Used by admin and workers. */
export function ProductionPanel() {
  const { data, loading, error, reload } = useData(async () => {
    const [p, r] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('production_runs').select('*').order('run_date', { ascending: false }).order('created_at', { ascending: false }).limit(30),
    ]);
    return { products: must(p) as Product[], runs: must(r) as ProductionRun[] };
  });

  const [paddy, setPaddy] = useState<Product | null>(null);
  const [made, setMade] = useState<Product | null>(null);
  const [paddyQty, setPaddyQty] = useState('');
  const [madeQty, setMadeQty] = useState('');
  const [runDate, setRunDate] = useState(today());
  const [note, setNote] = useState('');
  const [picker, setPicker] = useState<'raw' | 'finished' | null>(null);
  const [saving, setSaving] = useState(false);

  if (!data) return <Empty text="" loading={loading} error={error} />;
  const raw = data.products.filter((p) => p.kind === 'raw');
  const finished = data.products.filter((p) => p.kind === 'finished');
  const byId = new Map(data.products.map((p) => [p.id, p]));

  const save = async () => {
    const pq = parseFloat(paddyQty);
    const mq = parseFloat(madeQty);
    if (!paddy || !made) return notify('Choose the paddy used and the murmura made');
    if (!(pq > 0) || !(mq > 0)) return notify('Enter both quantities');
    if (!isValidDate(runDate)) return notify('Date must be YYYY-MM-DD');
    setSaving(true);
    const { error } = await supabase.rpc('record_production', {
      p: { run_date: runDate, paddy_id: paddy.id, paddy_qty: pq, product_id: made.id, qty: mq, note: note.trim() },
    });
    setSaving(false);
    if (error) return notify('Could not save', error.message);
    setPaddyQty('');
    setMadeQty('');
    setNote('');
    reload();
  };

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <SectionTitle>Record production</SectionTitle>
      <Card>
        {raw.length === 0 && (
          <Text style={{ color: colors.warning, marginBottom: 12 }}>
            Add paddy as a product first (Stock → Add product → type “Paddy / raw material”).
          </Text>
        )}
        <Text style={styles.label}>Paddy used</Text>
        <Button title={paddy ? `${paddy.name} · ${qty(paddy.stock)} ${paddy.unit} in stock` : 'Choose paddy'} variant="secondary" icon="leaf-outline" onPress={() => setPicker('raw')} />
        <Field label={`Paddy quantity used${paddy ? ` (${paddy.unit})` : ''}`} value={paddyQty} onChangeText={setPaddyQty} keyboardType="decimal-pad" />

        <Text style={styles.label}>Murmura made</Text>
        <Button title={made ? `${made.name} · ${qty(made.stock)} ${made.unit} in stock` : 'Choose product made'} variant="secondary" icon="cube-outline" onPress={() => setPicker('finished')} />
        <Field label={`Quantity made${made ? ` (${made.unit})` : ''}`} value={madeQty} onChangeText={setMadeQty} keyboardType="decimal-pad" />

        <FieldRow>
          <Field label="Date" value={runDate} onChangeText={setRunDate} placeholder="YYYY-MM-DD" />
          <Field label="Note" value={note} onChangeText={setNote} placeholder="Batch, machine, shift…" />
        </FieldRow>
        <Button title="Save production" icon="checkmark" onPress={save} loading={saving} />
        <Text style={{ color: colors.muted, fontSize: 13 }}>Paddy stock goes down and murmura stock goes up automatically.</Text>
      </Card>

      <SectionTitle>Recent production</SectionTitle>
      <View style={styles.listCard}>
        {data.runs.length ? (
          data.runs.map((r) => {
            const pd = byId.get(r.paddy_id);
            const mp = byId.get(r.product_id);
            return (
              <ListRow
                key={r.id}
                title={`${qty(r.qty)} ${mp?.unit ?? ''} ${mp?.name ?? ''}`}
                subtitle={[date(r.run_date), `${qty(r.paddy_qty)} ${pd?.unit ?? ''} ${pd?.name ?? 'paddy'} used`, r.note].filter(Boolean).join(' · ')}
              />
            );
          })
        ) : (
          <Text style={{ padding: 16, color: colors.muted }}>No production recorded yet</Text>
        )}
      </View>

      <PickerModal
        visible={picker !== null}
        title={picker === 'raw' ? 'Paddy used' : 'Murmura made'}
        items={picker === 'raw' ? raw : finished}
        label={(p) => p.name}
        right={(p) => `${qty(p.stock)} ${p.unit}`}
        onClose={() => setPicker(null)}
        onSelect={(p) => {
          if (picker === 'raw') setPaddy(p);
          else setMade(p);
          setPicker(null);
        }}
      />
    </Screen>
  );
}
