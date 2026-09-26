import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionForm, type TxType } from '@/components/transaction-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTransactionLookups } from '@/hooks/use-transaction-lookups';
import { useFamily } from '@/lib/family-context';
import { getTransaction, type TransactionRow } from '@/lib/queries/transactions';

type TransactionFormScreenProps = {
  // Diisi saat mengubah transaksi; kosong = tambah baru.
  transactionId?: string;
  initialType?: TxType;
  initialCategoryId?: string;
  // Akun yang dipilih awal (mis. saat menambah dari Riwayat per akun); default: akun default anggota.
  initialAccountId?: string;
};

// Layar penuh berisi form tambah/ubah transaksi — dipakai oleh transactions/new dan transactions/[id].
export function TransactionFormScreen({
  transactionId,
  initialType,
  initialCategoryId,
  initialAccountId,
}: TransactionFormScreenProps) {
  const { membership } = useFamily();
  const lookups = useTransactionLookups();
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [editingLoading, setEditingLoading] = useState(Boolean(transactionId));
  const [editingError, setEditingError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) return;
    let cancelled = false;
    getTransaction(transactionId)
      .then((row) => {
        if (!cancelled) setEditing(row);
      })
      .catch((err) => {
        if (!cancelled) setEditingError(err instanceof Error ? err.message : 'Gagal memuat transaksi.');
      })
      .finally(() => {
        if (!cancelled) setEditingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [transactionId]);

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
          <ThemedText type="smallBold">{transactionId ? 'Ubah Transaksi' : 'Tambah Transaksi'}</ThemedText>
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
            Tambah akun dulu sebelum mencatat transaksi.
          </ThemedText>
        ) : (
          <TransactionForm
            familyId={membership.family_id}
            accounts={lookups.accounts}
            members={lookups.members}
            categories={lookups.categories}
            subcategories={lookups.subcategories}
            defaultMemberId={membership.id}
            defaultAccountId={initialAccountId ?? membership.default_account_id ?? undefined}
            editing={editing}
            initialType={initialType}
            initialCategoryId={initialCategoryId}
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
