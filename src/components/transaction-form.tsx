import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { CategoryPicker } from '@/components/category-picker';
import { ChipPicker } from '@/components/chip-picker';
import { CurrencyField } from '@/components/currency-field';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { PAYMENT_METHODS } from '@/constants/enums';
import { Spacing } from '@/constants/theme';
import type { LookupAccount, LookupMember } from '@/hooks/use-transaction-lookups';
import type { Category, Subcategory } from '@/lib/queries/categories';
import {
  createTransaction,
  createTransfer,
  updateTransaction,
  type TransactionRow,
} from '@/lib/queries/transactions';
import { toLocalISODate } from '@/lib/utils/date';
import { transactionSchema, transferSchema } from '@/lib/validation/transaction';

export type TxType = 'Pengeluaran' | 'Pemasukan' | 'Transfer';

const TX_TYPE_OPTIONS = [
  { value: 'Pengeluaran', label: 'Pengeluaran' },
  { value: 'Pemasukan', label: 'Pemasukan' },
  { value: 'Transfer', label: 'Transfer' },
];

type TransactionFormProps = {
  familyId: string;
  accounts: readonly LookupAccount[];
  members: readonly LookupMember[];
  categories: readonly Category[];
  subcategories: readonly Subcategory[];
  defaultMemberId: string;
  defaultAccountId?: string;
  editing?: TransactionRow | null;
  initialType?: TxType;
  initialCategoryId?: string;
  onSaved: () => void;
};

function shiftDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

// Form tambah/ubah transaksi — mirror family-finance-app/components/TransactionForm.tsx
// (tanpa Scan Struk, yang butuh route server dan menyusul di fase berikutnya).
export function TransactionForm({
  familyId,
  accounts,
  members,
  categories,
  subcategories,
  defaultMemberId,
  defaultAccountId,
  editing,
  initialType,
  initialCategoryId,
  onSaved,
}: TransactionFormProps) {
  const [txType, setTxType] = useState<TxType>(editing ? (editing.type as TxType) : (initialType ?? 'Pengeluaran'));
  const [amount, setAmount] = useState(editing?.amount ?? 0);
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? initialCategoryId ?? '');
  const [subcategoryId, setSubcategoryId] = useState(editing?.subcategory_id ?? '');
  const [accountId, setAccountId] = useState(editing?.account_id ?? defaultAccountId ?? accounts[0]?.id ?? '');
  const [fromAccountId, setFromAccountId] = useState(defaultAccountId ?? accounts[0]?.id ?? '');
  const [toAccountId, setToAccountId] = useState(
    accounts.find((a) => a.id !== (defaultAccountId ?? accounts[0]?.id))?.id ?? accounts[0]?.id ?? ''
  );
  const [memberId, setMemberId] = useState(editing?.family_member_id ?? defaultMemberId);
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>(
    editing?.payment_method ?? 'Tunai'
  );
  const [date, setDate] = useState(editing?.date ?? toLocalISODate(new Date()));
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

    if (txType === 'Transfer') {
      const result = transferSchema.safeParse({
        amount,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        family_member_id: memberId,
        date,
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
        await createTransfer(familyId, result.data);
        onSaved();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Gagal menyimpan transfer.');
        setLoading(false);
      }
      return;
    }

    const result = transactionSchema.safeParse({
      type: txType,
      amount,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      account_id: accountId,
      family_member_id: memberId,
      payment_method: paymentMethod,
      date,
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
        await updateTransaction(editing.id, result.data);
      } else {
        await createTransaction(familyId, result.data);
      }
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi.');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {!editing && <ChipPicker label="Jenis" options={TX_TYPE_OPTIONS} value={txType} onChange={handleTypeChange} />}

        <CurrencyField label="Jumlah" value={amount} onChange={setAmount} error={fieldErrors.amount} />

        {txType === 'Transfer' ? (
          <>
            <ChipPicker
              label="Dari akun"
              options={accountOptions}
              value={fromAccountId}
              onChange={setFromAccountId}
              error={fieldErrors.from_account_id}
            />
            <ChipPicker
              label="Ke akun"
              options={accountOptions}
              value={toAccountId}
              onChange={setToAccountId}
              error={fieldErrors.to_account_id}
            />
          </>
        ) : (
          <>
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

            <ChipPicker
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
              placeholder="mis. Makan siang"
            />
          </>
        )}

        <ChipPicker
          label="Anggota"
          options={memberOptions}
          value={memberId}
          onChange={setMemberId}
          error={fieldErrors.family_member_id}
        />

        <TextField
          label="Tanggal (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          placeholder="2026-09-25"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <ChipPicker
          options={[
            { value: toLocalISODate(new Date()), label: 'Hari ini' },
            { value: shiftDays(-1), label: 'Kemarin' },
          ]}
          value={date}
          onChange={setDate}
          error={fieldErrors.date}
        />

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
