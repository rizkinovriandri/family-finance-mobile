import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChartColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/lib/utils/currency';

type BalanceSummaryCardProps = {
  tabungan: number;
  investasi: number;
};

export function BalanceSummaryCard({ tabungan, investasi }: BalanceSummaryCardProps) {
  const theme = useTheme();
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
