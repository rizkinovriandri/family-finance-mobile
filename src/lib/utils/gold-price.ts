// Harga emas Antam per gram hari ini, dari logam-mulia-api (scrape anekalogam.co.id/logammulia.com) —
// API publik tidak resmi, gratis, tanpa API key. Kalau API ini down/berubah format, biarkan pemanggil
// menangkap error dan diamkan (lihat refresh-gold-prices.ts) — jangan sampai mengganggu form/halaman.
const GOLD_PRICE_API_URL = 'https://logam-mulia-api.iamutaki.workers.dev/api/prices/anekalogam';

type GoldPriceEntry = {
  materialType?: string;
  weight?: number;
  weightUnit?: string;
  sellPrice?: number;
};

// Data sumbernya berisi banyak varian produk per berat (mis. ada 2 entri berbeda untuk 1 gram: batangan
// polos vs "Certicard") — pilih varian batangan biasa (bukan Certicard) supaya konsisten dengan harga
// yang biasa dikutip sebagai "harga emas Antam hari ini".
export async function fetchGoldPricePerGram(): Promise<number> {
  const res = await fetch(GOLD_PRICE_API_URL);
  if (!res.ok) throw new Error(`Gagal mengambil harga emas (${res.status}).`);

  const json = await res.json();
  const entries: GoldPriceEntry[] = Array.isArray(json?.data) ? json.data : [];
  const oneGramEntries = entries.filter((e) => e.weight === 1 && e.weightUnit === 'gr');
  const best =
    oneGramEntries.find((e) => !e.materialType?.toLowerCase().includes('certicard')) ?? oneGramEntries[0];

  if (!best || typeof best.sellPrice !== 'number') throw new Error('Data harga emas tidak ditemukan.');
  return best.sellPrice;
}
