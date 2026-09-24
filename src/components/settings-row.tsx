import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type SettingsRowProps = PressableProps & {
  label: string;
  sublabel?: string;
};

export function SettingsRow({ label, sublabel, style, ...rest }: SettingsRowProps) {
  return (
    <Pressable style={style} {...rest}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <View style={styles.labelGroup}>
          <ThemedText type="default">{label}</ThemedText>
          {sublabel && (
            <ThemedText type="small" themeColor="textSecondary">
              {sublabel}
            </ThemedText>
          )}
        </View>
        <ThemedText type="default" themeColor="textSecondary">
          ›
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  labelGroup: {
    gap: Spacing.half,
  },
});
