import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/back-header';
import { CategoryIcon } from '@/components/category-icon';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TransactionCard } from '@/components/transaction-card';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryStyle } from '@/constants/enums';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useRealtimeTick } from '@/hooks/use-realtime-tick';
import { useTheme } from '@/hooks/use-theme';
import { useFamily } from '@/lib/family-context';
import { listAccounts } from '@/lib/queries/accounts';
import { listCategories, type Category } from '@/lib/queries/categories';
import { deleteTransaction, listTransactions, type TransactionWithDetails } from '@/lib/queries/transactions';
import { confirmDestructive } from '@/lib/utils/confirm';
import { dateGroupLabel } from '@/lib/utils/date';

type Tab = 'Semua' | 'Pemasukan' | 'Pengeluaran';
type QuickTab = 'Pengeluaran' | 'Pemasukan';
type Row = { kind: 'header'; key: string; label: string } | { kind: 'tx'; key: string; transaction: TransactionWithDetails; isFirst: boolean; isLast: boolean };

const TABS: Tab[] = ['Semua', 'Pemasukan', 'Pengeluaran'];
const QUICK_TABS: QuickTab[] = ['Pengeluaran', 'Pemasukan'];
const QUICK_CATEGORY_COUNT = 8;
// Urutan kategori default (CLAUDE.md Bagian 5) dipakai sebagai proksi "paling sering dipakai":
// kategori sehari-hari duluan, catch-all ("Lainnya") di akhir.
const QUICK_PRIORITY: Record<QuickTab, readonly string[]> = {
  Pengeluaran: EXPENSE_CATEGORIES,
  Pemasukan: INCOME_CATEGORIES,
};

type TransactionsManagerProps = {
  // Diisi untuk riwayat satu akun (halaman Akun → Riwayat); kosong = semua transaksi keluarga.
  filterAccountId?: string;
};

