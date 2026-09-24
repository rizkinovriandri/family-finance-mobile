import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MonthlyTrendPoint } from '@/lib/queries/dashboard';
import { formatCompactRupiah, getYAxisTicks } from '@/lib/utils/chart';

const CHART_HEIGHT = 112;

export function TrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  const theme = useTheme();
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const { chartMax, ticks } = getYAxisTicks(max);

  return (
    <View>
      <View style={[styles.plotRow, { height: CHART_HEIGHT }]}>
        <View style={styles.yAxis}>
          {ticks.map((t) => (
            <ThemedText key={t} type="small" themeColor="textSecondary" style={styles.tickLabel}>
              {formatCompactRupiah(t)}
            </ThemedText>
          ))}
        </View>

        <View style={styles.plot}>
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.gridLines}>
              {ticks.map((t) => (
                <View key={t} style={[styles.gridLine, { backgroundColor: theme.border }]} />
              ))}
            </View>
          </View>
          <View style={styles.bars}>
            {data.map((d) => (
              <View key={d.monthLabel} style={styles.barGroup}>
                <View style={[styles.bar, { height: `${(d.income / chartMax) * 100}%`, backgroundColor: theme.success }]} />
                <View style={[styles.bar, { height: `${(d.expense / chartMax) * 100}%`, backgroundColor: theme.danger }]} />
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.xAxisRow}>
        <View style={styles.yAxisSpacer} />
        <View style={styles.xLabels}>
          {data.map((d) => (
            <ThemedText key={d.monthLabel} type="small" themeColor="textSecondary" style={styles.xLabel}>
              {d.monthLabel}
            </ThemedText>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plotRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  yAxis: {
    width: 36,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tickLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
  plot: {
    flex: 1,
  },
  gridLines: {
    flex: 1,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: StyleSheet.hairlineWidth,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barGroup: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Spacing.half * 2,
  },
  bar: {
    width: 10,
    minHeight: 2,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  xAxisRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  yAxisSpacer: {
    width: 36,
  },
  xLabels: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
});
