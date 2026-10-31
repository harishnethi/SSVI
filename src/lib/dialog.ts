import { Alert, Platform } from 'react-native';

// Phones use the native Alert. On the website, the browser's own window.alert/confirm pop-ups are
// blocked by some browsers and embedded views (confirm then silently returns false, so actions like
// Sign out did nothing), so the website shows an in-app dialog instead, drawn by <DialogHost />.

export interface DialogRequest {
  title: string;
  message?: string;
  okLabel: string;
  /** Show a Cancel button (confirm) or only OK (notify). */
  cancel: boolean;
  resolve: (ok: boolean) => void;
}

type Listener = (d: DialogRequest) => void;
let listener: Listener | null = null;

/** Called by DialogHost to receive dialogs to show. */
export function setDialogListener(l: Listener | null) {
  listener = l;
}

function show(title: string, message: string | undefined, okLabel: string, cancel: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    if (listener) listener({ title, message, okLabel, cancel, resolve });
    else resolve(cancel ? false : true);
  });
}

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') void show(title, message, 'OK', false);
  else Alert.alert(title, message);
}

export function confirm(title: string, message: string, okLabel = 'OK'): Promise<boolean> {
  if (Platform.OS === 'web') return show(title, message, okLabel, true);
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}
