import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/category-icon';
import { DonutChart, type DonutSlice } from '@/components/donut-chart';
import { IconChevronLeft, IconChevronRight, IconCopy } from '@/components/icons';
import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategoryStyle } from '@/constants/enums';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useRealtimeTick } from '@/hooks/use-realtime-tick';
import { useTheme } from '@/hooks/use-theme';
import { useFamily } from '@/lib/family-context';
import {
  deleteBudget,
  duplicateBudgetsToNextMonth,
  listBudgetsForMonth,
  listUnbudgetedExpenses,
  statusFor,
  type BudgetStatus,
  type BudgetWithRealization,
  type UnbudgetedExpense,
} from '@/lib/queries/budgets';
import { listCategories, listSubcategories, type Category, type Subcategory } from '@/lib/queries/categories';
import { confirmAction, confirmDestructive, notify } from '@/lib/utils/confirm';
import { formatCurrency } from '@/lib/utils/currency';
import { formatCycleLabel, formatShortDate, getCycleStart, shiftCycle, toLocalISODate } from '@/lib/utils/date';

const VISIBLE_CATEGORY_COUNT = 4;
const VISIBLE_UNBUDGETED_COUNT = 5;

function money(amount: number) {
  return formatCurrency(amount, 'IDR');
}

export default function BudgetScreen() {
  const theme = useTheme();
  const { membership } = useFamily();
  const reloadTick = useRealtimeTick(['budgets', 'transactions', 'categories', 'subcategories', 'accounts'], membership?.family_id);
  const monthStartDay = membership?.month_start_day ?? 1;

  // Selisih bulan dari siklus berjalan (0 = bulan ini). Disimpan sebagai angka supaya `activeMonth`
  // stabil antar render — objek Date baru tiap render akan memicu useFocusEffect terus-menerus.
  const [monthOffset, setMonthOffset] = useState(0);
  const [budgets, setBudgets] = useState<BudgetWithRealization[] | null>(null);
  const [unbudgeted, setUnbudgeted] = useState<UnbudgetedExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllUnbudgeted, setShowAllUnbudgeted] = useState(false);

  const activeMonth = useMemo(
    () => shiftCycle(getCycleStart(new Date(), monthStartDay), monthOffset),
    [monthStartDay, monthOffset]
  );
  const monthLabel = formatCycleLabel(activeMonth, monthStartDay);

  const load = useCallback(
    async (date: Date) => {
      if (!membership) return;
      try {
        const [budgetList, unbudgetedList, categoryList, subcategoryList] = await Promise.all([
          listBudgetsForMonth(membership.family_id, date, membership.month_start_day),
          listUnbudgetedExpenses(membership.family_id, date, membership.month_start_day),
          listCategories(),
          listSubcategories(membership.family_id),
        ]);
        setBudgets(budgetList);
        setUnbudgeted(unbudgetedList);
        setCategories(categoryList);
        setSubcategories(subcategoryList);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat anggaran.');
      }
    },
    [membership]
  );

  // Refetch tiap kali tab ini kembali fokus (mis. balik dari layar buat/ubah anggaran) atau bulan berganti.
  useFocusEffect(
    useCallback(() => {
      load(activeMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadTick sengaja jadi dependency: naik saat ada perubahan realtime, memicu muat ulang
    }, [load, activeMonth, reloadTick])
  );

  // Kategori ditampilkan sebagai satu baris induk (ringkasan); rincian tiap anggaran (level kategori
  // "Kategori Utama" + tiap sub kategori) baru muncul saat di-expand. Kalau ada anggaran level
  // kategori, ringkasan pakai nilai itu langsung (realisasinya sudah roll-up semua sub kategori —
  // lihat view budget_realizations); kalau tidak, dijumlah dari semua anggaran sub kategorinya.
  const categoryGroups = useMemo(() => {
    const byCategory = new Map<string, BudgetWithRealization[]>();
    for (const b of budgets ?? []) {
      const list = byCategory.get(b.categoryId) ?? [];
      list.push(b);
      byCategory.set(b.categoryId, list);
    }

    return Array.from(byCategory.entries())
      .map(([categoryId, entries]) => {
        const categoryLevel = entries.find((e) => e.subcategoryId === null);
        const summaryTarget = categoryLevel
          ? categoryLevel.targetAmount
          : entries.reduce((sum, e) => sum + e.targetAmount, 0);
        const summaryRealisasi = categoryLevel
          ? categoryLevel.realisasi
          : entries.reduce((sum, e) => sum + e.realisasi, 0);
        const summaryPercentage = summaryTarget > 0 ? Math.round((summaryRealisasi / summaryTarget) * 100) : 0;

        const sortedEntries = [...entries].sort((a, b) => {
          if (a.subcategoryId === null) return -1;
          if (b.subcategoryId === null) return 1;
          return (a.subcategoryName ?? '').localeCompare(b.subcategoryName ?? '');
        });

        return {
          categoryId,
          categoryName: entries[0].categoryName,
          categoryIcon: entries[0].categoryIcon,
          entries: sortedEntries,
          summaryTarget,
          summaryRealisasi,
          summaryPercentage,
          summaryStatus: statusFor(summaryPercentage),
        };
      })
      .sort((a, b) => b.summaryPercentage - a.summaryPercentage);
  }, [budgets]);

  const totalTarget = categoryGroups.reduce((sum, g) => sum + g.summaryTarget, 0);
  const totalRealisasi = categoryGroups.reduce((sum, g) => sum + g.summaryRealisasi, 0);
  const overallPercentage = totalTarget > 0 ? Math.round((totalRealisasi / totalTarget) * 100) : 0;

  // Proporsi realisasi antar kategori (bukan proporsi target) — sama seperti donut di Beranda.
  const donutSlices: DonutSlice[] = categoryGroups
    .filter((g) => g.summaryRealisasi > 0)
    .map((g) => ({
      key: g.categoryId,
      label: g.categoryName,
      amount: g.summaryRealisasi,
      percentage: totalRealisasi > 0 ? Math.round((g.summaryRealisasi / totalRealisasi) * 100) : 0,
      color: getCategoryStyle(g.categoryName).bright,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const totalUnbudgeted = unbudgeted.reduce((sum, t) => sum + t.amount, 0);
  const visibleUnbudgeted = showAllUnbudgeted ? unbudgeted : unbudgeted.slice(0, VISIBLE_UNBUDGETED_COUNT);

  const visibleGroups = showAllCategories ? categoryGroups : categoryGroups.slice(0, VISIBLE_CATEGORY_COUNT);

  // Tombol tambah hanya muncul selama masih ada slot kosong (level kategori atau sub kategori).
  const canAddBudget = categories
    .filter((c) => c.type === 'expense')
    .some((c) => {
      const totalSlots = 1 + subcategories.filter((s) => s.categoryId === c.id).length;
      const usedSlots = (budgets ?? []).filter((b) => b.categoryId === c.id).length;
      return usedSlots < totalSlots;
    });

  function shiftMonth(delta: number) {
    setMonthOffset((prev) => prev + delta);
    setExpandedCategoryId(null);
    setBudgets(null);
  }

  function handleDuplicate() {
    if (!membership || !budgets || budgets.length === 0 || duplicating) return;
    const nextMonthDate = shiftCycle(activeMonth, 1);
    const nextMonthLabel = formatCycleLabel(nextMonthDate, monthStartDay);

    confirmAction(
      'Duplikasi anggaran',
      `Duplikasi ${budgets.length} anggaran ke ${nextMonthLabel}? Kategori yang sudah punya anggaran di bulan itu akan dilewati.`,
      'Duplikasi',
      async () => {
        setDuplicating(true);
        try {
          const result = await duplicateBudgetsToNextMonth(membership.family_id, activeMonth, monthStartDay);
          setMonthOffset((prev) => prev + 1);
          setExpandedCategoryId(null);
          setBudgets(null);

          if (result.inserted === 0) {
            notify('Duplikasi anggaran', `Semua kategori sudah punya anggaran di ${nextMonthLabel}.`);
          } else if (result.skipped > 0) {
            notify(
              'Duplikasi anggaran',
              `${result.inserted} anggaran diduplikasi ke ${nextMonthLabel}, ${result.skipped} dilewati (sudah ada).`
            );
          }
        } catch (err) {
          notify('Gagal', err instanceof Error ? err.message : 'Gagal menduplikasi anggaran.');
        } finally {
          setDuplicating(false);
        }
      }
    );
  }

  function handleDelete(id: string) {
    confirmDestructive('Hapus anggaran', 'Hapus anggaran ini?', 'Hapus', async () => {
      try {
        await deleteBudget(id);
        // Kategori yang anggarannya dihapus ikut masuk ke "Di Luar Budget", jadi muat ulang semuanya.
        await load(activeMonth);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal menghapus anggaran.');
      }
    });
  }

  function statusColors(status: BudgetStatus) {
    const color = status === 'Aman' ? theme.success : status === 'Waspada' ? theme.accent : theme.danger;
    // Latar pill = warna status pada opasitas ±15% (suffix alpha hex "26").
    return { color, backgroundColor: `${color}26` };
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Budget
          </ThemedText>
          {canAddBudget && (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/budget/new', params: { month: toLocalISODate(activeMonth) } })
              }>
              <ThemedText type="smallBold" themeColor="accent">
                + Tambah
              </ThemedText>
            </Pressable>
          )}
        </ThemedView>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.monthNav, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Pressable onPress={() => shiftMonth(-1)} hitSlop={8} accessibilityLabel="Bulan sebelumnya">
              <IconChevronLeft size={20} color={theme.textSecondary} />
            </Pressable>
            <ThemedText type="smallBold">{monthLabel}</ThemedText>
            <Pressable onPress={() => shiftMonth(1)} hitSlop={8} accessibilityLabel="Bulan berikutnya">
              <IconChevronRight size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          {budgets === null && !error ? (
            <ActivityIndicator style={styles.loading} />
          ) : budgets && budgets.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              Belum ada anggaran bulan ini.
            </ThemedText>
          ) : budgets ? (
            <>
              <Pressable onPress={handleDuplicate} disabled={duplicating} style={styles.duplicate}>
                <IconCopy size={16} color={theme.accent} />
                <ThemedText type="small" themeColor="accent">
                  {duplicating ? 'Menduplikasi...' : 'Duplikasi ke bulan berikutnya'}
                </ThemedText>
              </Pressable>

              <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
                <View style={styles.summaryTop}>
                  <View>
                    <ThemedText type="small" themeColor="textSecondary">
                      Total Anggaran
                    </ThemedText>
                    <ThemedText type="subtitle" style={styles.summaryAmount}>
                      {money(totalTarget)}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRight}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Terpakai
                    </ThemedText>
                    <ThemedText type="smallBold" style={styles.summaryPercent}>
                      {overallPercentage}%
                    </ThemedText>
                  </View>
                </View>
                <ProgressBar percentage={overallPercentage} color={theme.accent} height={8} />
                <ThemedText type="small" themeColor="textSecondary">
                  {money(totalRealisasi)} / {money(totalTarget)}
                </ThemedText>
              </ThemedView>

              <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
                <DonutChart slices={donutSlices} total={totalRealisasi} centerPercentage={overallPercentage} />
              </ThemedView>

              <View style={styles.sectionHeader}>
                <ThemedText type="smallBold">Kategori Budget</ThemedText>
                {categoryGroups.length > VISIBLE_CATEGORY_COUNT && (
                  <Pressable onPress={() => setShowAllCategories((prev) => !prev)}>
                    <ThemedText type="small" themeColor="accent">
                      {showAllCategories ? 'Sembunyikan' : 'Lihat Semua'}
                    </ThemedText>
                  </Pressable>
                )}
              </View>

              {/* Semua kategori digabung dalam satu kartu, dipisah garis tipis — tanpa margin antar item. */}
              <ThemedView type="backgroundElement" style={[styles.groupList, { borderColor: theme.border }]}>
                {visibleGroups.map((g, index) => {
                  const expanded = expandedCategoryId === g.categoryId;
                  const overBudget = g.summaryStatus === 'Melebihi';
                  return (
                    <View
                      key={g.categoryId}
                      style={[styles.groupItem, index > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
                      <Pressable
                        onPress={() => setExpandedCategoryId((prev) => (prev === g.categoryId ? null : g.categoryId))}
                        style={styles.groupHeader}>
                        <CategoryIcon name={g.categoryName} icon={g.categoryIcon} variant="lg" />
                        <View style={styles.groupBody}>
                          <View style={styles.groupTopRow}>
                            <View style={styles.groupTitleBlock}>
                              <ThemedText type="smallBold" numberOfLines={1}>
                                {g.categoryName}
                              </ThemedText>
                              <ThemedText type="small" themeColor="textSecondary">
                                {money(g.summaryRealisasi)} / {money(g.summaryTarget)}
                              </ThemedText>
                            </View>
                            <ThemedText type="smallBold" themeColor={overBudget ? 'danger' : undefined}>
                              {g.summaryPercentage}%
                            </ThemedText>
                            <View style={expanded ? styles.chevronExpanded : undefined}>
                              <IconChevronRight size={16} color={theme.textSecondary} />
                            </View>
                          </View>
                          <ProgressBar
                            percentage={g.summaryPercentage}
                            color={overBudget ? theme.danger : theme.success}
                          />
                        </View>
                      </Pressable>

                      {expanded && (
                        <View style={[styles.entries, { borderTopColor: theme.border }]}>
                          {g.entries.map((b) => {
                            const colors = statusColors(b.status);
                            return (
                              <View key={b.id} style={styles.entry}>
                                <View style={styles.entryTop}>
                                  <ThemedText type="small" numberOfLines={1} style={styles.entryName}>
                                    {b.subcategoryName ?? 'Kategori Utama'}
                                  </ThemedText>
                                  <View style={[styles.statusPill, { backgroundColor: colors.backgroundColor }]}>
                                    <ThemedText style={[styles.statusText, { color: colors.color }]}>{b.status}</ThemedText>
                                  </View>
                                </View>
                                <ThemedText type="small" themeColor="textSecondary">
                                  {money(b.realisasi)} / {money(b.targetAmount)}
                                </ThemedText>
                                <ProgressBar
                                  percentage={b.percentage}
                                  color={b.status === 'Melebihi' ? theme.danger : theme.success}
                                  height={4}
                                />
                                <View style={styles.entryActions}>
                                  <Pressable
                                    onPress={() => router.push({ pathname: '/budget/[id]', params: { id: b.id } })}
                                    hitSlop={8}>
                                    <ThemedText type="small" themeColor="accent">
                                      Ubah
                                    </ThemedText>
                                  </Pressable>
                                  <Pressable onPress={() => handleDelete(b.id)} hitSlop={8}>
                                    <ThemedText type="small" themeColor="danger">
                                      Hapus
                                    </ThemedText>
                                  </Pressable>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </ThemedView>
            </>
          ) : null}

          {/* Di luar ternary di atas: tetap tampil walau belum ada satu pun anggaran (semua pengeluaran
              otomatis "di luar budget"), sama seperti web. */}
          {budgets !== null && unbudgeted.length > 0 && (
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <View style={styles.unbudgetedHeader}>
                <View style={styles.unbudgetedTitleBlock}>
                  <ThemedText type="smallBold">Di Luar Budget</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Pengeluaran bulan ini yang kategorinya belum dianggarkan
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" themeColor="danger">
                  {money(totalUnbudgeted)}
                </ThemedText>
              </View>

              <View style={styles.unbudgetedList}>
                {visibleUnbudgeted.map((t) => (
                  <View key={t.id} style={styles.unbudgetedRow}>
                    <CategoryIcon name={t.categoryName} icon={t.categoryIcon} />
                    <View style={styles.unbudgetedBody}>
                      <ThemedText type="small" numberOfLines={1}>
                        {t.categoryName}
                        {t.subcategoryName ? ` · ${t.subcategoryName}` : ''}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {t.description || t.accountName} · {formatShortDate(t.date)}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold" themeColor="danger">
                      {money(t.amount)}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {unbudgeted.length > VISIBLE_UNBUDGETED_COUNT && (
                <Pressable onPress={() => setShowAllUnbudgeted((prev) => !prev)}>
                  <ThemedText type="small" themeColor="accent" style={styles.centerText}>
                    {showAllUnbudgeted ? 'Sembunyikan' : `Lihat semua (${unbudgeted.length})`}
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>
          )}
        </ScrollView>
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  loading: {
    marginTop: Spacing.five,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  duplicate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  summaryAmount: {
    fontSize: 24,
    lineHeight: 30,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryPercent: {
    fontSize: 18,
    lineHeight: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupList: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupItem: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  groupBody: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.two,
  },
  groupTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  groupTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  unbudgetedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  unbudgetedTitleBlock: {
    flex: 1,
  },
  unbudgetedList: {
    gap: Spacing.three,
  },
  unbudgetedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  unbudgetedBody: {
    flex: 1,
    minWidth: 0,
  },
  centerText: {
    textAlign: 'center',
  },
  entries: {
    // Sejajar dengan teks kategori: lebar ikon lg (48) + gap.
    paddingLeft: 48 + Spacing.three,
    gap: Spacing.three,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  entry: {
    gap: Spacing.half,
  },
  entryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  entryName: {
    flex: 1,
  },
  statusPill: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  entryActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
});
