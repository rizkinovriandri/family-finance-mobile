import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { INVESTMENT_CATEGORIES, getInvestmentCategoryForAccountType } from '@/constants/enums';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useRealtimeTick } from '@/hooks/use-realtime-tick';
import { useTheme } from '@/hooks/use-theme';
import { getAccount } from '@/lib/queries/accounts';
import { deleteHolding, listHoldingsForAccount, type Holding } from '@/lib/queries/holdings';
import { confirmDestructive } from '@/lib/utils/confirm';
import { formatCurrency } from '@/lib/utils/currency';
import { refreshGoldPrices } from '@/lib/utils/refresh-gold-prices';
import type { Database } from '@/lib/database.types';

// Saham dicatat dalam lembar (sama dengan web); 1 lot = 100 lembar.
const SHARES_PER_LOT = 100;

function formatLots(shares: number) {
  const lots = shares / SHARES_PER_LOT;
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(lots)} lot`;
}

function formatGrams(grams: number) {
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(grams)} gr`;
}

// Kolom rincian holding (Saham & Emas): jumlah · harga beli · harga terkini · profit/loss ·
// profit/loss %, masing-masing dengan judul kecil di atasnya.
function DetailCell({
  label,
  text,
  color,
  weight,
  align = 'left',
}: {
  label: string;
  text: string;
  color?: 'success' | 'danger';
  weight: number;
  align?: 'left' | 'right';
}) {
  return (
    <View style={{ flex: weight }}>
      <ThemedText themeColor="textSecondary" numberOfLines={1} style={[styles.stockLabel, { textAlign: align }]}>
        {label}
      </ThemedText>
      <ThemedText
        type="small"
        themeColor={color}
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.stockValue, { textAlign: align }]}>
        {text}
      </ThemedText>
    </View>
  );
}

type AccountRow = Database['public']['Tables']['accounts']['Row'];

