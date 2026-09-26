// Supabase Auth mengembalikan pesan berbahasa Inggris — terjemahkan yang umum supaya UI tetap Bahasa Indonesia.
const TRANSLATIONS: [RegExp, string][] = [
  [/invalid login credentials/i, 'Email atau password salah.'],
  [/email not confirmed/i, 'Email belum dikonfirmasi. Cek kotak masuk emailmu.'],
  [/user already registered|already been registered/i, 'Email ini sudah terdaftar. Silakan masuk.'],
  [/password should be at least/i, 'Password minimal 6 karakter.'],
  [/unable to validate email|invalid format|invalid email/i, 'Format email tidak valid.'],
  [/rate limit|too many requests|after \d+ seconds/i, 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.'],
  [/network request failed|failed to fetch|network error/i, 'Tidak ada koneksi internet. Periksa jaringanmu.'],
];

export function translateAuthError(message: string) {
  return TRANSLATIONS.find(([pattern]) => pattern.test(message))?.[1] ?? message;
}
