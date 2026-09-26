import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/back-header';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFamily } from '@/lib/family-context';
import { updateMonthStartDay } from '@/lib/queries/families';
import { formatCycleLabel, getCycleStart } from '@/lib/utils/date';

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

// Tanggal Awal — mirror family-finance-app/components/StartDateSettings.tsx: tanggal mulainya
// "satu bulan" keuangan keluarga (1–28) untuk Budget, Beranda, dan Laporan.
export default function StartDateScreen() {
  const theme = useTheme();
  const { membership, refresh } = useFamily();
  const initialMonthStartDay = membership?.month_start_day ?? 1;

  const [monthStartDay, setMonthStartDay] = useState(initialMonthStartDay);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewLabel = formatCycleLabel(getCycleStart(new Date(), monthStartDay), monthStartDay);

  async function handleSave() {
    if (!membership) return;
    setLoading(true);
    setError(null);
    try {
      await updateMonthStartDay(membership.family_id, monthStartDay);
      await refresh();
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.');
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <BackHeader title="Tanggal Awal" />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="small" themeColor="textSecondary">
            Tanggal ini jadi acuan mulainya &quot;satu bulan&quot; untuk Budget, Beranda, dan Laporan — berguna kalau
            siklus keuangan keluarga tidak mengikuti tanggal 1 kalender (mis. mengikuti tanggal gajian).
          </ThemedText>

          <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
            <ThemedText type="small" themeColor="textSecondary">
              Pilih tanggal (1-28)
            </ThemedText>
            <View style={styles.grid}>
              {DAYS.map((day) => {
                const active = day === monthStartDay;
                return (
                  <Pressable
                    key={day}
                    onPress={() => setMonthStartDay(day)}
                    style={[styles.day, { backgroundColor: active ? theme.accent : theme.background }]}>
                    <ThemedText
                      type="small"
                      themeColor={active ? undefined : 'textSecondary'}
                      style={active ? styles.activeDay : undefined}>
                      {day}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
            <ThemedText type="small" themeColor="textSecondary">
              Siklus bulan berjalan
            </ThemedText>
            <ThemedText type="smallBold">{previewLabel}</ThemedText>
          </ThemedView>

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          <PrimaryButton
            label={loading ? 'Menyimpan...' : 'Simpan'}
            loading={loading}
            disabled={monthStartDay === initialMonthStartDay}
            onPress={handleSave}
          />
        </ScrollView>
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
    gap: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  day: {
    // 7 kolom: (100% - 6 gap) / 7
    width: '12.4%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
  },
  activeDay: {
    color: '#ffffff',
  },
});
