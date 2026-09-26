// Kurs estimasi ke Rupiah dari Frankfurter (gratis, tanpa API key, data ECB, diperbarui harian).
// Hanya untuk tampilan estimasi — angka di database tetap dalam mata uang aslinya.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

let cache: { fetchedAt: number; idrPerUnit: Record<string, number> } | null = null;

export async function getIdrRates(currencies: readonly string[]): Promise<Record<string, number>> {
  const wanted = Array.from(new Set(currencies.filter((c) => c !== 'IDR')));
  if (wanted.length === 0) return {};

  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS && wanted.every((c) => c in cache!.idrPerUnit)) {
    return cache.idrPerUnit;
  }

  const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=IDR&symbols=${wanted.join(',')}`);
  if (!response.ok) throw new Error('Gagal memuat kurs.');
  const json = (await response.json()) as { rates: Record<string, number> };

  // API mengembalikan berapa unit mata uang asing per 1 IDR — dibalik jadi Rupiah per 1 unit.
  const idrPerUnit: Record<string, number> = { ...(cache?.idrPerUnit ?? {}) };
  for (const [currency, rate] of Object.entries(json.rates)) {
    if (rate > 0) idrPerUnit[currency] = 1 / rate;
  }
  cache = { fetchedAt: Date.now(), idrPerUnit };
  return idrPerUnit;
}
