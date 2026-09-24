import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BalanceSummaryCard } from '@/components/balance-summary-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { isInvestmentAccountType } from '@/constants/enums';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFamily } from '@/lib/family-context';
import { deleteAccount, listAccounts, type AccountWithBalance } from '@/lib/queries/accounts';
import { listFamilyMembers, updateDefaultAccount } from '@/lib/queries/families';
import { getPortfolioValueByAccount } from '@/lib/queries/holdings';
import { formatCurrency } from '@/lib/utils/currency';

type Tab = 'Tabungan' | 'Investasi';

export default function AccountsScreen() {
  const theme = useTheme();
  const { membership, refresh: refreshFamily } = useFamily();
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
    }, [load])
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
            <BalanceSummaryCard tabungan={totalTabungan} investasi={totalInvestasi} />

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
          {filteredAccounts?.map((account) => {
            const isDefault = membership?.default_account_id === account.id;
            const owner = account.owner_member_id ? memberNameById.get(account.owner_member_id) : null;
            const isInvestment = isInvestmentAccountType(account.account_type);
            const displayValue = isInvestment
              ? (portfolioValueByAccount.get(account.id) ?? 0)
              : account.current_balance;

            const card = (
              <ThemedView type="backgroundElement" style={styles.card}>
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
                      <ThemedText type="small" themeColor="textSecondary">
                        {owner}
                      </ThemedText>
                    )}
                    <ThemedText
                      type="small"
                      themeColor={account.status === 'Aktif' ? 'success' : 'textSecondary'}>
                      {account.status}
                    </ThemedText>
                  </View>
                </View>

                {isInvestment && (
                  <Pressable
                    style={styles.portfolioLink}
                    onPress={() =>
                      router.push({ pathname: '/accounts/[id]/holdings', params: { id: account.id } })
                    }>
                    <ThemedText type="small" themeColor="accent">
                      Lihat Portofolio
                    </ThemedText>
                    <ThemedText type="small" themeColor="accent">
                      ›
                    </ThemedText>
                  </Pressable>
                )}

                <View style={styles.cardActions}>
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
              </ThemedView>
            );

            return <View key={account.id}>{card}</View>;
          })}
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
    paddingHorizontal: Spacing.four,
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
  card: {
    borderRadius: Spacing.three,
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
  cardBadges: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  portfolioLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
});
