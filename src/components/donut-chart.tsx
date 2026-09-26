import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/lib/utils/currency';

export type DonutSlice = {
  key: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
};

const SIZE = 120;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Lingkaran SVG mulai menggambar di posisi jam 3; geser seperempat keliling supaya arc pertama
// mulai dari jam 12. Sengaja tidak pakai rotation/origin pada <G>: di web keduanya jadi atribut DOM
// `transform-origin` yang memicu warning "Invalid DOM property".
const START_OFFSET = CIRCUMFERENCE / 4;

type DonutChartProps = {
  slices: DonutSlice[];
  total: number;
  hideAmounts?: boolean;
  // Ganti isi tengah donut jadi "58% Terpakai" (halaman Budget) alih-alih total rupiah (Beranda).
  centerPercentage?: number;
};

export function DonutChart({ slices, total, hideAmounts, centerPercentage }: DonutChartProps) {
  const theme = useTheme();
  const sliceTotal = slices.reduce((sum, s) => sum + s.amount, 0);

  const arcs = slices.reduce<(DonutSlice & { length: number; offset: number })[]>((acc, s) => {
    const length = sliceTotal > 0 ? (s.amount / sliceTotal) * CIRCUMFERENCE : 0;
    const previous = acc[acc.length - 1];
    acc.push({ ...s, length, offset: previous ? previous.offset + previous.length : 0 });
    return acc;
  }, []);

  return (
    <View style={styles.row}>
      <View style={styles.donut}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={theme.backgroundSelected}
            strokeWidth={STROKE}
            fill="none"
          />
          {arcs.map((a) => (
            <Circle
              key={a.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={a.color}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${a.length} ${CIRCUMFERENCE - a.length}`}
              strokeDashoffset={START_OFFSET - a.offset}
            />
          ))}
        </Svg>
        <View style={styles.center}>
          {centerPercentage !== undefined ? (
            <>
              <ThemedText type="smallBold" style={styles.centerPercentage}>
                {centerPercentage}%
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerLabel}>
                Terpakai
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerLabel}>
                Total
              </ThemedText>
              <ThemedText type="smallBold" numberOfLines={1} adjustsFontSizeToFit style={styles.centerAmount}>
                {hideAmounts ? 'Rp ••••' : formatCurrency(total, 'IDR')}
              </ThemedText>
            </>
          )}
        </View>
      </View>

      <View style={styles.legend}>
        {slices.map((s) => (
          <View key={s.key} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.legendLabel}>
              {s.label}
            </ThemedText>
            <ThemedText type="smallBold">{s.percentage}%</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  donut: {
    width: SIZE,
    height: SIZE,
  },
  center: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: STROKE + Spacing.one,
  },
  centerLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  centerPercentage: {
    fontSize: 20,
    lineHeight: 24,
  },
  centerAmount: {
    fontSize: 13,
    lineHeight: 18,
  },
  legend: {
    flex: 1,
    gap: Spacing.two,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
  },
});
