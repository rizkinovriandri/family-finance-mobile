import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChartColors, Spacing } from '@/constants/theme';
import { useIdrRates } from '@/hooks/use-idr-rates';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/lib/utils/currency';

type BalanceSummaryCardProps = {
  tabungan: number;
  investasi: number;
  otherCurrencies?: { currency: string; total: number }[];
};

export function BalanceSummaryCard({ tabungan, investasi, otherCurrencies = [] }: BalanceSummaryCardProps) {
  const theme = useTheme();
  const idrRates = useIdrRates(otherCurrencies.map((c) => c.currency));
  const total = tabungan + investasi;

  const positiveTabungan = Math.max(tabungan, 0);
  const positiveInvestasi = Math.max(investasi, 0);
  const positiveTotal = positiveTabungan + positiveInvestasi;

  const series = [
    { label: 'Tabungan', value: tabungan, share: positiveTabungan, color: ChartColors.tabungan },
    { label: 'Investasi', value: investasi, share: positiveInvestasi, color: ChartColors.investasi },
  ];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        Total Saldo Gabungan (IDR)
      </ThemedText>
      <ThemedText type="title" style={styles.totalAmount}>
        {formatCurrency(total, 'IDR')}
      </ThemedText>

      <View style={[styles.bar, { backgroundColor: theme.backgroundSelected }]}>
        {positiveTotal > 0 &&
          series
            .filter((s) => s.share > 0)
            .map((s) => <View key={s.label} style={{ flex: s.share, backgroundColor: s.color }} />)}
      </View>

      <View style={styles.legend}>
        {series.map((s) => (
          <View key={s.label} style={styles.legendItem}>
            <View style={styles.legendLabelRow}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {s.label}
                {positiveTotal > 0 ? ` · ${Math.round((s.share / positiveTotal) * 100)}%` : ''}
              </ThemedText>
            </View>
            <ThemedText type="smallBold" numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(s.value, 'IDR')}
            </ThemedText>
          </View>
        ))}
      </View>

      {otherCurrencies.length > 0 && (
        <View style={[styles.otherCurrencies, { borderTopColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Mata uang lain (≈ estimasi kurs, tidak masuk total)
          </ThemedText>
          {otherCurrencies.map((c) => (
            <View key={c.currency} style={styles.otherRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {c.currency}
              </ThemedText>
              <View style={styles.otherAmount}>
                <ThemedText type="smallBold">{formatCurrency(c.total, c.currency)}</ThemedText>
                {idrRates[c.currency] !== undefined && (
                  <ThemedText type="small" themeColor="textSecondary">
                    ≈ {formatCurrency(c.total * idrRates[c.currency], 'IDR')}
                  </ThemedText>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
  },
  totalAmount: {
    fontSize: 22,
    lineHeight: 28,
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: Spacing.one,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  legendItem: {
    flex: 1,
  },
  legendLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  otherCurrencies: {
    gap: Spacing.one,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  otherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  otherAmount: {
    alignItems: 'flex-end',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
