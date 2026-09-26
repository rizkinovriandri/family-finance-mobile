import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { CategoryPicker } from '@/components/category-picker';
import { ChipPicker } from '@/components/chip-picker';
import { CurrencyField } from '@/components/currency-field';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  budgetKey,
  createBudget,
  updateBudget,
  type BudgetWithRealization,
} from '@/lib/queries/budgets';
import type { Category, Subcategory } from '@/lib/queries/categories';
import { budgetSchema } from '@/lib/validation/budget';

const CATEGORY_LEVEL_OPTION_ID = '';
const CATEGORY_LEVEL_LABEL = 'Kategori Utama (semua sub kategori)';

type BudgetFormProps = {
  familyId: string;
  monthDate: Date;
  monthStartDay: number;
  categories: readonly Category[];
  subcategories: readonly Subcategory[];
  // Semua anggaran di bulan ini — dipakai untuk menyembunyikan kategori/rincian yang sudah dianggarkan.
  budgets: readonly BudgetWithRealization[];
  editing?: BudgetWithRealization | null;
  onSaved: () => void;
};

// Form buat/ubah anggaran — mirror modal di family-finance-app/components/BudgetsManager.tsx.
export function BudgetForm({
  familyId,
  monthDate,
  monthStartDay,
  categories,
  subcategories,
  budgets,
  editing,
  onSaved,
}: BudgetFormProps) {
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Budget yang lagi diedit dikecualikan dari daftar "sudah dipakai" supaya rincian yang sedang
  // dipakainya sendiri tetap muncul sebagai pilihan.
  const budgetedKeys = new Set(
    budgets.filter((b) => b.id !== editing?.id).map((b) => budgetKey(b.categoryId, b.subcategoryId))
  );

  // Kategori masih tersedia untuk dibuatkan anggaran baru selama masih ada slot kosong — level
  // kategori (roll-up semua sub kategori) atau salah satu sub kategorinya.
  const availableCategories = expenseCategories.filter((c) => {
    const totalSlots = 1 + subcategories.filter((s) => s.categoryId === c.id).length;
    const usedSlots = budgets.filter((b) => b.categoryId === c.id).length;
    return usedSlots < totalSlots;
  });

  function rincianOptionsFor(categoryId: string) {
    return [
      { value: CATEGORY_LEVEL_OPTION_ID, label: CATEGORY_LEVEL_LABEL },
      ...subcategories.filter((s) => s.categoryId === categoryId).map((s) => ({ value: s.id, label: s.name })),
    ].filter((opt) => !budgetedKeys.has(budgetKey(categoryId, opt.value || null)));
  }

  const initialCategoryId = editing?.categoryId ?? availableCategories[0]?.id ?? '';
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [subcategoryId, setSubcategoryId] = useState(
    editing ? (editing.subcategoryId ?? CATEGORY_LEVEL_OPTION_ID) : (rincianOptionsFor(initialCategoryId)[0]?.value ?? CATEGORY_LEVEL_OPTION_ID)
  );
  const [targetAmount, setTargetAmount] = useState(editing?.targetAmount ?? 0);
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rincianOptions = rincianOptionsFor(categoryId);

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    setSubcategoryId(rincianOptionsFor(id)[0]?.value ?? CATEGORY_LEVEL_OPTION_ID);
  }

  async function handleSubmit() {
    const result = budgetSchema.safeParse({
      category_id: categoryId,
      subcategory_id: subcategoryId,
      target_amount: targetAmount,
      notes,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) errors[String(issue.path[0])] = issue.message;
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setLoading(true);
    try {
      if (editing) {
        await updateBudget(editing.id, result.data);
      } else {
        await createBudget(familyId, monthDate, result.data, monthStartDay);
      }
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal menyimpan anggaran.');
      setLoading(false);
    }
  }

  if (!editing && availableCategories.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Semua kategori sudah punya anggaran di bulan ini.
      </ThemedText>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {editing ? (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Kategori
            </ThemedText>
            <ThemedText type="default">{editing.categoryName}</ThemedText>
          </>
        ) : (
          <CategoryPicker
            label="Kategori"
            categories={availableCategories}
            value={categoryId}
            onChange={handleCategoryChange}
            error={fieldErrors.category_id}
          />
        )}

        {rincianOptions.length > 1 && (
          <ChipPicker label="Rincian" options={rincianOptions} value={subcategoryId} onChange={setSubcategoryId} />
        )}

        <CurrencyField
          label="Target bulanan"
          value={targetAmount}
          onChange={setTargetAmount}
          error={fieldErrors.target_amount}
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
