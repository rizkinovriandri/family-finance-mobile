// Sentralisasi enum & pilihan dropdown — jangan hardcode ulang di komponen.
// Sumber: CLAUDE.md Bagian 5 (Daftar Enum), mirror dari family-finance-app/lib/constants/enums.ts.

export const ACCOUNT_TYPES = [
  'Tabungan',
  'Giro',
  'Deposito',
  'Investasi Saham',
  'Investasi Reksadana',
  'Investasi Obligasi',
  'Investasi Emas',
  'Investasi Kripto',
  'Dana Pensiun',
  'E-Wallet',
  'Kas Tunai',
  'Kartu Kredit',
  'Pinjaman/Utang',
  'Lainnya',
] as const;

// Kategori sistem untuk koreksi saldo — bukan pemasukan/pengeluaran sungguhan, jangan dihitung di ringkasan.
export const BALANCE_ADJUSTMENT_CATEGORY_NAME = 'Penyesuaian Saldo';

export const ACCOUNT_STATUSES = ['Aktif', 'Nonaktif', 'Ditutup'] as const;

export const CURRENCIES = ['IDR', 'USD', 'SGD', 'EUR', 'JPY'] as const;

// Akun bertipe "Investasi *" nilainya dihitung dari holding di Portofolio
// (investment_holdings, Fase 2), bukan dari saldo transaksi kas seperti akun biasa.
export function isInvestmentAccountType(accountType: string) {
  return accountType.startsWith('Investasi');
}

// Akun bertipe ini adalah utang, bukan aset — dikurangkan (bukan dijumlahkan)
// saat menghitung kekayaan bersih (net worth, Fase 2).
const LIABILITY_ACCOUNT_TYPES = new Set(['Kartu Kredit', 'Pinjaman/Utang']);

export function isLiabilityAccountType(accountType: string) {
  return LIABILITY_ACCOUNT_TYPES.has(accountType);
}

export const INVESTMENT_CATEGORIES = [
  { value: 'reksadana', label: 'Reksadana' },
  { value: 'obligasi_sukuk', label: 'Obligasi/Sukuk' },
  { value: 'saham', label: 'Saham' },
  { value: 'emas', label: 'Emas' },
] as const;

// Jenis akun investasi yang punya padanan langsung ke kategori
// investment_holdings (Bagian 4 CLAUDE.md). "Investasi Kripto" & "Dana
// Pensiun" sengaja tidak dipetakan — belum masuk 4 kategori holding.
const ACCOUNT_TYPE_TO_INVESTMENT_CATEGORY: Partial<
  Record<string, (typeof INVESTMENT_CATEGORIES)[number]['value']>
> = {
  'Investasi Saham': 'saham',
  'Investasi Reksadana': 'reksadana',
  'Investasi Obligasi': 'obligasi_sukuk',
  'Investasi Emas': 'emas',
};

export function getInvestmentCategoryForAccountType(accountType: string) {
  return ACCOUNT_TYPE_TO_INVESTMENT_CATEGORY[accountType] ?? null;
}

export const FUND_TYPES = ['Pasar Uang', 'Pendapatan Tetap', 'Campuran', 'Saham', 'Indeks'] as const;

export const BOND_TYPES = ['Obligasi Pemerintah', 'Obligasi Korporasi', 'Sukuk Ritel'] as const;

export const COUPON_FREQUENCIES = ['Bulanan', 'Triwulanan', 'Semesteran', 'Tahunan'] as const;

export const GOLD_TYPES = ['Fisik/Batangan', 'Digital/Tabungan Emas'] as const;

export const TRANSACTION_TYPES = ['Pemasukan', 'Pengeluaran', 'Transfer Antar Akun'] as const;

export const PAYMENT_METHODS = [
  'Tunai',
  'Transfer Bank',
  'Kartu Debit',
  'Kartu Kredit',
  'E-Wallet',
  'Autodebet',
  'Qris',
  'Lainnya',
] as const;

export const INCOME_CATEGORIES = [
  'Gaji',
  'Bonus/THR',
  'Hasil Investasi',
  'Hadiah/Pemberian',
  'Pendapatan Lainnya',
] as const;

export const EXPENSE_CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Tagihan & Utilitas',
  'Pendidikan',
  'Kesehatan',
  'Hiburan',
  'Belanja',
  'Cicilan/Utang',
  'Donasi/Sedekah',
  'Perawatan Rumah',
  'Pengeluaran Lainnya',
] as const;

// Gaya warna kategori. bright = warna solid tile ikon (glyph putih di atasnya) dan warna chart;
// enam warna pertama hasil sampling design/mockup.png layar 3 (Transaksi), sisanya senada.
// mutedBg = latar gelap untuk tile Tambah Cepat.
export const CATEGORY_STYLES: Record<string, { mutedBg: string; bright: string }> = {
  Gaji: { mutedBg: '#12332E', bright: '#60C9A2' },
  'Bonus/THR': { mutedBg: '#3A2A12', bright: '#FBB54C' },
  'Hasil Investasi': { mutedBg: '#0B2A4A', bright: '#6395F5' },
  'Hadiah/Pemberian': { mutedBg: '#3A1A2A', bright: '#F06FA0' },
  'Makanan & Minuman': { mutedBg: '#3A1620', bright: '#F78A7D' },
  Transportasi: { mutedBg: '#0B2A4A', bright: '#577EE7' },
  Belanja: { mutedBg: '#3A1620', bright: '#F87075' },
  Hiburan: { mutedBg: '#242150', bright: '#9C74F5' },
  'Tagihan & Utilitas': { mutedBg: '#3A2A12', bright: '#F6A054' },
  Kesehatan: { mutedBg: '#2E1F26', bright: '#F0554F' },
  Pendidikan: { mutedBg: '#12332E', bright: '#3ECFAE' },
  'Perawatan Rumah': { mutedBg: '#1E2938', bright: '#8896A8' },
  'Cicilan/Utang': { mutedBg: '#3A2A12', bright: '#F0A63E' },
  'Donasi/Sedekah': { mutedBg: '#3A1A2A', bright: '#D384F9' },
};

export const DEFAULT_CATEGORY_STYLE = { mutedBg: '#1E2938', bright: '#8896A8' };

export function getCategoryStyle(categoryName: string) {
  return CATEGORY_STYLES[categoryName] ?? DEFAULT_CATEGORY_STYLE;
}
