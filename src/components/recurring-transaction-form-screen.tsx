import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecurringTransactionForm } from '@/components/recurring-transaction-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTransactionLookups } from '@/hooks/use-transaction-lookups';
import { useFamily } from '@/lib/family-context';
import { getRecurringTransaction, type RecurringTransactionRow } from '@/lib/queries/recurring-transactions';

type RecurringTransactionFormScreenProps = {
  // Diisi saat mengubah; kosong = tambah baru.
  recurringId?: string;
};

// Layar penuh berisi form tambah/ubah transaksi berulang — dipakai oleh recurring/new dan recurring/[id].
export function RecurringTransactionFormScreen({ recurringId }: RecurringTransactionFormScreenProps) {
  const { membership } = useFamily();
  const lookups = useTransactionLookups();
  const [editing, setEditing] = useState<RecurringTransactionRow | null>(null);
  const [editingLoading, setEditingLoading] = useState(Boolean(recurringId));
  const [editingError, setEditingError] = useState<string | null>(null);

  useEffect(() => {
    if (!recurringId) return;
    let cancelled = false;
    getRecurringTransaction(recurringId)
      .then((row) => {
        if (!cancelled) setEditing(row);
      })
      .catch((err) => {
        if (!cancelled) setEditingError(err instanceof Error ? err.message : 'Gagal memuat transaksi berulang.');
      })
      .finally(() => {
        if (!cancelled) setEditingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recurringId]);

  const ready = membership && !lookups.loading && !editingLoading;
  const error = lookups.error ?? editingError;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="smallBold" themeColor="accent">
              Batal
            </ThemedText>
          </Pressable>
          <ThemedText type="smallBold">{recurringId ? 'Ubah Transaksi Berulang' : 'Transaksi Berulang Baru'}</ThemedText>
          <ThemedView style={styles.headerSpacer} />
        </ThemedView>

        {error ? (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        ) : !ready ? (
          <ActivityIndicator style={styles.loading} />
        ) : lookups.accounts.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Tambah akun dulu sebelum membuat transaksi berulang.
          </ThemedText>
        ) : (
          <RecurringTransactionForm
            familyId={membership.family_id}
            accounts={lookups.accounts}
            members={lookups.members}
            categories={lookups.categories}
            subcategories={lookups.subcategories}
            defaultMemberId={membership.id}
            defaultAccountId={membership.default_account_id ?? undefined}
            editing={editing}
            onSaved={() => router.back()}
          />
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
