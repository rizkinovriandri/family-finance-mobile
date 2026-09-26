import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HoldingForm } from '@/components/holding-form';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { deleteHolding, getHolding, updateHolding, type HoldingFormValues } from '@/lib/queries/holdings';
import type { Database } from '@/lib/database.types';

type HoldingRow = Database['public']['Tables']['investment_holdings']['Row'];

export default function EditHoldingScreen() {
  const { holdingId } = useLocalSearchParams<{ id: string; holdingId: string }>();
  const [holding, setHolding] = useState<HoldingRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getHolding(holdingId)
      .then(setHolding)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Gagal memuat holding.'));
  }, [holdingId]);

  async function handleSubmit(values: HoldingFormValues) {
    setLoading(true);
    setError(null);
    try {
      await updateHolding(holdingId, values);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      await deleteHolding(holdingId);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus holding.');
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="smallBold" themeColor="accent">
              Batal
            </ThemedText>
          </Pressable>
          <ThemedText type="smallBold">Ubah Holding</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {loadError ? (
          <ThemedText type="small" themeColor="danger">
            {loadError}
          </ThemedText>
        ) : !holding ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          <>
            <HoldingForm
              category={holding.category}
              initialValues={holding}
              submitLabel="Simpan Perubahan"
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
            />
            <PrimaryButton label="Hapus Holding" variant="danger" onPress={handleDelete} />
          </>
        )}
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
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 40,
  },
  loading: {
    marginTop: Spacing.five,
  },
});
