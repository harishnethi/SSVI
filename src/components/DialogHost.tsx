import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { setDialogListener, type DialogRequest } from '@/lib/dialog';
import { H } from './Heading';
import { Button, colors, shadow } from './ui';

/** Shows the website's notify()/confirm() dialogs. Rendered once in the root layout. */
export function DialogHost() {
  const [queue, setQueue] = useState<DialogRequest[]>([]);

  useEffect(() => {
    setDialogListener((d) => setQueue((q) => [...q, d]));
    return () => setDialogListener(null);
  }, []);

  const current = queue[0];
  const close = (ok: boolean) => {
    current?.resolve(ok);
    setQueue((q) => q.slice(1));
  };

  return (
    <Modal visible={!!current} transparent animationType="fade" onRequestClose={() => close(false)}>
      <Pressable
        onPress={() => close(false)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 }}
      >
        {/* Inner Pressable stops taps on the card from closing it. */}
        <Pressable
          onPress={() => {}}
          accessibilityRole="alert"
          style={{ backgroundColor: colors.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 420, alignSelf: 'center', ...shadow }}
        >
          {current && (
            <>
              <H style={{ fontSize: 22, fontWeight: '700', color: colors.primary }}>{current.title}</H>
              {!!current.message && <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text, marginTop: 10 }}>{current.message}</Text>}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
                {current.cancel && <Button small title="Cancel" variant="secondary" onPress={() => close(false)} />}
                <Button
                  small
                  title={current.okLabel}
                  variant={current.cancel && /delete|cancel invoice|sign out|deactivate/i.test(current.okLabel) ? 'danger' : 'primary'}
                  onPress={() => close(true)}
                />
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
