import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/category-icon';
import { DonutChart, type DonutSlice } from '@/components/donut-chart';
import {
  IconAlertCircle,
  IconArrowDownCircle,
  IconArrowUpCircle,
  IconArrowsExchange,
  IconChartPie,
  IconDots,
  IconEye,
  IconEyeOff,
  IconHome,
  IconPlus,
  IconRepeat,
} from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrendChart } from '@/components/trend-chart';
import { CategoryPalette, MaxContentWidth, Spacing } from '@/constants/theme';
import { useRealtimeTick } from '@/hooks/use-realtime-tick';
import { useTheme } from '@/hooks/use-theme';
import { useFamily } from '@/lib/family-context';
import { usePreferences } from '@/lib/preferences-context';
import { listAccounts, type AccountWithBalance } from '@/lib/queries/accounts';
import {
  getBudgetOverview,
  getMonthlySummary,
  getMonthlyTrend,
  type BudgetOverview,
  type MonthlySummary,
  type MonthlyTrendPoint,
} from '@/lib/queries/dashboard';
import { getPortfolioValueByAccount } from '@/lib/queries/holdings';
import {
  advanceRecurringSchedule,
  listDueRecurringTransactions,
  type RecurringTransactionWithDetails,
} from '@/lib/queries/recurring-transactions';
import { getInitials } from '@/lib/utils/avatar';
import { confirmAction } from '@/lib/utils/confirm';
import { formatCurrency } from '@/lib/utils/currency';
import { formatShortDate } from '@/lib/utils/date';
import { computeNetWorth } from '@/lib/utils/networth';

const HIDDEN_AMOUNT = 'Rp ••••••';
const TOP_CATEGORIES = 5;

