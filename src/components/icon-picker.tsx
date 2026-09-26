import { Pressable, StyleSheet, View } from 'react-native';

import { CATEGORY_ICON_OPTIONS } from '@/constants/category-icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconPickerProps = {
  value: string;
  onChange: (key: string) => void;
};

// Grid 6 kolom pilihan ikon kategori — mirror family-finance-app/components/IconPicker.tsx.
export function IconPicker({ value, onChange }: IconPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {CATEGORY_ICON_OPTIONS.map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            style={[
              styles.item,
              {
                borderColor: active ? theme.accent : theme.border,
                backgroundColor: active ? `${theme.accent}26` : 'transparent',
              },
            ]}>
            <Icon size={20} color={active ? theme.accent : theme.textSecondary} strokeWidth={1.75} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  item: {
    // 6 kolom: (100% - 5 gap) / 6
    width: '14.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Spacing.three,
  },
});
