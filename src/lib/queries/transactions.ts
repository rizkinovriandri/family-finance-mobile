import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type { TransactionFormValues, TransferFormValues } from '@/lib/validation/transaction';

// Mirror family-finance-app/lib/supabase/queries/transactions.ts (bagian list/CRUD/transfer).

export type TransactionRow = Database['public']['Tables']['transactions']['Row'];

export type TransactionWithDetails = {
  id: string;
  date: string;
  type: TransactionRow['type'];
  amount: number;
  description: string | null;
  notes: string | null;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  accountId: string;
  accountName: string;
  memberName: string;
  transferPairId: string | null;
};

export async function listTransactions(familyId: string): Promise<TransactionWithDetails[]> {
  const [
    { data: transactions, error },
    { data: categories, error: catError },
    { data: subcategories, error: subError },
    { data: accounts, error: accError },
    { data: members, error: memError },
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('family_id', familyId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name, icon'),
    supabase.from('subcategories').select('id, name').eq('family_id', familyId),
    supabase.from('accounts').select('id, name').eq('family_id', familyId),
    supabase.from('family_members').select('id, display_name').eq('family_id', familyId),
  ]);

  if (error) throw error;
  if (catError) throw catError;
  if (subError) throw subError;
  if (accError) throw accError;
  if (memError) throw memError;

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const subcategoryNameById = new Map(subcategories.map((s) => [s.id, s.name]));
  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));
  const memberNameById = new Map(members.map((m) => [m.id, m.display_name]));

  return transactions.map((t) => ({
    id: t.id,
    date: t.date,
    type: t.type,
    amount: t.amount,
    description: t.description,
    notes: t.notes,
    categoryId: t.category_id,
    categoryName: categoryById.get(t.category_id)?.name ?? 'Lainnya',
    categoryIcon: categoryById.get(t.category_id)?.icon ?? null,
    subcategoryId: t.subcategory_id,
    subcategoryName: t.subcategory_id ? (subcategoryNameById.get(t.subcategory_id) ?? null) : null,
    accountId: t.account_id,
    accountName: accountNameById.get(t.account_id) ?? '-',
    memberName: memberNameById.get(t.family_member_id) ?? '-',
    transferPairId: t.transfer_pair_id,
  }));
}

export async function getTransaction(id: string): Promise<TransactionRow> {
  const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

async function requireUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Belum login');
  return user.id;
}

export async function createTransaction(familyId: string, input: TransactionFormValues) {
  const userId = await requireUserId();

  const { error } = await supabase.from('transactions').insert({
    family_id: familyId,
    date: input.date,
    type: input.type,
    category_id: input.category_id,
    subcategory_id: input.subcategory_id || null,
    account_id: input.account_id,
    description: input.description || null,
    amount: input.amount,
    family_member_id: input.family_member_id,
    payment_method: input.payment_method,
    notes: input.notes || null,
    created_by: userId,
  });
  if (error) throw error;
}

export async function updateTransaction(id: string, input: TransactionFormValues) {
  const { error } = await supabase
    .from('transactions')
    .update({
      date: input.date,
      type: input.type,
      category_id: input.category_id,
      subcategory_id: input.subcategory_id || null,
      account_id: input.account_id,
      description: input.description || null,
      amount: input.amount,
      family_member_id: input.family_member_id,
      payment_method: input.payment_method,
      notes: input.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

// Transfer antar akun dihapus berpasangan — kedua sisi (keluar & masuk) harus hilang bersamaan.
export async function deleteTransaction(id: string, transferPairId: string | null) {
  const idsToDelete = transferPairId ? [id, transferPairId] : [id];
  const { error } = await supabase.from('transactions').delete().in('id', idsToDelete);
  if (error) throw error;
}

// Transfer dicatat sebagai 2 baris (Pengeluaran dari akun asal, Pemasukan ke akun tujuan)
// yang saling terhubung lewat transfer_pair_id — aturan bisnis CLAUDE.md Bagian 5.
// FK transfer_pair_id butuh baris lain sudah ada dulu, jadi baris "keluar" di-insert tanpa
// pair, baru di-link belakangan setelah baris "masuk" berhasil dibuat.
export async function createTransfer(familyId: string, input: TransferFormValues) {
  const userId = await requireUserId();

  const { data: transferCategory, error: catError } = await supabase
    .from('categories')
    .select('id')
    .eq('type', 'transfer')
    .limit(1)
    .maybeSingle();
  if (catError) throw catError;
  if (!transferCategory) throw new Error('Kategori Transfer Antar Akun tidak ditemukan');

  const outId = Crypto.randomUUID();
  const inId = Crypto.randomUUID();

  const { error: outError } = await supabase.from('transactions').insert({
    id: outId,
    family_id: familyId,
    date: input.date,
    type: 'Pengeluaran',
    category_id: transferCategory.id,
    account_id: input.from_account_id,
    description: 'Transfer keluar',
    amount: input.amount,
    family_member_id: input.family_member_id,
    payment_method: 'Transfer Bank',
    notes: input.notes || null,
    created_by: userId,
  });
  if (outError) throw outError;

  const { error: inError } = await supabase.from('transactions').insert({
    id: inId,
    family_id: familyId,
    date: input.date,
    type: 'Pemasukan',
    category_id: transferCategory.id,
    account_id: input.to_account_id,
    description: 'Transfer masuk',
    amount: input.amount,
    family_member_id: input.family_member_id,
    payment_method: 'Transfer Bank',
    notes: input.notes || null,
    transfer_pair_id: outId,
    created_by: userId,
  });
  if (inError) {
    await supabase.from('transactions').delete().eq('id', outId);
    throw inError;
  }

  const { error: linkError } = await supabase
    .from('transactions')
    .update({ transfer_pair_id: inId })
    .eq('id', outId);
  if (linkError) throw linkError;
}
