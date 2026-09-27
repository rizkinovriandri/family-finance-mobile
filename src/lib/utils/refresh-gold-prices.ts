import { updateHoldingCurrentPrice, type Holding } from '@/lib/queries/holdings';
import { fetchGoldPricePerGram } from '@/lib/utils/gold-price';

// Update current_price semua holding kategori Emas dari harga Antam hari ini (lihat gold-price.ts) —
// dipanggil otomatis begitu Portofolio dibuka (lihat accounts/[id]/holdings/index.tsx), mirror
// family-finance-app/lib/utils/refreshStockPrices.ts (versi Saham, lewat Yahoo Finance). Realtime sync
// yang sudah terpasang di layar Portofolio otomatis menampilkan hasilnya begitu update ini berhasil.
// Kegagalan (API down/berubah format) sengaja tidak dilempar ke pemanggil — harga lama tetap dipakai.
export async function refreshGoldPrices(holdings: readonly Holding[]): Promise<void> {
  const goldHoldings = holdings.filter((h) => h.category === 'emas');
  if (goldHoldings.length === 0) return;

  const price = await fetchGoldPricePerGram();
  await Promise.allSettled(goldHoldings.map((h) => updateHoldingCurrentPrice(h.id, price)));
}
