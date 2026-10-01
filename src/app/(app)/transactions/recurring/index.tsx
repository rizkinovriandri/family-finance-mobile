import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/back-header';
import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useRealtimeTick } from '@/hooks/use-realtime-tick';
import { useTheme } from '@/hooks/use-theme';
import { useFamily } from '@/lib/family-context';
import {
  deleteRecurringTransaction,
  listRecurringTransactions,
  setRecurringActive,
  type RecurringTransactionWithDetails,
} from '@/lib/queries/recurring-transactions';
import { confirmDestructive } from '@/lib/utils/confirm';
import { formatCurrency } from '@/lib/utils/currency';
import { formatShortDate } from '@/lib/utils/date';

function money(amount: number) {
  return formatCurrency(amount, 'IDR');
}

export default function RecurringTransactionsScreen() {
  const theme = useTheme();
  const { membership } = useFamily();
  const reloadTick = useRealtimeTick(['recurring_transactions', 'categories', 'subcategories', 'accounts'], membership?.family_id);
  const [items, setItems] = useState<RecurringTransactionWithDetails[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!membership) return;
    try {
      setItems(await listRecurringTransactions(membership.family_id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat transaksi berulang.');
    }
  }, [membership]);

  useFocusEffect(
    useCallback(() => {
      load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadTick sengaja jadi dependency: naik saat ada perubahan realtime, memicu muat ulang
    }, [load, reloadTick])
  );

  async function handleToggleActive(item: RecurringTransactionWithDetails, value: boolean) {
    setItems((prev) => prev?.map((x) => (x.id === item.id ? { ...x, isActive: value } : x)) ?? prev);
    try {
      await setRecurringActive(item.id, value);
    } catch (err) {
      setItems((prev) => prev?.map((x) => (x.id === item.id ? { ...x, isActive: !value } : x)) ?? prev);
      setError(err instanceof Error ? err.message : 'Gagal mengubah status.');
    }
  }

  function handleDelete(item: RecurringTransactionWithDetails) {
    confirmDestructive('Hapus transaksi berulang', `Hapus jadwal "${item.description || item.categoryName}"?`, 'Hapus', async () => {
      try {
        await deleteRecurringTransaction(item.id);
        setItems((prev) => prev?.filter((x) => x.id !== item.id) ?? prev);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal menghapus transaksi berulang.');
      }
    });
  }

  const addButton = (
    <Pressable onPress={() => router.push('/transactions/recurring/new')}>
      <ThemedText type="smallBold" themeColor="accent">
        + Tambah
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <BackHeader title="Transaksi Berulang" right={addButton} />

        {error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}

        {items === null && !error ? (
          <ActivityIndicator style={styles.loading} />
        ) : items && items.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Belum ada transaksi berulang. Tambahkan untuk tagihan atau pemasukan rutin, mis. listrik
            atau gaji.
          </ThemedText>
        ) : items ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <ThemedView type="backgroundElement" style={[styles.list, { borderColor: theme.border }]}>
              {items.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.item,
                    index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                    !item.isActive && styles.itemInactive,
                  ]}>
                  <View style={styles.itemTop}>
                    <CategoryIcon name={item.categoryName} icon={item.categoryIcon} variant="lg" />
                    <View style={styles.itemBody}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {item.description || item.categoryName}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {item.categoryName}
                        {item.subcategoryName ? ` · ${item.subcategoryName}` : ''} · {item.accountName}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.frequency} · Berikutnya {formatShortDate(item.nextDueDate)}
                      </ThemedText>
                    </View>
                    <View style={styles.itemRight}>
                      <ThemedText type="smallBold" themeColor={item.type === 'Pemasukan' ? 'success' : undefined}>
                        {money(item.amount)}
                      </ThemedText>
                      <Switch
                        value={item.isActive}
                        onValueChange={(value) => handleToggleActive(item, value)}
                        trackColor={{ false: theme.border, true: theme.accent }}
                        thumbColor="#ffffff"
                      />
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <Pressable
                      onPress={() => router.push({ pathname: '/transactions/recurring/[id]', params: { id: item.id } })}
                      hitSlop={8}>
                      <ThemedText type="small" themeColor="accent">
                        Ubah
                      </ThemedText>
                    </Pressable>
                    <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                      <ThemedText type="small" themeColor="danger">
                        Hapus
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ThemedView>
          </ScrollView>
        ) : null}
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
  loading: {
    marginTop: Spacing.five,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  content: {
    paddingBottom: BottomTabInset + Spacing.four,
  },
  list: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  itemInactive: {
    opacity: 0.5,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  itemActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    // Sejajar dengan teks, bukan ikon (lebar ikon lg 48 + gap).
    paddingLeft: 48 + Spacing.three,
  },
});
