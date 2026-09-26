import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WeeklyPoint } from '@/lib/queries/reports';
import { formatCompactRupiah, getYAxisTicks } from '@/lib/utils/chart';

const CHART_HEIGHT = 96;
const Y_AXIS_WIDTH = 36;

type WeeklyBarChartProps = {
  data: WeeklyPoint[];
  color: string;
};

// Bar chart mingguan (W1–W4) dengan garis & label sumbu Y — mirror grafik di ReportsView web.
export function WeeklyBarChart({ data, color }: WeeklyBarChartProps) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((w) => w.amount));
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
            {data.map((w) => (
              <View key={w.weekLabel} style={styles.barSlot}>
                <View style={[styles.bar, { height: `${(w.amount / chartMax) * 100}%`, backgroundColor: color }]} />
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.xAxisRow}>
        <View style={{ width: Y_AXIS_WIDTH }} />
        <View style={styles.xLabels}>
          {data.map((w) => (
            <ThemedText key={w.weekLabel} type="small" themeColor="textSecondary" style={styles.xLabel}>
              {w.weekLabel}
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
    width: Y_AXIS_WIDTH,
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
  barSlot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    minHeight: 2,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  xAxisRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
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
