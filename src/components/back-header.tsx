import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconChevronLeft } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Header halaman detail: tombol kembali bulat + judul — mirror header di halaman
// Edit Profil / Kelola Kategori / Tanggal Awal family-finance-app.
export function BackHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Kembali"
        hitSlop={8}
        style={[styles.backButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <IconChevronLeft size={18} color={theme.textSecondary} />
      </Pressable>
      <ThemedText type="title" numberOfLines={1} style={styles.title}>
        {title}
      </ThemedText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 32,
  },
});
