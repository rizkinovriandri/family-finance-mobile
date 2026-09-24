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
