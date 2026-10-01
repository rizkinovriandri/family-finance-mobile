import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type { RecurringTransactionFormValues } from '@/lib/validation/recurring-transaction';
import { toLocalISODate } from '@/lib/utils/date';

// Template transaksi berulang (tagihan/pemasukan rutin). MVP = reminder manual: app menampilkan
// jadwal yang sudah jatuh tempo, user "Catat" (buka form transaksi terprefill, bisa ubah nominal
// dulu) atau "Lewati" (majukan jadwal tanpa mencatat apa-apa) — tidak ada auto-post.

export type RecurringTransactionRow = Database['public']['Tables']['recurring_transactions']['Row'];
export type RecurringFrequency = RecurringTransactionRow['frequency'];

export type RecurringTransactionWithDetails = {
  id: string;
  type: 'Pemasukan' | 'Pengeluaran';
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  accountId: string;
  accountName: string;
  memberName: string;
  paymentMethod: RecurringTransactionRow['payment_method'];
  amount: number;
  description: string | null;
  notes: string | null;
  frequency: RecurringFrequency;
  nextDueDate: string;
  endDate: string | null;
  isActive: boolean;
};

type LookupMaps = {
  categoryById: Map<string, { name: string; icon: string | null }>;
  subcategoryNameById: Map<string, string>;
  accountNameById: Map<string, string>;
  memberNameById: Map<string, string>;
};

function toDetails(r: RecurringTransactionRow, maps: LookupMaps): RecurringTransactionWithDetails {
  return {
    id: r.id,
    type: r.type as 'Pemasukan' | 'Pengeluaran',
    categoryId: r.category_id,
    categoryName: maps.categoryById.get(r.category_id)?.name ?? 'Lainnya',
    categoryIcon: maps.categoryById.get(r.category_id)?.icon ?? null,
    subcategoryId: r.subcategory_id,
    subcategoryName: r.subcategory_id ? (maps.subcategoryNameById.get(r.subcategory_id) ?? null) : null,
    accountId: r.account_id,
    accountName: maps.accountNameById.get(r.account_id) ?? '-',
    memberName: maps.memberNameById.get(r.family_member_id) ?? '-',
    paymentMethod: r.payment_method,
    amount: r.amount,
    description: r.description,
    notes: r.notes,
    frequency: r.frequency,
    nextDueDate: r.next_due_date,
    endDate: r.end_date,
    isActive: r.is_active,
  };
}

async function loadLookupMaps(familyId: string): Promise<LookupMaps> {
  const [
    { data: categories, error: catError },
    { data: subcategories, error: subError },
    { data: accounts, error: accError },
    { data: members, error: memError },
  ] = await Promise.all([
    supabase.from('categories').select('id, name, icon'),
    supabase.from('subcategories').select('id, name').eq('family_id', familyId),
    supabase.from('accounts').select('id, name').eq('family_id', familyId),
    supabase.from('family_members').select('id, display_name').eq('family_id', familyId),
  ]);
  if (catError) throw catError;
  if (subError) throw subError;
  if (accError) throw accError;
  if (memError) throw memError;

  return {
    categoryById: new Map(categories.map((c) => [c.id, { name: c.name, icon: c.icon }])),
    subcategoryNameById: new Map(subcategories.map((s) => [s.id, s.name])),
    accountNameById: new Map(accounts.map((a) => [a.id, a.name])),
    memberNameById: new Map(members.map((m) => [m.id, m.display_name])),
  };
}

export async function listRecurringTransactions(familyId: string): Promise<RecurringTransactionWithDetails[]> {
  const [{ data: rows, error }, maps] = await Promise.all([
    supabase.from('recurring_transactions').select('*').eq('family_id', familyId).order('next_due_date'),
    loadLookupMaps(familyId),
  ]);
  if (error) throw error;
  return rows.map((r) => toDetails(r, maps));
}

