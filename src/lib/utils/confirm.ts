import { Alert, Platform } from 'react-native';

// Konfirmasi aksi destruktif. Alert.alert dengan tombol tidak jalan di react-native-web
// (dipakai untuk preview browser), jadi web pakai window.confirm.
export function confirmDestructive(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Batal', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

// Konfirmasi aksi biasa (bukan destruktif) — tombol konfirmasi tidak berwarna merah.
export function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Batal', style: 'cancel' },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}

// Pemberitahuan singkat; Alert.alert dengan pesan saja tetap jalan di web lewat window.alert.
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
