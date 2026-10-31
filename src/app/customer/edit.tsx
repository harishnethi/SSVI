import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Field, FieldRow, Screen } from '@/components/ui';
import { confirm, notify } from '@/lib/dialog';
import { supabase } from '@/lib/supabase';
import type { Customer } from '@/lib/types';

const blank = { name: '', phone: '', email: '', address: '', gstin: '', state: '', notes: '' };

export default function EditCustomer() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          const c = data as Customer;
          setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, gstin: c.gstin, state: c.state, notes: c.notes });
        }
      });
  }, [id]);

  const set = (k: keyof typeof blank) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) return notify('Name is required');
    setSaving(true);
    const payload = { ...form, name: form.name.trim(), gstin: form.gstin.trim().toUpperCase() };
    const { error } = id
      ? await supabase.from('customers').update(payload).eq('id', id)
      : await supabase.from('customers').insert(payload);
    setSaving(false);
    if (error) return notify('Could not save', error.message);
    router.back();
  };

  const remove = async () => {
    if (!(await confirm('Delete customer?', 'This cannot be undone.', 'Delete'))) return;
    const { error } = await supabase.from('customers').delete().eq('id', id!);
    if (error) return notify('Could not delete', 'Customers with orders or invoices cannot be deleted.');
    router.dismissTo('/admin/customers');
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: id ? 'Edit customer' : 'New customer' }} />
      <Field label="Name *" value={form.name} onChangeText={set('name')} placeholder="Business or person name" />
      <FieldRow>
        <Field label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Field label="State" value={form.state} onChangeText={set('state')} placeholder="e.g. Telangana" />
      </FieldRow>
      <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
      <Field label="GSTIN" value={form.gstin} onChangeText={set('gstin')} autoCapitalize="characters" placeholder="Leave blank if unregistered" />
      <Field label="Address" value={form.address} onChangeText={set('address')} multiline />
      <Field label="Notes" value={form.notes} onChangeText={set('notes')} multiline />
      <Button title="Save" icon="checkmark" onPress={save} loading={saving} />
      {!!id && <Button title="Delete customer" variant="danger" icon="trash-outline" onPress={remove} />}
    </Screen>
  );
}
