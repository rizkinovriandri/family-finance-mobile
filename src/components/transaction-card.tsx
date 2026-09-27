import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { IconUser } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CategoryPalette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TransactionWithDetails } from '@/lib/queries/transactions';
import { formatCurrency } from '@/lib/utils/currency';
import { formatRowDate } from '@/lib/utils/date';

type TransactionCardProps = {
  transaction: TransactionWithDetails;
  // false kalau daftar sudah difilter per akun — nama akun tidak perlu diulang di tiap baris.
  showAccount?: boolean;
  // Posisi dalam grup tanggal — item satu grup digabung jadi satu kartu (sudut atas/bawah hanya di ujung grup).
  isFirst?: boolean;
  isLast?: boolean;
  onEdit: (transaction: TransactionWithDetails) => void;
  onDelete: (transaction: TransactionWithDetails) => void;
};

// Oranye — dari CategoryPalette (warna seri chart/legend), bukan hex baru, supaya "Anggota" beda dari
// abu-abu textSecondary lain di baris meta tanpa nambah token warna.
const MemberColor = CategoryPalette[0];

// Content card baris transaksi — mirror struktur di family-finance-app/components/TransactionsManager.tsx:
// ikon kategori, deskripsi (fallback nama kategori), jumlah +/- berwarna + tanggal, baris
// "Kategori - Sub · Akun", lalu baris "Anggota". Nama anggota sengaja dipisah dari baris meta
// (beda dari web) supaya tidak ikut terpotong numberOfLines saat kategori/akun sudah panjang.
export function TransactionCard({ transaction: t, showAccount = true, isFirst = true, isLast = true, onEdit, onDelete }: TransactionCardProps) {
  const theme = useTheme();
  const isIncome = t.type === 'Pemasukan';

  const meta = [
    t.subcategoryName ? `${t.categoryName} - ${t.subcategoryName}` : t.categoryName,
    showAccount && t.accountName,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ThemedView
      type="backgroundElement"
      style={[
        styles.card,
        { borderColor: theme.border },
        isFirst && styles.cardFirst,
        isLast && styles.cardLast,
      ]}>
      <CategoryIcon name={t.categoryName} icon={t.categoryIcon} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.tight}>
              {t.description || t.categoryName}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.meta}>
              {meta}
            </ThemedText>
            <View style={styles.memberRow}>
              <IconUser size={12} color={MemberColor} />
              <ThemedText type="small" numberOfLines={1} style={[styles.meta, { color: MemberColor }]}>
                {t.memberName}
              </ThemedText>
            </View>
          </View>
          <View style={styles.amountBlock}>
            <ThemedText type="smallBold" themeColor={isIncome ? 'success' : 'danger'} style={styles.tight}>
              {isIncome ? '+' : '-'} {formatCurrency(t.amount, 'IDR')}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.dateText}>
              {formatRowDate(t.date)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.actions}>
          {!t.transferPairId && (
            <Pressable onPress={() => onEdit(t)} hitSlop={8}>
              <ThemedText type="small" themeColor="accent" style={styles.meta}>
                Ubah
              </ThemedText>
            </Pressable>
          )}
          <Pressable onPress={() => onDelete(t)} hitSlop={8}>
            <ThemedText type="small" themeColor="danger" style={styles.meta}>
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
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.half * 2,
  },
  cardFirst: {
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
  },
  cardLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: Spacing.three,
    borderBottomRightRadius: Spacing.three,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  tight: {
    lineHeight: 18,
  },
  meta: {
    fontSize: 12,
    lineHeight: 15,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
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
    marginTop: Spacing.half,
  },
});
