import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountForm } from '@/components/account-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useFamily } from '@/lib/family-context';
import { createAccount, type AccountFormValues } from '@/lib/queries/accounts';

export default function NewAccountScreen() {
  const { membership } = useFamily();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: AccountFormValues) {
    if (!membership) return;
    setLoading(true);
    setError(null);
    try {
      await createAccount(membership.family_id, values);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan rekening.');
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="smallBold" themeColor="accent">
              Batal
            </ThemedText>
          </Pressable>
          <ThemedText type="smallBold">Tambah Rekening</ThemedText>
          <ThemedView style={styles.headerSpacer} />
        </ThemedView>

        <AccountForm submitLabel="Simpan" loading={loading} error={error} onSubmit={handleSubmit} />
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
});
