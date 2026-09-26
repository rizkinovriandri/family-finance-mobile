import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryFilterDropdown } from '@/components/category-filter-dropdown';
import { CategoryIcon } from '@/components/category-icon';
import { IconChevronLeft, IconChevronRight } from '@/components/icons';
import { NetWorthView } from '@/components/net-worth-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeeklyBarChart } from '@/components/weekly-bar-chart';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useRealtimeTick } from '@/hooks/use-realtime-tick';
import { useTheme } from '@/hooks/use-theme';
import { useFamily } from '@/lib/family-context';
import { listCategories, type Category } from '@/lib/queries/categories';
import { getReportSummary, type ReportSummary, type ReportType } from '@/lib/queries/reports';
import { formatCurrency } from '@/lib/utils/currency';
import { formatCycleLabel, getCycleStart, shiftCycle } from '@/lib/utils/date';

type Tab = ReportType | 'Net Worth';

const TABS: Tab[] = ['Pengeluaran', 'Pemasukan', 'Net Worth'];

function money(amount: number) {
  return formatCurrency(amount, 'IDR');
}

// Pengeluaran turun = bagus (hijau); pemasukan naik = bagus (hijau).
// Kebalikannya (pengeluaran naik / pemasukan turun) = kurang bagus (merah).
function isChangeFavorable(tab: ReportType, changePercentage: number) {
  return tab === 'Pengeluaran' ? changePercentage < 0 : changePercentage > 0;
}

// Layar Laporan — mirror family-finance-app/components/ReportsView.tsx: tab Pengeluaran/Pemasukan
// (total bulan ini vs bulan lalu, grafik mingguan W1–W4, 5 kategori terbesar) dan tab Net Worth.
export default function ReportsScreen() {
  const theme = useTheme();
  const { membership } = useFamily();
  const reloadTick = useRealtimeTick(['transactions', 'categories'], membership?.family_id);
  const monthStartDay = membership?.month_start_day ?? 1;

  const [tab, setTab] = useState<Tab>('Pengeluaran');
  // Selisih bulan dari siklus berjalan (0 = bulan ini) — angka, supaya `activeMonth` stabil antar render.
  const [monthOffset, setMonthOffset] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const activeMonth = useMemo(
    () => shiftCycle(getCycleStart(new Date(), monthStartDay), monthOffset),
    [monthStartDay, monthOffset]
  );
  const monthLabel = formatCycleLabel(activeMonth, monthStartDay);

  const tabCategories = useMemo(() => {
    const categoryType = tab === 'Pemasukan' ? 'income' : 'expense';
    return categories.filter((c) => c.type === categoryType);
  }, [categories, tab]);

  // Muat ulang tiap layar kembali fokus, atau tab/bulan/filter kategori berubah.
  useFocusEffect(
    useCallback(() => {
      if (!membership || tab === 'Net Worth') return;
      let cancelled = false;
      Promise.all([
        getReportSummary(membership.family_id, activeMonth, membership.month_start_day, tab, categoryFilter || undefined),
        listCategories(),
      ])
        .then(([result, categoryList]) => {
          if (cancelled) return;
          setSummary(result);
          setCategories(categoryList);
          setError(null);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat laporan.');
        });
      return () => {
        cancelled = true;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadTick sengaja jadi dependency: naik saat ada perubahan realtime, memicu muat ulang
    }, [membership, tab, activeMonth, categoryFilter, reloadTick])
  );

  function switchTab(next: Tab) {
    if (next === tab) return;
    setTab(next);
    setCategoryFilter('');
    setSummary(null);
  }

  function shiftMonth(delta: number) {
    setMonthOffset((prev) => prev + delta);
    setSummary(null);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Laporan
        </ThemedText>

        <View style={[styles.tabSwitch, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => switchTab(t)}
              style={[styles.tabSwitchItem, tab === t && { backgroundColor: theme.accent }]}>
              <ThemedText
                type="small"
                themeColor={tab === t ? undefined : 'textSecondary'}
                style={tab === t ? styles.activeLabel : undefined}>
                {t}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {tab === 'Net Worth' ? (
            <NetWorthView />
          ) : (
            <>
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

              {!summary && !error ? (
                <ActivityIndicator style={styles.loading} />
              ) : summary ? (
                <>
                  <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
                    <View style={styles.summaryHeader}>
                      <ThemedText type="small" themeColor="textSecondary">
                        Total {tab}
                      </ThemedText>
                      <CategoryFilterDropdown
                        categories={tabCategories}
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                      />
                    </View>

                    <View>
                      <View style={styles.totalRow}>
                        <ThemedText type="title" style={styles.totalAmount} numberOfLines={1} adjustsFontSizeToFit>
                          {money(summary.total)}
                        </ThemedText>
                        {summary.changePercentage !== 0 && (
                          <ThemedText
                            type="smallBold"
                            themeColor={isChangeFavorable(tab, summary.changePercentage) ? 'success' : 'danger'}>
                            {summary.changePercentage < 0 ? '↓' : '↑'} {Math.abs(summary.changePercentage)}%
                          </ThemedText>
                        )}
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        vs. bulan lalu
                      </ThemedText>
                    </View>

                    <WeeklyBarChart data={summary.weekly} color={tab === 'Pemasukan' ? theme.success : theme.accent} />
                  </ThemedView>

                  <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
                    <ThemedText type="smallBold">Kategori Terbesar</ThemedText>
                    {summary.categories.length === 0 ? (
                      <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                        Belum ada data bulan ini.
                      </ThemedText>
                    ) : (
                      summary.categories.map((c, i) => (
                        <View key={c.categoryId} style={styles.categoryRow}>
                          <ThemedText type="small" themeColor="textSecondary" style={styles.rank}>
                            {i + 1}
                          </ThemedText>
                          <CategoryIcon name={c.categoryName} icon={c.categoryIcon} />
                          <ThemedText type="small" numberOfLines={1} style={styles.categoryName}>
                            {c.categoryName}
                          </ThemedText>
                          <View style={styles.categoryAmount}>
                            <ThemedText type="smallBold">{money(c.amount)}</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary" style={styles.percentText}>
                              {c.percentage}%
                            </ThemedText>
                          </View>
                        </View>
                      ))
                    )}
                  </ThemedView>
                </>
              ) : null}
            </>
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
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  activeLabel: {
    color: '#ffffff',
  },
  tabSwitch: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.half * 2,
    gap: Spacing.half,
  },
  tabSwitchItem: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  loading: {
    marginTop: Spacing.five,
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
  card: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  totalAmount: {
    flexShrink: 1,
    fontSize: 26,
    lineHeight: 34,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rank: {
    width: 16,
    fontSize: 12,
  },
  categoryName: {
    flex: 1,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  percentText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
