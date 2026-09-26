import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { INVESTMENT_CATEGORIES, getInvestmentCategoryForAccountType } from '@/constants/enums';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useRealtimeTick } from '@/hooks/use-realtime-tick';
import { getAccount } from '@/lib/queries/accounts';
import { listHoldingsForAccount, type Holding } from '@/lib/queries/holdings';
import { formatCurrency } from '@/lib/utils/currency';
import type { Database } from '@/lib/database.types';

type AccountRow = Database['public']['Tables']['accounts']['Row'];

export default function HoldingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [account, setAccount] = useState<AccountRow | null>(null);
  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reloadTick = useRealtimeTick(['investment_holdings'], account?.family_id);

  const load = useCallback(async () => {
    try {
      const [accountResult, holdingsResult] = await Promise.all([
        getAccount(id),
        listHoldingsForAccount(id),
      ]);
      setAccount(accountResult);
      setHoldings(holdingsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat portofolio.');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadTick sengaja jadi dependency: naik saat ada perubahan realtime, memicu muat ulang
    }, [load, reloadTick])
  );

  const category = account ? getInvestmentCategoryForAccountType(account.account_type) : null;
  const categoryLabel = INVESTMENT_CATEGORIES.find((c) => c.value === category)?.label ?? account?.account_type;

  const totals = useMemo(() => {
    if (!holdings) return { currentValue: 0, gainLoss: 0 };
    return holdings.reduce(
      (acc, h) => ({
        currentValue: acc.currentValue + h.currentValue,
        gainLoss: acc.gainLoss + h.gainLoss,
      }),
      { currentValue: 0, gainLoss: 0 }
    );
  }, [holdings]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="accent">
              ‹ Kembali
            </ThemedText>
          </Pressable>
          {category && (
            <Pressable onPress={() => router.push({ pathname: '/accounts/[id]/holdings/new', params: { id } })}>
              <ThemedText type="smallBold" themeColor="accent">
                + Tambah
              </ThemedText>
            </Pressable>
          )}
        </View>

        <View>
          <ThemedText type="title" style={styles.title}>
            Portofolio
          </ThemedText>
          {account && (
            <ThemedText type="small" themeColor="textSecondary">
              {account.name} · {categoryLabel}
            </ThemedText>
          )}
        </View>

        {error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}

        {!holdings && !error && <ActivityIndicator style={styles.loading} />}

        {holdings && (
          <>
            <ThemedView type="backgroundElement" style={styles.summaryCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Total Nilai
              </ThemedText>
              <ThemedText type="title" style={styles.summaryAmount}>
                {formatCurrency(totals.currentValue, account?.currency ?? 'IDR')}
              </ThemedText>
              <ThemedText type="small" themeColor={totals.gainLoss >= 0 ? 'success' : 'danger'}>
                {totals.gainLoss >= 0 ? '+' : ''}
                {formatCurrency(totals.gainLoss, account?.currency ?? 'IDR')} untung/rugi
              </ThemedText>
            </ThemedView>

            {holdings.length === 0 && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Belum ada holding. Tambah holding pertama di akun ini.
              </ThemedText>
            )}
          </>
        )}

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {holdings?.map((h) => (
            <Pressable
              key={h.id}
              onPress={() =>
                router.push({ pathname: '/accounts/[id]/holdings/[holdingId]', params: { id, holdingId: h.id } })
              }>
              <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.cardTop}>
                  <ThemedText type="smallBold" numberOfLines={1} style={styles.cardTitleText}>
                    {h.name}
                  </ThemedText>
                  <ThemedText type="smallBold">{formatCurrency(h.currentValue, account?.currency ?? 'IDR')}</ThemedText>
                </View>
                <View style={styles.cardSubRow}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {h.quantity} @ {formatCurrency(h.current_price, account?.currency ?? 'IDR')}
                  </ThemedText>
                  <ThemedText type="small" themeColor={h.gainLoss >= 0 ? 'success' : 'danger'}>
                    {h.gainLoss >= 0 ? '+' : ''}
                    {h.gainLossPercentage.toFixed(1)}%
                  </ThemedText>
                </View>
              </ThemedView>
            </Pressable>
          ))}
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
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  loading: {
    marginTop: Spacing.five,
  },
  summaryCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  summaryAmount: {
    fontSize: 26,
    lineHeight: 32,
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
  cardTitleText: {
    flexShrink: 1,
  },
  cardSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