// Daftar transaksi + Tambah Cepat + filter — dipakai tab Transaksi dan Riwayat per akun.
// Mirror family-finance-app/components/TransactionsManager.tsx (prop `filterAccountId`).
export function TransactionsManager({ filterAccountId }: TransactionsManagerProps) {
  const theme = useTheme();
  const { membership } = useFamily();
  const reloadTick = useRealtimeTick(['transactions'], membership?.family_id);
  const [transactions, setTransactions] = useState<TransactionWithDetails[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState<Tab>('Semua');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [quickTab, setQuickTab] = useState<QuickTab>('Pengeluaran');

  const load = useCallback(async () => {
    if (!membership) return;
    try {
      const [txs, cats, accountRows] = await Promise.all([
        listTransactions(membership.family_id),
        listCategories(),
        listAccounts(membership.family_id),
      ]);
      setTransactions(txs);
      setCategories(cats);
      setAccounts(accountRows.map((a) => ({ id: a.id, name: a.name })));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat transaksi.');
    }
  }, [membership]);

  // Refetch tiap kali tab ini kembali fokus (mis. balik dari layar tambah/ubah transaksi).
  useFocusEffect(
    useCallback(() => {
      load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadTick sengaja jadi dependency: naik saat ada perubahan realtime, memicu muat ulang
    }, [load, reloadTick])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const accountCount = accounts?.length ?? null;
  const filterAccount = filterAccountId ? (accounts?.find((a) => a.id === filterAccountId) ?? null) : null;
  const title = filterAccountId ? `Riwayat · ${filterAccount?.name ?? '...'}` : 'Transaksi';

  const quickCategories = useMemo(() => {
    const byType = categories.filter((c) => (quickTab === 'Pemasukan' ? c.type === 'income' : c.type === 'expense'));
    const priority = QUICK_PRIORITY[quickTab];
    return [...byType]
      .sort((a, b) => {
        const ai = priority.indexOf(a.name);
        const bi = priority.indexOf(b.name);
        if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      })
      .slice(0, QUICK_CATEGORY_COUNT);
  }, [categories, quickTab]);

  const usedCategories = useMemo(() => {
    const map = new Map<string, { name: string; icon: string | null }>();
    for (const t of transactions ?? []) {
      if (filterAccountId && t.accountId !== filterAccountId) continue;
      map.set(t.categoryId, { name: t.categoryName, icon: t.categoryIcon });
    }
    return Array.from(map, ([id, v]) => ({ id, ...v })).sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions, filterAccountId]);

  const rows = useMemo<Row[]>(() => {
    const q = search.trim().toLowerCase();
    const filtered = (transactions ?? []).filter((t) => {
      if (filterAccountId && t.accountId !== filterAccountId) return false;
      if (tab !== 'Semua' && t.type !== tab) return false;
      if (categoryFilter && t.categoryId !== categoryFilter) return false;
      if (!q) return true;
      return (
        (t.description ?? '').toLowerCase().includes(q) ||
        t.categoryName.toLowerCase().includes(q) ||
        t.accountName.toLowerCase().includes(q)
      );
    });

    const result: Row[] = [];
    let currentLabel: string | null = null;
    let lastPushedLabel: string | null = null;
    for (const t of filtered) {
      const label = dateGroupLabel(t.date);
      if (label !== currentLabel) {
        result.push({ kind: 'header', key: `h-${label}`, label });
        currentLabel = label;
      }
      result.push({ kind: 'tx', key: t.id, transaction: t, isFirst: currentLabel !== lastPushedLabel, isLast: false });
      lastPushedLabel = currentLabel;
    }
    // Item satu tanggal digabung jadi satu kartu — tandai item terakhir tiap grup supaya sudut bawahnya membulat.
    for (let i = 0; i < result.length; i++) {
      const row = result[i];
      const next = result[i + 1];
      if (row.kind === 'tx' && (!next || next.kind === 'header')) row.isLast = true;
    }
    return result;
  }, [transactions, tab, categoryFilter, search, filterAccountId]);

  function handleEdit(t: TransactionWithDetails) {
    router.push({ pathname: '/transactions/[id]', params: { id: t.id } });
  }

  function handleDelete(t: TransactionWithDetails) {
    confirmDestructive(
      'Hapus transaksi',
      t.transferPairId
        ? 'Hapus transfer ini? Kedua sisi transaksi (keluar & masuk) akan terhapus.'
        : 'Hapus transaksi ini?',
      'Hapus',
      async () => {
        try {
          await deleteTransaction(t.id, t.transferPairId);
          setTransactions((prev) => prev?.filter((x) => x.id !== t.id && x.id !== t.transferPairId) ?? prev);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Gagal menghapus transaksi.');
        }
      }
    );
  }

  // Riwayat per akun: form tambah otomatis memilih akun ini (mirror `defaultAccountId` di web).
  function openAdd(params: { type?: string; categoryId?: string } = {}) {
    router.push({
      pathname: '/transactions/new',
      params: filterAccountId ? { ...params, accountId: filterAccountId } : params,
    });
  }

  function openQuickAdd(categoryId: string) {
    openAdd({ type: quickTab, categoryId });
  }

  const addButton =
    accountCount !== 0 ? (
      <Pressable onPress={() => openAdd()}>
        <ThemedText type="smallBold" themeColor="accent">
          + Tambah
        </ThemedText>
      </Pressable>
    ) : null;

  const listHeader = (
    <View style={styles.headerContent}>
      <ThemedView type="backgroundElement" style={[styles.quickCard, { borderColor: theme.border }]}>
        <View style={styles.quickHeader}>
          <ThemedText type="smallBold">Tambah Cepat</ThemedText>
          <View style={[styles.quickSwitch, { backgroundColor: theme.background }]}>
            {QUICK_TABS.map((t) => (
              <Pressable
                key={t}
                onPress={() => setQuickTab(t)}
                style={[styles.quickSwitchItem, quickTab === t && { backgroundColor: theme.accent }]}>
                <ThemedText
                  type="small"
                  themeColor={quickTab === t ? undefined : 'textSecondary'}
                  style={[styles.quickSwitchLabel, quickTab === t && styles.activeLabel]}>
                  {t}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {quickCategories.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Belum ada kategori {quickTab.toLowerCase()}.
          </ThemedText>
        ) : (
          <View style={styles.quickGrid}>
            {quickCategories.map((c) => (
              <Pressable key={c.id} onPress={() => openQuickAdd(c.id)} style={styles.quickItem}>
                <View style={[styles.quickTile, { backgroundColor: getCategoryStyle(c.name).bright }]}>
                  <CategoryIcon name={c.name} icon={c.icon} variant="onTile" />
                </View>
                <ThemedText themeColor="textSecondary" numberOfLines={2} style={styles.quickLabel}>
                  {c.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}
      </ThemedView>

      <TextField label="" value={search} onChangeText={setSearch} placeholder="Cari transaksi..." />

      <View style={[styles.tabSwitch, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabSwitchItem, tab === t && { backgroundColor: theme.accent }]}>
            <ThemedText
              type="small"
              themeColor={tab === t ? undefined : 'textSecondary'}
              style={tab === t ? styles.activeLabel : undefined}>
              {t}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {usedCategories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterChip label="Semua Kategori" active={categoryFilter === ''} onPress={() => setCategoryFilter('')} />
          {usedCategories.map((c) => (
            <FilterChip
              key={c.id}
              label={c.name}
              icon={<CategoryIcon name={c.name} icon={c.icon} variant="chip" />}
              active={categoryFilter === c.id}
              onPress={() => setCategoryFilter(c.id)}
            />
          ))}
        </ScrollView>
      )}

      {error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {filterAccountId ? (
          <BackHeader title={title} right={addButton} />
        ) : (
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              {title}
            </ThemedText>
            {addButton}
          </ThemedView>
        )}

        {transactions === null && !error ? (
          <ActivityIndicator style={styles.loading} />
        ) : accountCount === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Tambah akun dulu sebelum mencatat transaksi.
          </ThemedText>
        ) : filterAccountId && accounts && !filterAccount ? (
          <ThemedText type="small" themeColor="danger" style={styles.emptyText}>
            Rekening tidak ditemukan.
          </ThemedText>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(row) => row.key}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              transactions ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                  Belum ada transaksi.
                </ThemedText>
              ) : null
            }
            renderItem={({ item }) =>
              item.kind === 'header' ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.groupLabel}>
                  {item.label}
                </ThemedText>
              ) : (
                <TransactionCard
                  transaction={item.transaction}
                  showAccount={!filterAccountId}
                  isFirst={item.isFirst}
                  isLast={item.isLast}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )
            }
            contentContainerStyle={styles.list}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          borderColor: active ? theme.accent : theme.border,
          backgroundColor: active ? theme.backgroundSelected : 'transparent',
        },
      ]}>
      {icon}
      <ThemedText type="small" themeColor={active ? undefined : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
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
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  loading: {
    marginTop: Spacing.five,
  },
  headerContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  list: {
    paddingBottom: BottomTabInset + Spacing.four,
  },
  groupLabel: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  activeLabel: {
    color: '#ffffff',
  },
  quickCard: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickSwitch: {
    flexDirection: 'row',
    borderRadius: Spacing.two,
    padding: Spacing.half * 2,
  },
  quickSwitchItem: {
    borderRadius: Spacing.two - Spacing.half,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one,
  },
  quickSwitchLabel: {
    fontSize: 11,
    lineHeight: 16,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Kompensasi padding sisi tiap item supaya tepi grid lurus dengan konten lain.
    marginHorizontal: -Spacing.one,
    rowGap: Spacing.two,
  },
  quickItem: {
    // 4 kolom sama lebar
    width: '25%',
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
    gap: Spacing.one,
  },
  quickTile: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
  },
  quickLabel: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  tabSwitch: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.half * 2,
    gap: Spacing.half,
  },
  tabSwitchItem: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
  },
  filterRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
  },
});
