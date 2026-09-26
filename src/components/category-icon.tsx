import { StyleSheet, Text, View } from 'react-native';

import { CATEGORY_ICONS } from '@/constants/category-icons';
import { getCategoryStyle } from '@/constants/enums';

const VARIANTS = {
  box: { size: 36, radius: 8, icon: 18, filled: true },
  lg: { size: 48, radius: 12, icon: 24, filled: true },
  chip: { size: 20, radius: 10, icon: 12, filled: true },
  // Glyph polos tanpa latar sendiri — dipakai di tile Tambah Cepat.
  bare: { size: 32, radius: 0, icon: 32, filled: false },
} as const;

type CategoryIconProps = {
  name: string;
  icon?: string | null;
  variant?: keyof typeof VARIANTS;
};

// Satu sumber tampilan ikon kategori (warna + glyph) supaya konsisten di semua tempat yang
// menampilkan kategori — mirror family-finance-app/components/CategoryIcon.tsx.
export function CategoryIcon({ name, icon, variant = 'box' }: CategoryIconProps) {
  const style = getCategoryStyle(name);
  const Icon = icon ? CATEGORY_ICONS[icon] : undefined;
  const v = VARIANTS[variant];

  return (
    <View
      style={[
        styles.wrapper,
        { width: v.size, height: v.size, borderRadius: v.radius },
        v.filled && { backgroundColor: style.mutedBg },
      ]}>
      {Icon ? (
        <Icon size={v.icon} color={style.bright} strokeWidth={1.75} />
      ) : (
        <Text style={[styles.letter, { color: style.bright, fontSize: v.icon * 0.7 }]}>
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  letter: {
    fontWeight: '600',
  },
});
