import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetForm } from '@/components/budget-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useFamily } from '@/lib/family-context';
import { getBudget, listBudgetsForMonth, type BudgetWithRealization } from '@/lib/queries/budgets';
import { listCategories, listSubcategories, type Category, type Subcategory } from '@/lib/queries/categories';
import { getCycleStart } from '@/lib/utils/date';

type BudgetFormScreenProps = {
  // Diisi saat mengubah anggaran; kosong = buat baru.
  budgetId?: string;
  // Awal siklus bulan (YYYY-MM-DD) tempat anggaran baru dibuat.
  month?: string;
};

type Loaded = {
  categories: Category[];
  subcategories: Subcategory[];
  budgets: BudgetWithRealization[];
  monthDate: Date;
  editing: BudgetWithRealization | null;
};

// Layar penuh form buat/ubah anggaran — dipakai oleh budget/new dan budget/[id].
export function BudgetFormScreen({ budgetId, month }: BudgetFormScreenProps) {
  const { membership } = useFamily();
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!membership) return;
    let cancelled = false;

    async function load() {
      if (!membership) return;
      // Saat mengubah, bulan ditentukan dari anggaran itu sendiri; saat membuat, dari parameter.
      const monthDate = budgetId
        ? new Date(`${(await getBudget(budgetId)).month}T00:00:00`)
        : month
          ? new Date(`${month}T00:00:00`)
          : getCycleStart(new Date(), membership.month_start_day);

      const [categories, subcategories, budgets] = await Promise.all([
        listCategories(),
        listSubcategories(membership.family_id),
        listBudgetsForMonth(membership.family_id, monthDate, membership.month_start_day),
      ]);
      if (cancelled) return;
      setData({
        categories,
        subcategories,
        budgets,
        monthDate,
        editing: budgetId ? (budgets.find((b) => b.id === budgetId) ?? null) : null,
      });
    }

    load().catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat data anggaran.');
    });
    return () => {
      cancelled = true;
    };
  }, [membership, budgetId, month]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="smallBold" themeColor="accent">
              Batal
            </ThemedText>
          </Pressable>
          <ThemedText type="smallBold">{budgetId ? 'Ubah Anggaran' : 'Buat Anggaran Baru'}</ThemedText>
          <ThemedView style={styles.headerSpacer} />
        </ThemedView>

        {error ? (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        ) : !data || !membership ? (
          <ActivityIndicator style={styles.loading} />
        ) : budgetId && !data.editing ? (
          <ThemedText type="small" themeColor="danger">
            Anggaran tidak ditemukan.
          </ThemedText>
        ) : (
          <BudgetForm
            familyId={membership.family_id}
            monthDate={data.monthDate}
            monthStartDay={membership.month_start_day}
            categories={data.categories}
            subcategories={data.subcategories}
            budgets={data.budgets}
            editing={data.editing}
            onSaved={() => router.back()}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 40,
  },
  loading: {
    marginTop: Spacing.five,
  },
});
