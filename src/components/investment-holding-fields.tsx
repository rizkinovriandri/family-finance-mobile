import { ChipSelect } from '@/components/chip-select';
import { DateField } from '@/components/date-field';
import { TextField } from '@/components/text-field';
import { BOND_TYPES, COUPON_FREQUENCIES, FUND_TYPES, GOLD_TYPES } from '@/constants/enums';
import type { HoldingFormState } from '@/hooks/use-holding-form-state';
import type { InvestmentCategory } from '@/lib/database.types';

type InvestmentHoldingFieldsProps = {
  category: InvestmentCategory;
  state: HoldingFormState;
};

// Field umum (nama, platform, tanggal beli, jumlah/berat, harga beli, harga terkini, catatan) +
// field khusus tiap kategori investasi — dipakai bareng oleh HoldingForm (Portofolio) dan AccountForm
// (Tambah Akun Investasi, mengisi holding pertama sekalian). Mirror
// family-finance-app/components/InvestmentHoldingFields.tsx.
export function InvestmentHoldingFields({ category, state }: InvestmentHoldingFieldsProps) {
  const {
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
  } = state;

  return (
    <>
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
        label={category === 'emas' ? 'Harga beli per gram' : 'Harga beli per satuan'}
        value={purchasePriceText}
        onChangeText={setPurchasePriceText}
        keyboardType="numeric"
        placeholder="0"
      />

      <TextField
        label={category === 'emas' ? 'Harga terkini per gram' : 'Harga terkini per satuan'}
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
    </>
  );
}
