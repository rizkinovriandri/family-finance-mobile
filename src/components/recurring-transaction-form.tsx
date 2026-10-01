import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { CategoryPicker } from '@/components/category-picker';
import { ChipPicker } from '@/components/chip-picker';
import { CurrencyField } from '@/components/currency-field';
import { DateField } from '@/components/date-field';
import { DropdownField } from '@/components/dropdown-field';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { PAYMENT_METHODS } from '@/constants/enums';
import { Spacing } from '@/constants/theme';
import type { LookupAccount, LookupMember } from '@/hooks/use-transaction-lookups';
import type { Category, Subcategory } from '@/lib/queries/categories';
import {
  createRecurringTransaction,
  updateRecurringTransaction,
  type RecurringTransactionRow,
} from '@/lib/queries/recurring-transactions';
import { toLocalISODate } from '@/lib/utils/date';
import { RECURRING_FREQUENCIES, recurringTransactionSchema } from '@/lib/validation/recurring-transaction';

type TxType = 'Pengeluaran' | 'Pemasukan';

const TX_TYPE_OPTIONS = [
  { value: 'Pengeluaran', label: 'Pengeluaran' },
  { value: 'Pemasukan', label: 'Pemasukan' },
];

const FREQUENCY_OPTIONS = RECURRING_FREQUENCIES.map((f) => ({ value: f, label: f }));

const END_DATE_OPTIONS = [
  { value: 'no', label: 'Tanpa batas' },
  { value: 'yes', label: 'Sampai tanggal tertentu' },
];

type RecurringTransactionFormProps = {
  familyId: string;
  accounts: readonly LookupAccount[];
  members: readonly LookupMember[];
  categories: readonly Category[];
  subcategories: readonly Subcategory[];
  defaultMemberId: string;
  defaultAccountId?: string;
  editing?: RecurringTransactionRow | null;
  onSaved: () => void;
};

// Form tambah/ubah template transaksi berulang — mirror transaction-form.tsx, tanpa Transfer
// (butuh 2 akun + transfer_pair_id, di luar scope) dan ditambah Frekuensi + jadwal jatuh tempo.
// Toggle Aktif/Nonaktif ada di layar daftar (recurring/index.tsx), bukan di form ini.
export function RecurringTransactionForm({
  familyId,
  accounts,
  members,
  categories,
  subcategories,
  defaultMemberId,
  defaultAccountId,
  editing,
  onSaved,
}: RecurringTransactionFormProps) {
  const [txType, setTxType] = useState<TxType>((editing?.type as TxType) ?? 'Pengeluaran');
  const [amount, setAmount] = useState(editing?.amount ?? 0);
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? '');
  const [subcategoryId, setSubcategoryId] = useState(editing?.subcategory_id ?? '');
  const [accountId, setAccountId] = useState(editing?.account_id ?? defaultAccountId ?? accounts[0]?.id ?? '');
  const [memberId, setMemberId] = useState(editing?.family_member_id ?? defaultMemberId);
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>(
    editing?.payment_method ?? 'Tunai'
  );
  const [frequency, setFrequency] = useState<(typeof RECURRING_FREQUENCIES)[number]>(
    editing?.frequency ?? 'Bulanan'
  );
  const [nextDueDate, setNextDueDate] = useState(editing?.next_due_date ?? toLocalISODate(new Date()));
  const [hasEndDate, setHasEndDate] = useState(Boolean(editing?.end_date));
  const [endDate, setEndDate] = useState(editing?.end_date ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const relevantCategories = categories.filter((c) => (txType === 'Pemasukan' ? c.type === 'income' : c.type === 'expense'));
  const relevantSubcategories = subcategories.filter((s) => s.categoryId === categoryId);
  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));
  const memberOptions = members.map((m) => ({ value: m.id, label: m.display_name }));

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    setSubcategoryId('');
  }

  function handleTypeChange(next: string) {
    setTxType(next as TxType);
    // Kategori pengeluaran & pemasukan berbeda — pilihan lama tidak berlaku lagi.
    setCategoryId('');
    setSubcategoryId('');
  }

  async function handleSubmit() {
    setFieldErrors({});
    setSubmitError(null);

    const result = recurringTransactionSchema.safeParse({
      type: txType,
      amount,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      account_id: accountId,
      family_member_id: memberId,
      payment_method: paymentMethod,
      frequency,
      next_due_date: nextDueDate,
      end_date: hasEndDate ? endDate : '',
      description,
      notes,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) errors[String(issue.path[0])] = issue.message;
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      if (editing) {
        await updateRecurringTransaction(editing.id, result.data);
      } else {
        await createRecurringTransaction(familyId, result.data);
      }
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi berulang.');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <ChipPicker label="Jenis" options={TX_TYPE_OPTIONS} value={txType} onChange={handleTypeChange} />

        <CurrencyField label="Jumlah" value={amount} onChange={setAmount} error={fieldErrors.amount} />

        <CategoryPicker
          label="Kategori"
          categories={relevantCategories}
          value={categoryId}
          onChange={handleCategoryChange}
          error={fieldErrors.category_id}
        />

        {relevantSubcategories.length > 0 && (
          <ChipPicker
            label="Sub kategori (opsional)"
            options={[{ value: '', label: 'Tanpa sub kategori' }, ...relevantSubcategories.map((s) => ({ value: s.id, label: s.name }))]}
            value={subcategoryId}
            onChange={setSubcategoryId}
          />
        )}

        <DropdownField
          label="Akun"
          options={accountOptions}
          value={accountId}
          onChange={setAccountId}
          error={fieldErrors.account_id}
        />

        <ChipPicker
          label="Metode pembayaran"
          options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
          value={paymentMethod}
          onChange={(v) => setPaymentMethod(v as (typeof PAYMENT_METHODS)[number])}
          error={fieldErrors.payment_method}
        />

        <TextField
          label="Deskripsi (opsional)"
          value={description}
          onChangeText={setDescription}
          placeholder="mis. Tagihan listrik"
        />

        <ChipPicker
          label="Anggota"
          options={memberOptions}
          value={memberId}
          onChange={setMemberId}
          error={fieldErrors.family_member_id}
        />

        <ChipPicker
          label="Frekuensi"
          options={FREQUENCY_OPTIONS}
          value={frequency}
          onChange={(v) => setFrequency(v as (typeof RECURRING_FREQUENCIES)[number])}
          error={fieldErrors.frequency}
        />

        <DateField label="Jatuh tempo berikutnya" value={nextDueDate} onChange={setNextDueDate} />

        <ChipPicker
          label="Berakhir"
          options={END_DATE_OPTIONS}
          value={hasEndDate ? 'yes' : 'no'}
          onChange={(v) => setHasEndDate(v === 'yes')}
        />
        {hasEndDate && (
          <DateField label="Tanggal berakhir" value={endDate || nextDueDate} onChange={setEndDate} />
        )}
        {fieldErrors.end_date && (
          <ThemedText type="small" themeColor="danger">
            {fieldErrors.end_date}
          </ThemedText>
        )}

        <TextField
          label="Catatan (opsional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Catatan tambahan..."
          multiline
        />

        {submitError && (
          <ThemedText type="small" themeColor="danger">
            {submitError}
          </ThemedText>
        )}

        <PrimaryButton label={loading ? 'Menyimpan...' : 'Simpan'} loading={loading} onPress={handleSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  form: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
