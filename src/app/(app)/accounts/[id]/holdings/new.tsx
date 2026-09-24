import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HoldingForm } from '@/components/holding-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getInvestmentCategoryForAccountType } from '@/constants/enums';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useFamily } from '@/lib/family-context';
import { getAccount } from '@/lib/queries/accounts';
import { createHolding, type HoldingFormValues } from '@/lib/queries/holdings';
import type { Database } from '@/lib/database.types';

type AccountRow = Database['public']['Tables']['accounts']['Row'];

export default function NewHoldingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { membership } = useFamily();
  const [account, setAccount] = useState<AccountRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAccount(id).then(setAccount);
  }, [id]);

  const category = account ? getInvestmentCategoryForAccountType(account.account_type) : null;

  async function handleSubmit(values: HoldingFormValues) {
    if (!membership) return;
    setLoading(true);
    setError(null);
    try {
      await createHolding(membership.family_id, id, values);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan holding.');
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
          <ThemedText type="smallBold">Tambah Holding</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {!category ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          <HoldingForm category={category} submitLabel="Simpan" loading={loading} error={error} onSubmit={handleSubmit} />
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
    paddingHorizontal: Spacing.four,
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
