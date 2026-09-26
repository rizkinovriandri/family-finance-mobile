import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AccountTypeIcon } from '@/components/account-type-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useIdrRates } from '@/hooks/use-idr-rates';
import { useRealtimeTick } from '@/hooks/use-realtime-tick';
import { useTheme } from '@/hooks/use-theme';
import { useFamily } from '@/lib/family-context';
import { listAccounts, type AccountWithBalance } from '@/lib/queries/accounts';
import { getPortfolioValueByAccount } from '@/lib/queries/holdings';
import { formatCurrency } from '@/lib/utils/currency';
import { computeNetWorth } from '@/lib/utils/networth';

// Tab "Net Worth" di Laporan — mirror family-finance-app/components/NetWorthView.tsx:
// total kekayaan bersih, komposisi tabungan/investasi, liabilitas, mata uang lain, lalu daftar
// akun aset dan liabilitas.
export function NetWorthView() {
  const theme = useTheme();
  const { membership } = useFamily();
  const reloadTick = useRealtimeTick(['accounts', 'transactions', 'investment_holdings'], membership?.family_id);
  const [accounts, setAccounts] = useState<AccountWithBalance[] | null>(null);
  const [portfolioValueByAccount, setPortfolioValueByAccount] = useState<Map<string, number>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!membership) return;
      let cancelled = false;
      Promise.all([listAccounts(membership.family_id), getPortfolioValueByAccount(membership.family_id)])
        .then(([accountRows, portfolioValues]) => {
          if (cancelled) return;
          setAccounts(accountRows);
          setPortfolioValueByAccount(portfolioValues);
          setError(null);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat data kekayaan bersih.');
        });
      return () => {
        cancelled = true;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadTick sengaja jadi dependency: naik saat ada perubahan realtime, memicu muat ulang
    }, [membership, reloadTick])
  );

  const netWorthByCurrency = useMemo(
    () => (accounts ? computeNetWorth(accounts, portfolioValueByAccount) : []),
    [accounts, portfolioValueByAccount]
  );
  const primary = netWorthByCurrency.find((c) => c.currency === 'IDR') ?? netWorthByCurrency[0];
  const others = netWorthByCurrency.filter((c) => c !== primary);
  const idrRates = useIdrRates(others.map((c) => c.currency));

  if (error) {
    return (
      <ThemedText type="small" themeColor="danger">
        {error}
      </ThemedText>
    );
  }

  if (!accounts) return <ActivityIndicator style={styles.loading} />;

  if (!primary || (primary.asetAccounts.length === 0 && primary.liabilitasAccounts.length === 0)) {
    return (
      <ThemedView type="backgroundElement" style={[styles.card, styles.emptyCard, { borderColor: theme.border }]}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Belum ada akun untuk dihitung kekayaan bersihnya.
        </ThemedText>
        <Pressable onPress={() => router.push('/accounts')}>
          <ThemedText type="small" themeColor="accent" style={styles.centerText}>
            Tambah akun
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const grossAset = primary.tabungan + primary.investasi;
  const tabunganPct = grossAset > 0 ? Math.round((primary.tabungan / grossAset) * 100) : 0;
  const investasiPct = grossAset > 0 ? Math.round((primary.investasi / grossAset) * 100) : 0;

  return (
    <View style={styles.container}>
      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
        <View>
          <ThemedText type="small" themeColor="textSecondary">
            Total Kekayaan Bersih
          </ThemedText>
          <ThemedText type="subtitle" style={styles.total} themeColor={primary.total < 0 ? 'danger' : undefined}>
            {formatCurrency(primary.total, primary.currency)}
          </ThemedText>
        </View>

        {grossAset > 0 && (
          <View style={styles.composition}>
            <View style={[styles.stackedBar, { backgroundColor: theme.background }]}>
              <View style={{ width: `${tabunganPct}%`, backgroundColor: theme.accent }} />
              <View style={{ width: `${investasiPct}%`, backgroundColor: theme.success }} />
            </View>
            <View style={styles.legendRow}>
              <LegendItem
                color={theme.accent}
                label={`Tabungan ${formatCurrency(primary.tabungan, primary.currency)}`}
                percentage={tabunganPct}
              />
              <LegendItem
                color={theme.success}
                label={`Investasi ${formatCurrency(primary.investasi, primary.currency)}`}
                percentage={investasiPct}
              />
            </View>
          </View>
        )}

        {primary.liabilitas > 0 && (
          <View style={styles.rowBetween}>
            <ThemedText type="small" themeColor="textSecondary">
              Liabilitas (Utang/Kartu Kredit)
            </ThemedText>
            <ThemedText type="smallBold" themeColor="danger">
              -{formatCurrency(primary.liabilitas, primary.currency)}
            </ThemedText>
          </View>
        )}

        {others.length > 0 && (
          <View style={[styles.others, { borderTopColor: theme.border }]}>
            <ThemedText type="small" themeColor="textSecondary">
              Mata uang lain (≈ estimasi kurs, tidak masuk total)
            </ThemedText>
            {others.map((c) => (
              <View key={c.currency} style={styles.currencyBlock}>
                <View style={styles.rowBetween}>
                  <ThemedText type="smallBold">{c.currency}</ThemedText>
                  <View style={styles.otherAmount}>
                    <ThemedText type="smallBold" themeColor={c.total < 0 ? 'danger' : undefined}>
                      {formatCurrency(c.total, c.currency)}
                    </ThemedText>
                    {idrRates[c.currency] !== undefined && (
                      <ThemedText type="small" themeColor="textSecondary">
                        ≈ {formatCurrency(c.total * idrRates[c.currency], 'IDR')}
                      </ThemedText>
                    )}
                  </View>
                </View>

                {c.tabungan !== 0 && (
                  <BreakdownRow label="Tabungan" value={formatCurrency(c.tabungan, c.currency)} />
                )}
                {c.investasi !== 0 && (
                  <BreakdownRow label="Investasi" value={formatCurrency(c.investasi, c.currency)} />
                )}
                {c.liabilitas > 0 && (
                  <BreakdownRow label="Liabilitas" value={`-${formatCurrency(c.liabilitas, c.currency)}`} danger />
                )}

                {[...c.asetAccounts, ...c.liabilitasAccounts].map((a) => {
                  const isLiability = c.liabilitasAccounts.includes(a);
                  return (
                    <View key={a.id} style={styles.otherAccountRow}>
                      <AccountTypeIcon accountType={a.accountType} size={28} />
                      <ThemedText type="small" numberOfLines={1} style={styles.accountName}>
                        {a.name}
                      </ThemedText>
                      <ThemedText type="small" themeColor={isLiability ? 'danger' : undefined}>
                        {isLiability ? '-' : ''}
                        {formatCurrency(a.value, c.currency)}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ThemedView>

      {primary.asetAccounts.length > 0 && (
        <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
          <ThemedText type="smallBold">Aset</ThemedText>
          {primary.asetAccounts.map((a) => (
            <View key={a.id} style={styles.accountRow}>
              <AccountTypeIcon accountType={a.accountType} />
              <ThemedText type="small" numberOfLines={1} style={styles.accountName}>
                {a.name}
              </ThemedText>
              <ThemedText type="smallBold">{formatCurrency(a.value, primary.currency)}</ThemedText>
            </View>
          ))}
        </ThemedView>
      )}

      {primary.liabilitasAccounts.length > 0 && (
        <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
          <ThemedText type="smallBold">Liabilitas</ThemedText>
          {primary.liabilitasAccounts.map((a) => (
            <View key={a.id} style={styles.accountRow}>
              <AccountTypeIcon accountType={a.accountType} />
              <ThemedText type="small" numberOfLines={1} style={styles.accountName}>
                {a.name}
              </ThemedText>
              <ThemedText type="smallBold" themeColor="danger">
                -{formatCurrency(a.value, primary.currency)}
              </ThemedText>
            </View>
          ))}
        </ThemedView>
      )}
    </View>
  );
}

function BreakdownRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.rowBetween}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small" themeColor={danger ? 'danger' : 'textSecondary'}>
        {value}
      </ThemedText>
    </View>
  );
}

function LegendItem({ color, label, percentage }: { color: string; label: string; percentage: number }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText themeColor="textSecondary" numberOfLines={1} style={styles.legendLabel}>
        {label}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.legendPct}>
        ({percentage}%)
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  otherAmount: {
    alignItems: 'flex-end',
  },
  container: {
    gap: Spacing.three,
  },
  loading: {
    marginTop: Spacing.five,
  },
  card: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  total: {
    fontSize: 26,
    lineHeight: 32,
  },
  composition: {
    gap: Spacing.two,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
    minWidth: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  legendPct: {
    fontSize: 12,
    lineHeight: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  others: {
    gap: Spacing.two,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  currencyBlock: {
    gap: Spacing.one + Spacing.half,
  },
  otherAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.two,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  accountName: {
    flex: 1,
  },
});
