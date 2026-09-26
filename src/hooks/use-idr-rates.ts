import { useEffect, useState } from 'react';

import { getIdrRates } from '@/lib/queries/exchange-rates';

// Rupiah per 1 unit tiap mata uang. Kosong selagi memuat atau kalau offline — tampilan estimasi
// cukup disembunyikan, tidak perlu error.
export function useIdrRates(currencies: readonly string[]): Record<string, number> {
  const [rates, setRates] = useState<Record<string, number>>({});
  const key = Array.from(new Set(currencies)).sort().join(',');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    getIdrRates(key.split(','))
      .then((result) => {
        if (!cancelled) setRates(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key]);

  return rates;
}
