import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Button, colors, Field, FieldRow, Screen, SectionTitle } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { notify } from '@/lib/dialog';
import { supabase } from '@/lib/supabase';
import type { Customer } from '@/lib/types';

const blank = { name: '', phone: '', address: '', gstin: '', state: '' };

export default function Profile() {
  const { profile, session } = useAuth();
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof blank) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!profile?.customer_id) return;
    supabase
      .from('customers')
      .select('*')
      .eq('id', profile.customer_id)
      .single()
      .then(({ data }) => {
        const c = data as Customer | null;
        if (c) setForm({ name: c.name, phone: c.phone, address: c.address, gstin: c.gstin, state: c.state });
      });
  }, [profile?.customer_id]);

  const save = async () => {
    if (!profile?.customer_id) return;
    if (!form.name.trim()) return notify('Name is required');
    setSaving(true);
    const { error } = await supabase
      .from('customers')
      .update({ ...form, name: form.name.trim(), gstin: form.gstin.trim().toUpperCase() })
      .eq('id', profile.customer_id);
    setSaving(false);
    if (error) return notify('Could not save', error.message);
    notify('Saved', 'Your details will appear on new bills.');
  };

  return (
    <Screen>
      <SectionTitle>Your business details</SectionTitle>
      <Field label="Shop / business name" value={form.name} onChangeText={set('name')} />
      <FieldRow>
        <Field label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Field label="State" value={form.state} onChangeText={set('state')} />
      </FieldRow>
      <Field label="Address" value={form.address} onChangeText={set('address')} multiline />
      <Field label="GSTIN" value={form.gstin} onChangeText={set('gstin')} autoCapitalize="characters" />
      <Button title="Save" icon="checkmark" onPress={save} loading={saving} />
      <Text style={{ color: colors.muted, marginTop: 8 }}>Logged in as {session?.user.email}</Text>
    </Screen>
  );
}
