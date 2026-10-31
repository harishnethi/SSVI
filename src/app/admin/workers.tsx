import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, colors, Empty, Field, FieldRow, ListRow, SectionTitle, Screen, styles } from '@/components/ui';
import { confirm, notify } from '@/lib/dialog';
import { today } from '@/lib/format';
import { isValidDate } from '@/lib/lookups';
import { createLoginFor, supabase } from '@/lib/supabase';
import type { Attendance, AttendanceStatus, Profile } from '@/lib/types';
import { must, useData } from '@/lib/useData';

const STATUSES: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'half_day', label: 'Half day' },
  { value: 'absent', label: 'Absent' },
  { value: 'leave', label: 'Leave' },
];

const time = (t: string | null) => (t ? new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '–');

export default function Workers() {
  const [day, setDay] = useState(today());
  const { data, loading, error, reload } = useData(async () => {
    const d = isValidDate(day) ? day : today();
    const [p, a] = await Promise.all([
      supabase.from('profiles').select('*').in('role', ['worker', 'none']).order('full_name'),
      supabase.from('attendance').select('*').eq('work_date', d),
    ]);
    return { profiles: must(p) as Profile[], attendance: must(a) as Attendance[] };
  }, [day]);

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [adding, setAdding] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!data) return <Empty text="" loading={loading} error={error} />;
  const workers = data.profiles.filter((p) => p.role === 'worker');
  const waiting = data.profiles.filter((p) => p.role === 'none');
  const att = new Map(data.attendance.map((a) => [a.worker_id, a]));
  const present = workers.filter((w) => ['present', 'half_day'].includes(att.get(w.id)?.status ?? '')).length;

  const setStatus = async (w: Profile, status: AttendanceStatus) => {
    if (!isValidDate(day)) return notify('Date must be YYYY-MM-DD');
    const { error } = await supabase.from('attendance').upsert({ worker_id: w.id, work_date: day, status }, { onConflict: 'worker_id,work_date' });
    if (error) return notify('Could not save', error.message);
    reload();
  };

  const setRole = async (p: Profile, changes: Partial<Profile>) => {
    const { error } = await supabase.from('profiles').update(changes).eq('id', p.id);
    if (error) return notify('Could not update', error.message);
    reload();
  };

  const addWorker = async () => {
    if (!form.name.trim() || !form.email.trim()) return notify('Enter the worker’s name and email');
    if (form.password.length < 6) return notify('Password must be at least 6 characters');
    setAdding(true);
    const { data: res, error } = await createLoginFor(form.email.trim(), form.password, {
      signup: 'worker',
      name: form.name.trim(),
      phone: form.phone.trim(),
    });
    if (error || !res.user) {
      setAdding(false);
      return notify('Could not create login', error?.message ?? 'Unknown error');
    }
    const { error: e2 } = await supabase
      .from('profiles')
      .update({ role: 'worker', full_name: form.name.trim(), phone: form.phone.trim() })
      .eq('id', res.user.id);
    setAdding(false);
    if (e2) return notify('Login created, but could not make it a worker', e2.message);
    setForm({ name: '', phone: '', email: '', password: '' });
    notify(
      'Worker added',
      res.session
        ? 'They can log in now with that email and password.'
        : 'Supabase has emailed them a link. They must open it once, then they can log in.',
    );
    reload();
  };

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <SectionTitle right={<Badge label={`${present}/${workers.length} present`} tone="info" />}>Attendance</SectionTitle>
      <Field label="Date" value={day} onChangeText={setDay} placeholder="YYYY-MM-DD" />
      <View style={styles.listCard}>
        {workers.length ? (
          workers.map((w) => {
            const a = att.get(w.id);
            return (
              <View key={w.id} style={[styles.row, { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      {w.full_name || 'Worker'} {!w.active && <Text style={{ color: colors.danger }}>(inactive)</Text>}
                    </Text>
                    <Text style={styles.rowSub}>
                      In {time(a?.check_in ?? null)} · Out {time(a?.check_out ?? null)}
                      {w.phone ? ` · ${w.phone}` : ''}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {STATUSES.map((s) => (
                    <Chip key={s.value} label={s.label} active={a?.status === s.value} onPress={() => setStatus(w, s.value)} />
                  ))}
                </View>
              </View>
            );
          })
        ) : (
          <Text style={{ padding: 16, color: colors.muted }}>No workers yet. Add one below.</Text>
        )}
      </View>

      {waiting.length > 0 && (
        <>
          <SectionTitle>Waiting for access</SectionTitle>
          <View style={styles.listCard}>
            {waiting.map((p) => (
              <View key={p.id} style={[styles.row, { gap: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{p.full_name || 'New login'}</Text>
                  <Text style={styles.rowSub}>{p.phone || 'No phone'}</Text>
                </View>
                <Button small title="Make worker" onPress={() => setRole(p, { role: 'worker' })} />
              </View>
            ))}
          </View>
        </>
      )}

      <SectionTitle>Add worker</SectionTitle>
      <Card>
        <FieldRow>
          <Field label="Name *" value={form.name} onChangeText={set('name')} />
          <Field label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        </FieldRow>
        <FieldRow>
          <Field label="Email *" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
          <Field label="Password *" value={form.password} onChangeText={set('password')} secureTextEntry placeholder="6+ characters" />
        </FieldRow>
        <Button title="Create worker login" icon="person-add-outline" onPress={addWorker} loading={adding} />
        <Text style={{ color: colors.muted, fontSize: 13 }}>Give the worker this email and password. They log in on the same website.</Text>
      </Card>

      {workers.length > 0 && (
        <>
          <SectionTitle>Manage workers</SectionTitle>
          <View style={styles.listCard}>
            {workers.map((w) => (
              <ListRow
                key={w.id}
                title={w.full_name || 'Worker'}
                subtitle={w.active ? 'Can log in' : 'Blocked from logging in'}
                right={w.active ? 'Deactivate' : 'Reactivate'}
                onPress={async () => {
                  const msg = w.active ? 'They will lose access to the worker dashboard.' : 'They will get access again.';
                  if (await confirm(w.active ? 'Deactivate worker?' : 'Reactivate worker?', msg, 'OK')) setRole(w, { active: !w.active });
                }}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primary : colors.card,
      }}
    >
      <Text style={{ color: active ? colors.onPrimary : colors.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
