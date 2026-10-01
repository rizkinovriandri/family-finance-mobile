import { z } from 'zod';

import { PAYMENT_METHODS } from '@/constants/enums';

// Template transaksi berulang — bukan di family-finance-app (fitur baru, mobile-only untuk sekarang).
// Transfer Antar Akun sengaja tidak didukung (butuh 2 akun + transfer_pair_id, di luar scope).

export const RECURRING_FREQUENCIES = ['Harian', 'Mingguan', 'Bulanan', 'Tahunan'] as const;

function isValidLocalDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // Bandingkan komponen tanggal lokal — toISOString() memakai UTC dan menggeser hari di zona waktu
  // di depan UTC (mis. WIB), sehingga tanggal valid ikut ditolak.
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

const dateField = z
  .string()
  .min(1, 'Tanggal wajib diisi')
  .refine(isValidLocalDate, 'Format tanggal harus YYYY-MM-DD, mis. 2026-09-25');

const optionalDateField = z
  .string()
  .optional()
  .refine((value) => !value || isValidLocalDate(value), 'Format tanggal harus YYYY-MM-DD, mis. 2026-09-25');

export const recurringTransactionSchema = z
  .object({
    type: z.enum(['Pemasukan', 'Pengeluaran']),
    amount: z.number().positive('Jumlah harus lebih dari 0'),
    category_id: z.string().min(1, 'Pilih kategori'),
    subcategory_id: z.string().optional(),
    account_id: z.string().min(1, 'Pilih akun'),
    family_member_id: z.string().min(1, 'Pilih anggota keluarga'),
    payment_method: z.enum(PAYMENT_METHODS),
    frequency: z.enum(RECURRING_FREQUENCIES),
    next_due_date: dateField,
    end_date: optionalDateField,
    description: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((data) => !data.end_date || data.end_date >= data.next_due_date, {
    message: 'Tanggal berakhir harus setelah jatuh tempo berikutnya',
    path: ['end_date'],
  });

export type RecurringTransactionFormValues = z.infer<typeof recurringTransactionSchema>;
