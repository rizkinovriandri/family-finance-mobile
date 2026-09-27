import { StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/back-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePreferences } from '@/lib/preferences-context';

// Pengaturan — dipanggil dari Lainnya. Preferensi tampilan lokal per perangkat (AsyncStorage
// lewat PreferencesProvider), bukan data keluarga, jadi tidak lewat Supabase. Item pertama:
// default tampilan Total Saldo di Beranda (tampil/sembunyi saat aplikasi dibuka).
export default function SettingsScreen() {
  const theme = useTheme();
  const { defaultBalanceVisible, setDefaultBalanceVisible } = usePreferences();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <BackHeader title="Pengaturan" />

        <View style={styles.content}>
          <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <ThemedText type="smallBold">Tampilkan Total Saldo</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Atur apakah Total Saldo di Beranda ditampilkan atau disembunyikan secara default saat
                  aplikasi dibuka.
                </ThemedText>
              </View>
              <Switch
                value={defaultBalanceVisible}
                onValueChange={setDefaultBalanceVisible}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#ffffff"
              />
            </View>
          </ThemedView>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  card: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    padding: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowText: {
    flex: 1,
    gap: Spacing.one,
  },
});