type DashboardData = {
  accounts: AccountWithBalance[];
  portfolioValueByAccount: Map<string, number>;
  summary: MonthlySummary;
  trend: MonthlyTrendPoint[];
  budget: BudgetOverview;
  dueRecurring: RecurringTransactionWithDetails[];
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 10) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export default function BerandaScreen() {
  const theme = useTheme();
  const { membership } = useFamily();
  const { defaultBalanceVisible } = usePreferences();
  const reloadTick = useRealtimeTick(['transactions', 'accounts', 'budgets', 'recurring_transactions'], membership?.family_id);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(defaultBalanceVisible);
  // Ikuti default dari Lainnya -> Pengaturan setiap kali NILAINYA berubah (dibaca dari AsyncStorage
  // saat app start, atau diubah langsung di layar Pengaturan) — pola "adjust state saat render"
  // (bukan setState di useEffect), supaya toggle manual pengguna (ikon mata) selama sesi berjalan
  // tidak tertimpa balik di render lain.
  const [appliedDefaultBalanceVisible, setAppliedDefaultBalanceVisible] = useState(defaultBalanceVisible);
  if (defaultBalanceVisible !== appliedDefaultBalanceVisible) {
    setAppliedDefaultBalanceVisible(defaultBalanceVisible);
    setBalanceVisible(defaultBalanceVisible);
  }

  const load = useCallback(async () => {
    if (!membership) return;
    try {
      const [accounts, portfolioValueByAccount, summary, trend, budget, dueRecurring] = await Promise.all([
        listAccounts(membership.family_id),
        getPortfolioValueByAccount(membership.family_id),
        getMonthlySummary(membership.family_id, membership.month_start_day),
        getMonthlyTrend(membership.family_id, membership.month_start_day),
        getBudgetOverview(membership.family_id, membership.month_start_day),
        listDueRecurringTransactions(membership.family_id),
      ]);
      setData({ accounts, portfolioValueByAccount, summary, trend, budget, dueRecurring });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat beranda.');
    }
  }, [membership]);

  useFocusEffect(
    useCallback(() => {
      load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadTick sengaja jadi dependency: naik saat ada perubahan realtime, memicu muat ulang
    }, [load, reloadTick])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const balances = useMemo(
    () => (data ? computeNetWorth(data.accounts, data.portfolioValueByAccount) : []),
    [data]
  );
  const primaryBalance = balances.find((b) => b.currency === 'IDR') ?? balances[0];
  const otherBalances = balances.filter((b) => b !== primaryBalance);
  const activeAccountsCount = data?.accounts.filter((a) => a.status !== 'Ditutup').length ?? 0;

  const money = (amount: number) => (balanceVisible ? formatCurrency(amount, 'IDR') : HIDDEN_AMOUNT);

  const totalIncome = data?.summary.totalIncome ?? 0;
  const totalExpense = data?.summary.totalExpense ?? 0;
  const netBalance = totalIncome - totalExpense;
  const budgetPercentage =
    data && data.budget.targetTotal > 0 ? Math.round((data.budget.realisasiTotal / data.budget.targetTotal) * 100) : 0;
  const donutSlices = useMemo<DonutSlice[]>(() => {
    const categories = data?.summary.categories ?? [];
    const top = categories.slice(0, TOP_CATEGORIES).map((c, index) => ({
      key: c.categoryId,
      label: c.categoryName,
      amount: c.amount,
      percentage: c.percentage,
      color: CategoryPalette[index % CategoryPalette.length],
    }));
    const rest = categories.slice(TOP_CATEGORIES);
    if (rest.length === 0) return top;
    const restAmount = rest.reduce((sum, c) => sum + c.amount, 0);
    const totalAmount = categories.reduce((sum, c) => sum + c.amount, 0);
    return [
      ...top,
      {
        key: 'lainnya',
        label: 'Lainnya',
        amount: restAmount,
        percentage: totalAmount > 0 ? Math.round((restAmount / totalAmount) * 100) : 0,
        color: CategoryPalette[TOP_CATEGORIES % CategoryPalette.length],
      },
    ];
  }, [data]);

  const quickActions = [
    { label: 'Tambah Transaksi', icon: IconPlus, route: '/transactions/new' },
    { label: 'Transfer', icon: IconArrowsExchange, route: '/transactions/new?type=Transfer' },
    { label: 'Atur Budget', icon: IconChartPie, route: '/budget' },
    { label: 'Lainnya', icon: IconDots, route: '/more' },
  ] as const;

  function handleSkipRecurring(item: RecurringTransactionWithDetails) {
    confirmAction(
      'Lewati jadwal',
      `Lewati "${item.description || item.categoryName}" ke jadwal berikutnya tanpa mencatat transaksi?`,
      'Lewati',
      async () => {
        try {
          await advanceRecurringSchedule({
            id: item.id,
            nextDueDate: item.nextDueDate,
            frequency: item.frequency,
            endDate: item.endDate,
          });
          await load();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Gagal melewati jadwal.');
        }
      }
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image source={require('@/assets/images/logo-mark.png')} style={styles.logo} contentFit="contain" />
            <ThemedText style={styles.brandName}>MAVYN</ThemedText>
          </View>

          <View style={styles.greetingRow}>
            <View style={styles.greetingText}>
              <ThemedText type="small" themeColor="textSecondary">
                {getGreeting()}
              </ThemedText>
              <ThemedText type="subtitle" numberOfLines={1} style={styles.name}>
                {membership?.display_name}
              </ThemedText>
              {membership?.family_name ? (
                <View style={[styles.familyPill, { backgroundColor: `${theme.accent}26` }]}>
                  <IconHome size={12} color={theme.accent} />
                  <ThemedText themeColor="accent" numberOfLines={1} style={styles.familyPillText}>
                    {membership.family_name}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <Pressable onPress={() => router.push('/more')} hitSlop={8} accessibilityLabel="Buka menu Lainnya">
              {membership?.avatar_url ? (
                <Image source={{ uri: membership.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.accent }]}>
                  <ThemedText type="smallBold" style={styles.avatarInitials}>
                    {getInitials(membership?.display_name ?? '')}
                  </ThemedText>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}

        {!data && !error && <ActivityIndicator style={styles.loading} />}

        {data && (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.accent} />}>
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.rowBetween}>
                <ThemedText type="small" themeColor="textSecondary">
                  Total Saldo · {activeAccountsCount} akun
                </ThemedText>
                <Pressable
                  onPress={() => setBalanceVisible((v) => !v)}
                  hitSlop={8}
                  accessibilityLabel={balanceVisible ? 'Sembunyikan saldo' : 'Tampilkan saldo'}>
                  {balanceVisible ? (
                    <IconEye size={20} color={theme.textSecondary} />
                  ) : (
                    <IconEyeOff size={20} color={theme.textSecondary} />
                  )}
                </Pressable>
              </View>
              <ThemedText type="title" style={styles.balanceAmount}>
                {balanceVisible ? formatCurrency(primaryBalance?.total ?? 0, primaryBalance?.currency ?? 'IDR') : HIDDEN_AMOUNT}
              </ThemedText>
              {otherBalances.length > 0 && (
                <View style={[styles.otherBalances, { borderTopColor: theme.border }]}>
                  {otherBalances.map((b) => (
                    <View key={b.currency} style={styles.rowBetween}>
                      <ThemedText type="small" themeColor="textSecondary">
                        {b.currency}
                      </ThemedText>
                      <ThemedText type="smallBold">
                        {balanceVisible ? formatCurrency(b.total, b.currency) : '••••••'}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </ThemedView>

            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: theme.success }]}>
                <View style={styles.pillLabelRow}>
                  <IconArrowDownCircle size={16} color="#ffffff" />
                  <ThemedText type="small" style={styles.pillText}>
                    Pemasukan
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.pillText} numberOfLines={1} adjustsFontSizeToFit>
                  {money(totalIncome)}
                </ThemedText>
              </View>
              <View style={[styles.pill, { backgroundColor: theme.danger }]}>
                <View style={styles.pillLabelRow}>
                  <IconArrowUpCircle size={16} color="#ffffff" />
                  <ThemedText type="small" style={styles.pillText}>
                    Pengeluaran
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.pillText} numberOfLines={1} adjustsFontSizeToFit>
                  {money(totalExpense)}
                </ThemedText>
              </View>
            </View>

            {data.dueRecurring.length > 0 && (
              <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={styles.dueTitleRow}>
                    <IconRepeat size={18} color={theme.accent} />
                    <ThemedText type="smallBold">Tagihan Jatuh Tempo</ThemedText>
                  </View>
                  <Pressable onPress={() => router.push('/transactions/recurring')} hitSlop={8}>
                    <ThemedText type="small" themeColor="accent">
                      Kelola
                    </ThemedText>
                  </Pressable>
                </View>

                {data.dueRecurring.map((item) => (
                  <View key={item.id} style={[styles.dueItem, { borderTopColor: theme.border }]}>
                    <CategoryIcon name={item.categoryName} icon={item.categoryIcon} />
                    <View style={styles.dueBody}>
                      <ThemedText type="small" numberOfLines={1}>
                        {item.description || item.categoryName}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        Jatuh tempo {formatShortDate(item.nextDueDate)} · {money(item.amount)}
                      </ThemedText>
                      <View style={styles.dueActions}>
                        <Pressable
                          onPress={() => router.push({ pathname: '/transactions/new', params: { recurringId: item.id } })}
                          hitSlop={8}>
                          <ThemedText type="small" themeColor="accent">
                            Catat
                          </ThemedText>
                        </Pressable>
                        <Pressable onPress={() => handleSkipRecurring(item)} hitSlop={8}>
                          <ThemedText type="small" themeColor="textSecondary">
                            Lewati
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </ThemedView>
            )}

            <View style={styles.quickActions}>
              {quickActions.map((action) => (
                <Pressable key={action.label} style={styles.quickAction} onPress={() => router.push(action.route)}>
                  <View style={[styles.quickActionIcon, { backgroundColor: theme.backgroundElement }]}>
                    <action.icon size={22} color={theme.accent} />
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.quickActionLabel}>
                    {action.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.rowBetween}>
                <ThemedText type="smallBold">Ringkasan Bulan Ini</ThemedText>
                <Pressable onPress={() => router.push('/reports')} hitSlop={8}>
                  <ThemedText type="small" themeColor="accent">
                    Lihat Semua
                  </ThemedText>
                </Pressable>
              </View>

              <TrendChart data={data.trend} />

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: theme.success }]} />
                  <View>
                    <ThemedText type="small" themeColor="textSecondary">
                      Pemasukan
                    </ThemedText>
                    <ThemedText type="smallBold">{money(totalIncome)}</ThemedText>
                  </View>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: theme.danger }]} />
                  <View>
                    <ThemedText type="small" themeColor="textSecondary">
                      Pengeluaran
                    </ThemedText>
                    <ThemedText type="smallBold">{money(totalExpense)}</ThemedText>
                  </View>
                </View>
              </View>

              <View style={[styles.rowBetween, styles.netRow, { borderTopColor: theme.border }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  Saldo Bersih
                </ThemedText>
                <ThemedText type="smallBold" themeColor={netBalance >= 0 ? 'success' : 'danger'}>
                  {money(netBalance)}
                </ThemedText>
              </View>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Pengeluaran Bulan Ini</ThemedText>
              {donutSlices.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                  Belum ada transaksi pengeluaran bulan ini.
                </ThemedText>
              ) : (
                <View style={styles.donutWrap}>
                  <DonutChart slices={donutSlices} total={totalExpense} hideAmounts={!balanceVisible} />
                  <Pressable onPress={() => router.push('/reports')} hitSlop={8}>
                    <ThemedText type="small" themeColor="accent">
                      Lihat Detail ›
                    </ThemedText>
                  </Pressable>
                </View>
              )}
            </ThemedView>

            <Pressable onPress={() => router.push('/budget')}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.rowBetween}>
                  <ThemedText type="smallBold">Realisasi Anggaran</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {budgetPercentage}%
                  </ThemedText>
                </View>
                {data.budget.targetTotal > 0 ? (
                  <>
                    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                      <View
                        style={{
                          width: `${Math.min(budgetPercentage, 100)}%`,
                          height: '100%',
                          backgroundColor: budgetPercentage > 100 ? theme.danger : theme.accent,
                        }}
                      />
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {money(data.budget.realisasiTotal)} dari {money(data.budget.targetTotal)}
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    Belum ada anggaran bulan ini.
                  </ThemedText>
                )}
              </ThemedView>
            </Pressable>

            {data.budget.overBudgetCategories.length > 0 && (
              <View style={[styles.alert, { backgroundColor: theme.danger + '1F', borderColor: theme.danger + '4D' }]}>
                <IconAlertCircle size={20} color={theme.danger} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.flexShrink}>
                  <ThemedText type="smallBold" themeColor="danger">
                    {data.budget.overBudgetCategories.length} kategori melebihi anggaran:
                  </ThemedText>{' '}
                  {data.budget.overBudgetCategories.join(', ')}
                </ThemedText>
              </View>
            )}
          </ScrollView>
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.two,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  greetingText: {
    flex: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 30,
    height: 28,
  },
  brandName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 3,
  },
  name: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
  },
  familyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    marginTop: Spacing.one,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  familyPillText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
  },
  loading: {
    marginTop: Spacing.five,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  card: {
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  balanceAmount: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: 700,
  },
  otherBalances: {
    gap: Spacing.one,
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  pill: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  pillLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  pillText: {
    color: '#ffffff',
  },
  dueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dueBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  dueActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  netRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  donutWrap: {
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  flexShrink: {
    flexShrink: 1,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
  },
});
