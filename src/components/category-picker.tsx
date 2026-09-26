import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Category } from '@/lib/queries/categories';

type CategoryPickerProps = {
  label: string;
  categories: readonly Category[];
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
};

// Pemilih kategori berbentuk chip beraturan (wrap) dengan ikon kategori.
export function CategoryPicker({ label, categories, value, onChange, error }: CategoryPickerProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.wrap}>
        {categories.map((c) => {
          const selected = c.id === value;
          return (
            <Pressable
              key={c.id}
              onPress={() => onChange(c.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                  borderColor: selected ? theme.accent : theme.border,
                },
              ]}>
              <CategoryIcon name={c.name} icon={c.icon} variant="chip" />
              <ThemedText type="small" themeColor={selected ? undefined : 'textSecondary'}>
                {c.name}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {categories.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Belum ada kategori.
        </ThemedText>
      )}
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
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
