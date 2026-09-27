import AsyncStorage from '@react-native-async-storage/async-storage';

// Preferensi tampilan lokal per perangkat (bukan data keluarga) — disimpan di AsyncStorage,
// bukan Supabase, karena cuma soal "bagaimana aplikasi ini dibuka" di perangkat ini.
const DEFAULT_BALANCE_VISIBLE_KEY = 'pref:default-balance-visible';

// Menentukan apakah Total Saldo di Beranda tampil atau tersembunyi begitu aplikasi dibuka —
// diatur dari Lainnya -> Pengaturan. Default: tampil (perilaku sebelum ada pengaturan ini).
export async function getDefaultBalanceVisible(): Promise<boolean> {
  const value = await AsyncStorage.getItem(DEFAULT_BALANCE_VISIBLE_KEY);
  return value === null ? true : value === 'true';
}

export async function setDefaultBalanceVisible(visible: boolean): Promise<void> {
  await AsyncStorage.setItem(DEFAULT_BALANCE_VISIBLE_KEY, String(visible));
}
