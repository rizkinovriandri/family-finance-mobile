import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { ChipSelect } from '@/components/chip-select';
import { DateField } from '@/components/date-field';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { BOND_TYPES, COUPON_FREQUENCIES, FUND_TYPES, GOLD_TYPES } from '@/constants/enums';
import { Spacing } from '@/constants/theme';
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

type HoldingFormProps = {
  category: InvestmentCategory;
  initialValues?: Partial<HoldingFormValues>;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: HoldingFormValues) => void;
};

// parseAmount paham format Indonesia ("1.500" = seribu lima ratus), tapi angka desimal 3 digit yang
// tampil apa adanya di form ubah (mis. berat emas "0.125") ambigu — kalau teks belum diubah, pakai nilai aslinya.
function numeric(text: string, original?: number | null) {
  if (original !== undefined && original !== null && text === String(original)) return original;
  return parseAmount(text);
}

export function HoldingForm({ category, initialValues, submitLabel, loading, error, onSubmit }: HoldingFormProps) {
  const [values, setValues] = useState<HoldingFormValues>({ ...EMPTY_FORM, ...initialValues, category });
  const [quantityText, setQuantityText] = useState(String(values.quantity ?? 0));
  const [purchasePriceText, setPurchasePriceText] = useState(String(values.purchase_price ?? 0));
  const [currentPriceText, setCurrentPriceText] = useState(String(values.current_price ?? 0));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [couponRateText, setCouponRateText] = useState(String(values.coupon_rate ?? ''));

  function set<K extends keyof HoldingFormValues>(key: K, value: HoldingFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    const quantity = numeric(quantityText, initialValues?.quantity);
    const purchasePrice = numeric(purchasePriceText, initialValues?.purchase_price);
    const currentPrice = numeric(currentPriceText, initialValues?.current_price);
    if (quantity <= 0) return setValidationError('Jumlah harus lebih dari 0.');
    if (purchasePrice <= 0 || currentPrice <= 0) return setValidationError('Harga beli dan harga terkini harus lebih dari 0.');
    setValidationError(null);

    onSubmit({
      ...values,
      quantity,
      purchase_price: purchasePrice,
      current_price: currentPrice,
      coupon_rate: category === 'obligasi_sukuk' ? numeric(couponRateText, initialValues?.coupon_rate) : undefined,
    });
  }

  const canSubmit = values.name.trim().length > 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <TextField
          label={category === 'saham' ? 'Nama saham' : 'Nama instrumen'}
          value={values.name}
          onChangeText={(text) => set('name', text)}
          placeholder={category === 'saham' ? 'mis. BBCA' : 'mis. Manulife Dana Saham'}
        />

        {category === 'saham' && (
          <TextField
            label="Kode saham"
            value={values.ticker_code ?? ''}
            onChangeText={(text) => set('ticker_code', text.toUpperCase())}
            placeholder="mis. BBCA"
            autoCapitalize="characters"
          />
        )}

        {category === 'reksadana' && (
          <>
            <TextField
              label="Manajer Investasi"
              value={values.fund_manager ?? ''}
              onChangeText={(text) => set('fund_manager', text)}
              placeholder="mis. Manulife Aset Manajemen"
            />
            <ChipSelect
              label="Jenis Reksadana"
              options={FUND_TYPES}
              value={(values.fund_type ?? 'Pasar Uang') as (typeof FUND_TYPES)[number]}
              onChange={(v) => set('fund_type', v)}
            />
          </>
        )}

        {category === 'obligasi_sukuk' && (
          <>
            <TextField
              label="Penerbit"
              value={values.issuer ?? ''}
              onChangeText={(text) => set('issuer', text)}
              placeholder="mis. Pemerintah RI"
            />
            <ChipSelect
              label="Jenis Obligasi/Sukuk"
              options={BOND_TYPES}
              value={(values.bond_type ?? 'Obligasi Pemerintah') as (typeof BOND_TYPES)[number]}
              onChange={(v) => set('bond_type', v)}
            />
            <TextField
              label="Kupon (% per tahun)"
              value={couponRateText}
              onChangeText={setCouponRateText}
              keyboardType="numeric"
              placeholder="0"
            />
            <ChipSelect
              label="Frekuensi Kupon"
              options={COUPON_FREQUENCIES}
              value={(values.coupon_frequency ?? 'Tahunan') as (typeof COUPON_FREQUENCIES)[number]}
              onChange={(v) => set('coupon_frequency', v)}
            />
            <DateField
              label="Tanggal jatuh tempo"
              value={values.maturity_date ?? ''}
              onChange={(v) => set('maturity_date', v)}
            />
          </>
        )}

        {category === 'emas' && (
          <ChipSelect
            label="Jenis Emas"
            options={GOLD_TYPES}
            value={(values.gold_type ?? 'Fisik/Batangan') as (typeof GOLD_TYPES)[number]}
            onChange={(v) => set('gold_type', v)}
          />
        )}

        <TextField
          label="Platform/tempat beli (opsional)"
          value={values.platform ?? ''}
          onChangeText={(text) => set('platform', text)}
          placeholder="mis. Bibit, Ajaib, Pegadaian"
        />

        <DateField label="Tanggal beli" value={values.purchase_date} onChange={(v) => set('purchase_date', v)} />

        <TextField
          label={category === 'emas' ? 'Berat (gram)' : 'Jumlah/lot/unit'}
          value={quantityText}
          onChangeText={setQuantityText}
          keyboardType="numeric"
          placeholder="0"
        />

        <TextField
          label="Harga beli per satuan"
          value={purchasePriceText}
          onChangeText={setPurchasePriceText}
          keyboardType="numeric"
          placeholder="0"
        />

        <TextField
          label="Harga terkini per satuan"
          value={currentPriceText}
          onChangeText={setCurrentPriceText}
          keyboardType="numeric"
          placeholder="0"
        />

        <TextField
          label="Catatan (opsional)"
          value={values.notes ?? ''}
          onChangeText={(text) => set('notes', text)}
          placeholder="Catatan tambahan..."
          multiline
        />

        {(validationError ?? error) && (
          <ThemedText type="small" themeColor="danger">
            {validationError ?? error}
          </ThemedText>
        )}

        <PrimaryButton
          label={loading ? 'Menyimpan...' : submitLabel}
          loading={loading}
          disabled={!canSubmit}
          onPress={handleSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  form: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
