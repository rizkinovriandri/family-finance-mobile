import { z } from 'zod';

import { PAYMENT_METHODS } from '@/constants/enums';

// Mirror family-finance-app/lib/validation/transaction.ts.

const dateField = z
  .string()
  .min(1, 'Tanggal wajib diisi')
  .refine((value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    // Bandingkan komponen tanggal lokal — toISOString() memakai UTC dan menggeser hari di zona waktu
    // di depan UTC (mis. WIB), sehingga tanggal valid ikut ditolak.
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }, 'Format tanggal harus YYYY-MM-DD, mis. 2026-09-25');

export const transactionSchema = z.object({
  type: z.enum(['Pemasukan', 'Pengeluaran']),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  category_id: z.string().min(1, 'Pilih kategori'),
  subcategory_id: z.string().optional(),
  account_id: z.string().min(1, 'Pilih akun'),
  family_member_id: z.string().min(1, 'Pilih anggota keluarga'),
  payment_method: z.enum(PAYMENT_METHODS),
  date: dateField,
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const transferSchema = z
  .object({
    amount: z.number().positive('Jumlah harus lebih dari 0'),
    from_account_id: z.string().min(1, 'Pilih akun asal'),
    to_account_id: z.string().min(1, 'Pilih akun tujuan'),
    family_member_id: z.string().min(1, 'Pilih anggota keluarga'),
    date: dateField,
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.from_account_id !== data.to_account_id, {
    message: 'Akun asal dan tujuan tidak boleh sama',
    path: ['to_account_id'],
  });

export type TransferFormValues = z.infer<typeof transferSchema>;
