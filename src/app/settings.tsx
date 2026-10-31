import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Button, colors, Field, FieldRow, Screen, SectionTitle } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { confirm, notify } from '@/lib/dialog';
import { supabase } from '@/lib/supabase';
import type { Settings } from '@/lib/types';

type Form = Omit<Settings, 'id'>;
const blank: Form = { business_name: '', address: '', phone: '', email: '', gstin: '', state: '', bank_details: '', invoice_terms: '' };

export default function SettingsScreen() {
  const { session } = useAuth();
  const [form, setForm] = useState<Form>(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          const { id: _id, ...rest } = data as Settings;
          setForm({ ...blank, ...rest });
        }
      });
  }, []);

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const { business_name, address, phone, email, gstin, state, bank_details, invoice_terms } = form;
    const { error } = await supabase
      .from('settings')
      .update({ business_name, address, phone, email, gstin: gstin.toUpperCase(), state, bank_details, invoice_terms, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setSaving(false);
    if (error) return notify('Could not save', error.message);
    notify('Saved', 'These details appear on every invoice.');
  };

  const signOut = async () => {
    if (await confirm('Sign out?', 'You will need to log in again (with Google or your email and password).', 'Sign out')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <Screen>
      <SectionTitle>Printed on invoices</SectionTitle>
      <Field label="Business name" value={form.business_name} onChangeText={set('business_name')} />
      <Field label="Address" value={form.address} onChangeText={set('address')} multiline />
      <FieldRow>
        <Field label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Field label="Email" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
      </FieldRow>
      <FieldRow>
        <Field label="GSTIN" value={form.gstin} onChangeText={set('gstin')} autoCapitalize="characters" />
        <Field label="State" value={form.state} onChangeText={set('state')} placeholder="e.g. Telangana" />
      </FieldRow>
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12, marginTop: -4 }}>
        Your state decides CGST+SGST vs IGST automatically when a customer is in another state.
      </Text>
      <Field label="Bank details" value={form.bank_details} onChangeText={set('bank_details')} multiline placeholder="Bank, A/c no., IFSC, UPI ID" />
      <Field label="Terms" value={form.invoice_terms} onChangeText={set('invoice_terms')} multiline />
      <Button title="Save settings" icon="checkmark" onPress={save} loading={saving} />

      <SectionTitle>Account</SectionTitle>
      <Text style={{ color: colors.muted, marginBottom: 10 }}>Signed in as {session?.user.email}</Text>
      <Button title="Sign out" variant="danger" icon="log-out-outline" onPress={signOut} />
    </Screen>
  );
}
