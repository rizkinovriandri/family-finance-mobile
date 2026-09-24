import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountForm } from '@/components/account-form';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { deleteAccount, getAccount, updateAccount, type AccountFormValues } from '@/lib/queries/accounts';
import type { Database } from '@/lib/database.types';

type AccountRow = Database['public']['Tables']['accounts']['Row'];

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [account, setAccount] = useState<AccountRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getAccount(id)
      .then(setAccount)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Gagal memuat rekening.'));
  }, [id]);

  async function handleSubmit(values: AccountFormValues) {
    setLoading(true);
    setError(null);
    try {
      await updateAccount(id, values);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
      setLoading(false);
    }
  }

  function handleDelete() {
    Alert.alert('Hapus rekening', `Hapus "${account?.name ?? 'rekening ini'}"? Tindakan ini tidak bisa dibatalkan.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          setError(null);
          try {
            await deleteAccount(id);
            router.back();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal menghapus rekening.');
            setLoading(false);
          }
        },
      },
    ]);
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
          <ThemedText type="smallBold">Ubah Rekening</ThemedText>
          <ThemedView style={styles.headerSpacer} />
        </ThemedView>

        {loadError ? (
          <ThemedText type="small" themeColor="danger">
            {loadError}
          </ThemedText>
        ) : !account ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          <>
            <AccountForm
              initialValues={account}
              submitLabel="Simpan Perubahan"
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
            />
            <PrimaryButton label="Hapus Rekening" variant="danger" onPress={handleDelete} />
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
