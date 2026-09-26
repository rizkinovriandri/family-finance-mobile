import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type ProgressBarProps = {
  // 0–100+, nilai di atas 100 dipotong ke 100 (bar penuh).
  percentage: number;
  color: string;
  height?: number;
};

export function ProgressBar({ percentage, color, height = 6 }: ProgressBarProps) {
  const theme = useTheme();
  const width = Math.max(0, Math.min(percentage, 100));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: theme.background }]}>
      <View style={{ width: `${width}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
});