export default function HoldingsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [account, setAccount] = useState<AccountRow | null>(null);
  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reloadTick = useRealtimeTick(['investment_holdings'], account?.family_id);

  const load = useCallback(async () => {
    try {
      const [accountResult, holdingsResult] = await Promise.all([
        getAccount(id),
        listHoldingsForAccount(id),
      ]);
      setAccount(accountResult);
      setHoldings(holdingsResult);
      // Diam-diam di background — kegagalan (API harga emas down/berubah format) tidak boleh
      // mengganggu tampilan Portofolio, harga lama (tersimpan) tetap dipakai.
      refreshGoldPrices(holdingsResult).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat portofolio.');
    }
  }, [id]);

  function handleEdit(h: Holding) {
    router.push({ pathname: '/accounts/[id]/holdings/[holdingId]', params: { id, holdingId: h.id } });
  }

  function handleDelete(h: Holding) {
    confirmDestructive('Hapus holding', `Hapus "${h.name}"? Tindakan ini tidak bisa dibatalkan.`, 'Hapus', async () => {
      try {
        await deleteHolding(h.id);
        setHoldings((prev) => prev?.filter((x) => x.id !== h.id) ?? prev);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal menghapus holding.');
      }
    });
  }

  useFocusEffect(
    useCallback(() => {
      load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadTick sengaja jadi dependency: naik saat ada perubahan realtime, memicu muat ulang
    }, [load, reloadTick])
  );

  const currency = account?.currency ?? 'IDR';
  const category = account ? getInvestmentCategoryForAccountType(account.account_type) : null;
  const categoryLabel = INVESTMENT_CATEGORIES.find((c) => c.value === category)?.label ?? account?.account_type;

  const totals = useMemo(() => {
    if (!holdings) return { currentValue: 0, gainLoss: 0 };
    return holdings.reduce(
      (acc, h) => ({
        currentValue: acc.currentValue + h.currentValue,
        gainLoss: acc.gainLoss + h.gainLoss,
      }),
      { currentValue: 0, gainLoss: 0 }
    );
  }, [holdings]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="accent">
              ‹ Kembali
            </ThemedText>
          </Pressable>
          {category && (
            <Pressable onPress={() => router.push({ pathname: '/accounts/[id]/holdings/new', params: { id } })}>
              <ThemedText type="smallBold" themeColor="accent">
                + Tambah
              </ThemedText>
            </Pressable>
          )}
        </View>

        <View>
          <ThemedText type="title" style={styles.title}>
            Portofolio
          </ThemedText>
          {account && (
            <ThemedText type="small" themeColor="textSecondary">
              {account.name} · {categoryLabel}
            </ThemedText>
          )}
        </View>

        {error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}

        {!holdings && !error && <ActivityIndicator style={styles.loading} />}

        {holdings && (
          <>
            <ThemedView type="backgroundElement" style={styles.summaryCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Total Nilai
              </ThemedText>
              <ThemedText type="title" style={styles.summaryAmount}>
                {formatCurrency(totals.currentValue, account?.currency ?? 'IDR')}
              </ThemedText>
              <ThemedText type="small" themeColor={totals.gainLoss >= 0 ? 'success' : 'danger'}>
                {totals.gainLoss >= 0 ? '+' : ''}
                {formatCurrency(totals.gainLoss, account?.currency ?? 'IDR')} untung/rugi
              </ThemedText>
            </ThemedView>

            {holdings.length === 0 && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Belum ada holding. Tambah holding pertama di akun ini.
              </ThemedText>
            )}
          </>
        )}

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {!!holdings?.length && (
          <ThemedView type="backgroundElement" style={[styles.group, { borderColor: theme.border }]}>
          {holdings.map((h, index) => (
              <ThemedView
                key={h.id}
                type="backgroundElement"
                style={[styles.card, index > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
                <View style={styles.cardTop}>
                  <ThemedText type="smallBold" numberOfLines={1} style={styles.cardTitleText}>
                    {h.category === 'saham' && h.ticker_code ? h.ticker_code : h.name}
                  </ThemedText>
                  <ThemedText type="smallBold">{formatCurrency(h.currentValue, currency)}</ThemedText>
                </View>
                {h.category === 'saham' || h.category === 'emas' ? (
                  <View style={styles.stockRow}>
                    <DetailCell
                      label={h.category === 'saham' ? 'Lot' : 'Berat'}
                      text={h.category === 'saham' ? formatLots(h.quantity) : formatGrams(h.quantity)}
                      weight={0.8}
                    />
                    <DetailCell
                      label={h.category === 'saham' ? 'Rata-rata' : 'Harga Beli'}
                      text={formatCurrency(h.purchase_price, currency)}
                      weight={1.2}
                    />
                    <DetailCell
                      label={h.category === 'saham' ? 'Harga' : 'Harga Kini'}
                      text={formatCurrency(h.current_price, currency)}
                      weight={1.2}
                    />
                    <DetailCell
                      label="P/L"
                      text={`${h.gainLoss >= 0 ? '+' : ''}${formatCurrency(h.gainLoss, currency)}`}
                      color={h.gainLoss >= 0 ? 'success' : 'danger'}
                      weight={1.5}
                    />
                    <DetailCell
                      label="P/L %"
                      text={`${h.gainLoss >= 0 ? '+' : ''}${h.gainLossPercentage.toFixed(1)}%`}
                      color={h.gainLoss >= 0 ? 'success' : 'danger'}
                      weight={0.9}
                      align="right"
                    />
                  </View>
                ) : (
                  <View style={styles.cardSubRow}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {h.quantity} @ {formatCurrency(h.current_price, currency)}
                    </ThemedText>
                    <ThemedText type="small" themeColor={h.gainLoss >= 0 ? 'success' : 'danger'}>
                      {h.gainLoss >= 0 ? '+' : ''}
                      {h.gainLossPercentage.toFixed(1)}%
                    </ThemedText>
                  </View>
                )}

                <View style={styles.actions}>
                  <Pressable onPress={() => handleEdit(h)} hitSlop={8}>
                    <ThemedText type="small" themeColor="accent" style={styles.actionText}>
                      Ubah
                    </ThemedText>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(h)} hitSlop={8}>
                    <ThemedText type="small" themeColor="danger" style={styles.actionText}>
                      Hapus
                    </ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
          ))}
          </ThemedView>
          )}
        </ScrollView>
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
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  loading: {
    marginTop: Spacing.five,
  },
  summaryCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  summaryAmount: {
    fontSize: 26,
    lineHeight: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  group: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
  },
  card: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardTitleText: {
    flexShrink: 1,
  },
  stockRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  stockLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
  stockValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  cardSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  actionText: {
    fontSize: 12,
    lineHeight: 15,
  },
});
