import { StyleSheet, Text, View } from 'react-native';

import { CATEGORY_ICONS } from '@/constants/category-icons';
import { getCategoryStyle } from '@/constants/enums';

const VARIANTS = {
  // Tile kotak membulat (squircle) berwarna solid dengan glyph putih — mengacu ke design/mockup.png layar 3.
  box: { size: 44, radius: 14, icon: 22, filled: true, light: true },
  lg: { size: 48, radius: 15, icon: 24, filled: true, light: true },
  chip: { size: 22, radius: 7, icon: 13, filled: true, light: true },
  // Glyph putih tanpa latar sendiri — untuk di dalam tile berwarna solid milik pemanggil (Tambah Cepat).
  onTile: { size: 36, radius: 0, icon: 36, filled: false, light: true },
  // Glyph polos tanpa latar sendiri — dipakai di tile Tambah Cepat.
  bare: { size: 32, radius: 0, icon: 32, filled: false, light: false },
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
        v.filled && { backgroundColor: style.bright },
      ]}>
      {Icon ? (
        <Icon size={v.icon} color={v.light ? '#ffffff' : style.bright} strokeWidth={v.light ? 2 : 1.75} />
      ) : (
        <Text style={[styles.letter, { color: v.light ? '#ffffff' : style.bright, fontSize: v.icon * 0.7 }]}>
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
