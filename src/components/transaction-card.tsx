import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TransactionWithDetails } from '@/lib/queries/transactions';
import { formatCurrency } from '@/lib/utils/currency';
import { formatRowDate } from '@/lib/utils/date';

type TransactionCardProps = {
  transaction: TransactionWithDetails;
  // false kalau daftar sudah difilter per akun — nama akun tidak perlu diulang di tiap baris.
  showAccount?: boolean;
  onEdit: (transaction: TransactionWithDetails) => void;
  onDelete: (transaction: TransactionWithDetails) => void;
};

// Content card baris transaksi — mirror struktur di family-finance-app/components/TransactionsManager.tsx:
// ikon kategori, deskripsi (fallback nama kategori), jumlah +/- berwarna + tanggal, baris
// "Kategori - Sub · Akun · Anggota", lalu aksi Ubah/Hapus (transfer tidak bisa diubah).
export function TransactionCard({ transaction: t, showAccount = true, onEdit, onDelete }: TransactionCardProps) {
  const theme = useTheme();
  const isIncome = t.type === 'Pemasukan';

  const meta = [
    t.subcategoryName ? `${t.categoryName} - ${t.subcategoryName}` : t.categoryName,
    showAccount && t.accountName,
    t.memberName,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <CategoryIcon name={t.categoryName} icon={t.categoryIcon} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
            {t.description || t.categoryName}
          </ThemedText>
          <View style={styles.amountBlock}>
            <ThemedText type="smallBold" themeColor={isIncome ? 'success' : 'danger'}>
              {isIncome ? '+' : '-'} {formatCurrency(t.amount, 'IDR')}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.dateText}>
              {formatRowDate(t.date)}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {meta}
        </ThemedText>

        <View style={styles.actions}>
          {!t.transferPairId && (
            <Pressable onPress={() => onEdit(t)} hitSlop={8}>
              <ThemedText type="small" themeColor="accent">
                Ubah
              </ThemedText>
            </Pressable>
          )}
          <Pressable onPress={() => onDelete(t)} hitSlop={8}>
            <ThemedText type="small" themeColor="danger">
              Hapus
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  amountBlock: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 10,
    lineHeight: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
});
