import { useState } from 'react';
import { Text, View } from 'react-native';
import { H } from '@/components/Heading';
import { UPCOMING_SELECT, UPCOMING_STATUSES, UpcomingOrders, type OrderWithItems } from '@/components/UpcomingOrders';
import { Button, colors, Empty, BrandGradient, IconTile, SectionTitle, Screen, styles } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { notify } from '@/lib/dialog';
import { qty, today } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Attendance, Product } from '@/lib/types';
import { must, useData } from '@/lib/useData';

const time = (t: string | null | undefined) => (t ? new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : null);

export default function WorkerToday() {
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useData(async () => {
    const [a, o, p] = await Promise.all([
      supabase.from('attendance').select('*').eq('worker_id', profile?.id ?? '').eq('work_date', today()).maybeSingle(),
      supabase
        .from('orders')
        .select(UPCOMING_SELECT)
        .in('status', UPCOMING_STATUSES)
        .order('delivery_date', { ascending: true, nullsFirst: false })
        .limit(8),
      supabase.from('products').select('*').order('name'),
    ]);
    return { attendance: must(a) as Attendance | null, orders: must(o) as OrderWithItems[], products: must(p) as Product[] };
  });

  const mark = async (action: 'in' | 'out') => {
    setBusy(true);
    const { error } = await supabase.rpc('mark_attendance', { action });
    setBusy(false);
    if (error) return notify('Could not save', error.message);
    reload();
  };

  if (!data) return <Empty text="" loading={loading} error={error} />;
  const a = data.attendance;
  const low = data.products.filter((p) => Number(p.stock) <= Number(p.low_stock));

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <BrandGradient tone="soft" style={[styles.card, { padding: 22 }]}>
        <H style={{ fontSize: 30, fontWeight: '700', color: colors.primary }}>Namaste{profile?.full_name ? `, ${profile.full_name}` : ''}</H>
        <Text style={{ fontSize: 15, color: colors.text, opacity: 0.7, marginTop: 2 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <View style={{ flexDirection: 'row', gap: 28, marginTop: 18 }}>
          <View>
            <Text style={{ color: colors.text, opacity: 0.75 }}>Checked in</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{time(a?.check_in) ?? '–'}</Text>
          </View>
          <View>
            <Text style={{ color: colors.text, opacity: 0.75 }}>Checked out</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{time(a?.check_out) ?? '–'}</Text>
          </View>
        </View>
        <View style={{ marginTop: 18 }}>
          {!a?.check_in ? (
            <Button title="Check in" icon="log-in-outline" onPress={() => mark('in')} loading={busy} />
          ) : !a.check_out ? (
            <Button title="Check out" icon="log-out-outline" onPress={() => mark('out')} loading={busy} />
          ) : (
            <Text style={{ color: colors.success, fontWeight: '700' }}>Done for today. Thank you!</Text>
          )}
        </View>
      </BrandGradient>

      <SectionTitle>Upcoming orders</SectionTitle>
      <UpcomingOrders orders={data.orders} empty="No orders waiting. 🎉" />

      {low.length > 0 && (
        <>
          <SectionTitle>Running low</SectionTitle>
          <View style={styles.listCard}>
            {low.map((p) => (
              <View key={p.id} style={[styles.row, { gap: 12 }]}>
                <IconTile name={p.kind === 'raw' ? 'leaf-outline' : 'cube-outline'} size={36} />
                <Text style={[styles.rowTitle, { flex: 1 }]}>{p.name}</Text>
                <Text style={{ color: colors.danger, fontWeight: '700' }}>
                  {qty(p.stock)} {p.unit}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