// Jadwal aktif yang sudah jatuh tempo (next_due_date <= hari ini) — ditampilkan sebagai reminder
// di Beranda, diurut dari yang paling lama jatuh tempo.
export async function listDueRecurringTransactions(familyId: string): Promise<RecurringTransactionWithDetails[]> {
  const today = toLocalISODate(new Date());
  const [{ data: rows, error }, maps] = await Promise.all([
    supabase
      .from('recurring_transactions')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .lte('next_due_date', today)
      .order('next_due_date'),
    loadLookupMaps(familyId),
  ]);
  if (error) throw error;
  return rows.map((r) => toDetails(r, maps));
}

export async function getRecurringTransaction(id: string): Promise<RecurringTransactionRow> {
  const { data, error } = await supabase.from('recurring_transactions').select('*').eq('id', id).single();
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

export async function createRecurringTransaction(familyId: string, input: RecurringTransactionFormValues) {
  const userId = await requireUserId();
  const { error } = await supabase.from('recurring_transactions').insert({
    family_id: familyId,
    type: input.type,
    category_id: input.category_id,
    subcategory_id: input.subcategory_id || null,
    account_id: input.account_id,
    family_member_id: input.family_member_id,
    payment_method: input.payment_method,
    amount: input.amount,
    description: input.description || null,
    notes: input.notes || null,
    frequency: input.frequency,
    next_due_date: input.next_due_date,
    end_date: input.end_date || null,
    created_by: userId,
  });
  if (error) throw error;
}

export async function updateRecurringTransaction(id: string, input: RecurringTransactionFormValues) {
  const { error } = await supabase
    .from('recurring_transactions')
    .update({
      type: input.type,
      category_id: input.category_id,
      subcategory_id: input.subcategory_id || null,
      account_id: input.account_id,
      family_member_id: input.family_member_id,
      payment_method: input.payment_method,
      amount: input.amount,
      description: input.description || null,
      notes: input.notes || null,
      frequency: input.frequency,
      next_due_date: input.next_due_date,
      end_date: input.end_date || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteRecurringTransaction(id: string) {
  const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
  if (error) throw error;
}

export async function setRecurringActive(id: string, isActive: boolean) {
  const { error } = await supabase
    .from('recurring_transactions')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// Bulan dengan hari lebih sedikit (mis. 31 Jan + 1 bulan) di-clamp ke tanggal terakhir bulan
// tujuan, bukan overflow ke bulan berikutnya seperti kalau day-of-month dipertahankan apa adanya
// di constructor Date bawaan JS.
function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDayOfTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDayOfTarget));
  return target;
}

// Jadwal jatuh tempo berikutnya setelah satu kejadian dikonfirmasi/dilewati.
export function advanceDueDate(dateStr: string, frequency: RecurringFrequency): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (frequency === 'Harian') {
    date.setDate(date.getDate() + 1);
    return toLocalISODate(date);
  }
  if (frequency === 'Mingguan') {
    date.setDate(date.getDate() + 7);
    return toLocalISODate(date);
  }
  if (frequency === 'Bulanan') return toLocalISODate(addMonthsClamped(date, 1));
  return toLocalISODate(addMonthsClamped(date, 12)); // Tahunan
}

export type RecurringScheduleRef = {
  id: string;
  nextDueDate: string;
  frequency: RecurringFrequency;
  endDate: string | null;
};

// Majukan jadwal ke kejadian berikutnya — dipakai setelah "Catat" (transaksi sudah dibuat lewat
// form transaksi biasa, lihat transaction-form.tsx) maupun "Lewati" (tidak ada transaksi dibuat
// sama sekali). Kalau jadwal berikutnya sudah lewat tanggal berakhir, nonaktifkan otomatis.
export async function advanceRecurringSchedule(ref: RecurringScheduleRef) {
  const nextDueDate = advanceDueDate(ref.nextDueDate, ref.frequency);
  const isActive = !ref.endDate || nextDueDate <= ref.endDate;
  const { error } = await supabase
    .from('recurring_transactions')
    .update({ next_due_date: nextDueDate, is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', ref.id);
  if (error) throw error;
}
