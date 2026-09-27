import { useState } from 'react';

import type { InvestmentCategory } from '@/lib/database.types';
import type { HoldingFormValues } from '@/lib/queries/holdings';
import { parseAmount } from '@/lib/utils/currency';
import { toLocalISODate } from '@/lib/utils/date';

const EMPTY_FORM: HoldingFormValues = {
  category: 'saham',
  name: '',
  platform: '',
  purchase_date: toLocalISODate(new Date()),
  quantity: 0,
  purchase_price: 0,
  current_price: 0,
  notes: '',
};

// parseAmount paham format Indonesia ("1.500" = seribu lima ratus), tapi angka desimal 3 digit yang
// tampil apa adanya di form ubah (mis. berat emas "0.125") ambigu — kalau teks belum diubah, pakai nilai aslinya.
function numeric(text: string, original?: number | null) {
  if (original !== undefined && original !== null && text === String(original)) return original;
  return parseAmount(text);
}

// State + validasi form holding investasi — dipakai bareng oleh HoldingForm (Portofolio -> Tambah/Ubah
// Holding) dan AccountForm (Tambah Akun Investasi, mengisi holding pertama sekalian).
export function useHoldingFormState(category: InvestmentCategory, initialValues?: Partial<HoldingFormValues>) {
  const [values, setValues] = useState<HoldingFormValues>({ ...EMPTY_FORM, ...initialValues, category });
  const [quantityText, setQuantityText] = useState(String(values.quantity ?? 0));
  const [purchasePriceText, setPurchasePriceText] = useState(String(values.purchase_price ?? 0));
  const [currentPriceText, setCurrentPriceText] = useState(String(values.current_price ?? 0));
  const [couponRateText, setCouponRateText] = useState(String(values.coupon_rate ?? ''));

  function set<K extends keyof HoldingFormValues>(key: K, value: HoldingFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function getSubmitValues(): { ok: true; values: HoldingFormValues } | { ok: false; error: string } {
    const quantity = numeric(quantityText, initialValues?.quantity);
    const purchasePrice = numeric(purchasePriceText, initialValues?.purchase_price);
    const currentPrice = numeric(currentPriceText, initialValues?.current_price);
    if (quantity <= 0) return { ok: false, error: 'Jumlah harus lebih dari 0.' };
    if (purchasePrice <= 0 || currentPrice <= 0) {
      return { ok: false, error: 'Harga beli dan harga terkini harus lebih dari 0.' };
    }

    return {
      ok: true,
      values: {
        ...values,
        // Override, bukan andalkan values.category — kalau pemanggil mengubah `category` antar
        // render (mis. AccountForm saat "Jenis akun" diganti), useState awal tidak ikut re-init.
        category,
        quantity,
        purchase_price: purchasePrice,
        current_price: currentPrice,
        coupon_rate: category === 'obligasi_sukuk' ? numeric(couponRateText, initialValues?.coupon_rate) : undefined,
      },
    };
  }

  return {
    values,
    set,
    quantityText,
    setQuantityText,
    purchasePriceText,
    setPurchasePriceText,
    currentPriceText,
    setCurrentPriceText,
    couponRateText,
    setCouponRateText,
    getSubmitValues,
  };
}

export type HoldingFormState = ReturnType<typeof useHoldingFormState>;
