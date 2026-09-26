import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BalanceSummaryCard } from '@/components/balance-summary-card';
import { IconChartLine, IconChevronRight } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { isInvestmentAccountType } from '@/constants/enums';
import { ChartColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useRealtimeTick } from '@/hooks/use-realtime-tick';
import { useTheme } from '@/hooks/use-theme';
import { useFamily } from '@/lib/family-context';
import { deleteAccount, listAccounts, type AccountWithBalance } from '@/lib/queries/accounts';
import { listFamilyMembers, updateDefaultAccount } from '@/lib/queries/families';
import { getPortfolioValueByAccount } from '@/lib/queries/holdings';
import { formatCurrency } from '@/lib/utils/currency';
import { computeNetWorth } from '@/lib/utils/networth';

type Tab = 'Tabungan' | 'Investasi';

export default function AccountsScreen() {
  const theme = useTheme();
  const { membership, refresh: refreshFamily } = useFamily();
  const reloadTick = useRealtimeTick(['accounts', 'transactions', 'investment_holdings'], membership?.family_id);
  const [accounts, setAccounts] = useState<AccountWithBalance[] | null>(null);
  const [memberNameById, setMemberNameById] = useState<Map<string, string>>(new Map());
  const [portfolioValueByAccount, setPortfolioValueByAccount] = useState<Map<string, number>>(new Map());
  const [tab, setTab] = useState<Tab>('Tabungan');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!membership) return;
    try {
      const [accountsResult, members, portfolioValues] = await Promise.all([
        listAccounts(membership.family_id),
        listFamilyMembers(membership.family_id),
        getPortfolioValueByAccount(membership.family_id),
      ]);
      setAccounts(accountsResult);
      setMemberNameById(new Map(members.map((m) => [m.id, m.display_name])));
      setPortfolioValueByAccount(portfolioValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat akun.');
    }
  }, [membership]);

  // Refetch tiap kali tab ini kembali fokus (mis. balik dari layar
  // tambah/ubah akun), bukan cuma sekali saat mount.
  useFocusEffect(
    useCallback(() => {
      load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadTick sengaja jadi dependency: naik saat ada perubahan realtime, memicu muat ulang
    }, [load, reloadTick])
  );

  const filteredAccounts = useMemo(
    () => accounts?.filter((a) => isInvestmentAccountType(a.account_type) === (tab === 'Investasi')) ?? null,
    [accounts, tab]
  );

  const { totalTabungan, totalInvestasi } = useMemo(() => {
    let tabungan = 0;
    let investasi = 0;
    for (const a of accounts ?? []) {
      if (a.currency !== 'IDR') continue;
      if (isInvestmentAccountType(a.account_type)) {
        investasi += portfolioValueByAccount.get(a.id) ?? 0;
      } else {
        tabungan += a.current_balance;
      }
    }
    return { totalTabungan: tabungan, totalInvestasi: investasi };
  }, [accounts, portfolioValueByAccount]);

  const otherCurrencies = useMemo(
    () =>
      computeNetWorth(accounts ?? [], portfolioValueByAccount)
        .filter((c) => c.currency !== 'IDR')
        .map((c) => ({ currency: c.currency, total: c.total })),
    [accounts, portfolioValueByAccount]
  );

  function statusColor(status: AccountWithBalance['status']) {
    return status === 'Aktif' ? theme.success : status === 'Ditutup' ? theme.danger : theme.textSecondary;
  }

  async function handleToggleDefault(accountId: string) {
    if (!membership) return;
    const nextId = membership.default_account_id === accountId ? null : accountId;
    await updateDefaultAccount(membership.id, nextId);
    await refreshFamily();
  }

  function handleDelete(account: AccountWithBalance) {
    Alert.alert('Hapus rekening', `Hapus "${account.name}"? Tindakan ini tidak bisa dibatalkan.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount(account.id);
            setError(null);
            load();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal menghapus rekening.');
          }
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Akun
          </ThemedText>
          <Pressable onPress={() => router.push('/accounts/new')}>
            <ThemedText type="smallBold" themeColor="accent">
              + Tambah
            </ThemedText>
          </Pressable>
        </ThemedView>

        {error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}

        {!accounts && !error && <ActivityIndicator style={styles.loading} />}

        {accounts && (
          <>
            <BalanceSummaryCard tabungan={totalTabungan} investasi={totalInvestasi} otherCurrencies={otherCurrencies} />

            <ThemedView type="backgroundElement" style={styles.tabSwitch}>
              {(['Tabungan', 'Investasi'] as Tab[]).map((t) => (
                <Pressable key={t} style={styles.tabSwitchButton} onPress={() => setTab(t)}>
                  <View style={[styles.tabSwitchFill, tab === t && { backgroundColor: theme.accent }]}>
                    <ThemedText
                      type="small"
                      themeColor={tab === t ? undefined : 'textSecondary'}
                      style={tab === t ? styles.tabSwitchLabelActive : undefined}>
                      {t}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </ThemedView>

            {filteredAccounts?.length === 0 && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                {tab === 'Investasi' ? 'Belum ada akun investasi.' : 'Belum ada akun. Tambah akun pertama kamu.'}
              </ThemedText>
            )}
          </>
        )}

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <ThemedView type="backgroundElement" style={[styles.group, { borderColor: theme.border }, !filteredAccounts?.length && styles.hidden]}>
          {filteredAccounts?.map((account, index) => {
            const isDefault = membership?.default_account_id === account.id;
            const owner = account.owner_member_id ? memberNameById.get(account.owner_member_id) : null;
            const isInvestment = isInvestmentAccountType(account.account_type);
            const displayValue = isInvestment
              ? (portfolioValueByAccount.get(account.id) ?? 0)
              : account.current_balance;

            const card = (
              <View style={[styles.card, index > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleRow}>
                    <Pressable onPress={() => handleToggleDefault(account.id)} hitSlop={8}>
                      <ThemedText type="default" themeColor={isDefault ? 'accent' : 'textSecondary'}>
                        {isDefault ? '★' : '☆'}
                      </ThemedText>
                    </Pressable>
                    <ThemedText type="smallBold" numberOfLines={1} style={styles.cardTitleText}>
                      {account.name}
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold">{formatCurrency(displayValue, account.currency)}</ThemedText>
                </View>

                <View style={styles.cardSubRow}>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.cardSubText}>
                    {account.account_type}
                    {account.institution ? ` · ${account.institution}` : ''}
                  </ThemedText>
                  <View style={styles.cardBadges}>
                    {owner && (
                      <View style={[styles.statusPill, { backgroundColor: `${ChartColors.investasi}26` }]}>
                        <ThemedText style={[styles.statusText, { color: ChartColors.investasi }]} numberOfLines={1}>
                          {owner}
                        </ThemedText>
                      </View>
                    )}
                    <View style={[styles.statusPill, { backgroundColor: `${statusColor(account.status)}26` }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor(account.status) }]} />
                      <ThemedText style={[styles.statusText, { color: statusColor(account.status) }]}>
                        {account.status}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {isInvestment && (
                  <Pressable
                    style={[styles.portfolioButton, { backgroundColor: `${theme.accent}1A`, borderColor: `${theme.accent}4D` }]}
                    onPress={() =>
                      router.push({ pathname: '/accounts/[id]/holdings', params: { id: account.id } })
                    }>
                    <IconChartLine size={16} color={theme.accent} />
                    <ThemedText type="smallBold" themeColor="accent">
                      Lihat Portofolio
                    </ThemedText>
                    <IconChevronRight size={16} color={theme.accent} />
                  </Pressable>
                )}

                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: '/accounts/[id]/history', params: { id: account.id } })
                    }>
                    <ThemedText type="small" themeColor="accent">
                      Riwayat
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: '/accounts/[id]', params: { id: account.id } })
                    }>
                    <ThemedText type="small" themeColor="accent">
                      Ubah
                    </ThemedText>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(account)}>
                    <ThemedText type="small" themeColor="danger">
                      Hapus
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            );

            return <View key={account.id}>{card}</View>;
          })}
          </ThemedView>
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
    paddingBottom: 0,
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
  loading: {
    marginTop: Spacing.five,
  },
  tabSwitch: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  tabSwitchButton: {
    flex: 1,
  },
  tabSwitchFill: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  tabSwitchLabelActive: {
    color: '#ffffff',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  hidden: {
    display: 'none',
  },
  group: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
  },
  card: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flexShrink: 1,
  },
  cardTitleText: {
    flexShrink: 1,
  },
  cardSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardSubText: {
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  cardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  portfolioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one + Spacing.half,
    borderRadius: Spacing.four,
    borderWidth: 1,
    paddingVertical: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.one,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
});
