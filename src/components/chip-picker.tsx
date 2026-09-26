import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PickerOption = { value: string; label: string };

type ChipPickerProps = {
  label?: string;
  options: readonly PickerOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

// Seperti ChipSelect, tapi opsinya {value, label} — dipakai untuk akun/anggota/sub kategori
// yang dipilih lewat id (nama bisa kembar), bukan lewat teks.
export function ChipPicker({ label, options, value, onChange, error }: ChipPickerProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      {label && (
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.accent : theme.backgroundElement,
                  borderColor: selected ? theme.accent : theme.border,
                },
              ]}>
              <ThemedText
                type="small"
                themeColor={selected ? undefined : 'textSecondary'}
                style={selected ? styles.selectedLabel : undefined}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
      {error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  row: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  selectedLabel: {
    color: '#ffffff',
  },
});
