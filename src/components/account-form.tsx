import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { ChipSelect } from '@/components/chip-select';
import { InvestmentHoldingFields } from '@/components/investment-holding-fields';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import {
  ACCOUNT_STATUSES,
  ACCOUNT_TYPES,
  CURRENCIES,
  getInvestmentCategoryForAccountType,
  isInvestmentAccountType,
} from '@/constants/enums';
import { Spacing } from '@/constants/theme';
import { useHoldingFormState } from '@/hooks/use-holding-form-state';
import { useFamily } from '@/lib/family-context';
import type { AccountFormValues } from '@/lib/queries/accounts';
import { listFamilyMembers } from '@/lib/queries/families';
import type { HoldingFormValues } from '@/lib/queries/holdings';
import { parseAmount } from '@/lib/utils/currency';

const EMPTY_FORM: AccountFormValues = {
  name: '',
  account_type: 'Tabungan',
  institution: '',
  currency: 'IDR',
  opening_balance: 0,
  status: 'Aktif',
  notes: '',
  owner_member_id: null,
};

const FORM_KEYS = Object.keys(EMPTY_FORM) as (keyof AccountFormValues)[];

// Hanya ambil field yang memang diedit form, supaya update tidak ikut mengirim id/family_id/created_at.
function pickFormValues(source?: Partial<AccountFormValues>): AccountFormValues {
  const picked: Partial<AccountFormValues> = {};
  if (source) {
    for (const key of FORM_KEYS) {
      if (key in source) (picked as Record<string, unknown>)[key] = source[key];
    }
  }
  return { ...EMPTY_FORM, ...picked };
}

type AccountFormProps = {
  initialValues?: Partial<AccountFormValues>;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  // holding cuma terisi saat tambah akun investasi baru (lihat showHoldingFields) — akun & holding
  // pertamanya divalidasi bareng di sini, tapi disimpan oleh pemanggil (butuh id akun yang baru dibuat).
  onSubmit: (values: AccountFormValues, holding?: HoldingFormValues) => void;
};

// Akun investasi (Saham/Reksadana/Obligasi/Emas) nilainya dihitung dari holding di Portofolio, bukan
// dari Saldo Awal + transaksi kas seperti akun biasa — jadi saat MENAMBAH akun baru bertipe investasi,
// form ini mengganti field generik (Institusi, Saldo awal, Pemilik, Mata uang, Status, Catatan) dengan
// field holding pertamanya sekalian (nama instrumen, berat/jumlah, harga beli, dst — lihat
// InvestmentHoldingFields), supaya user tidak perlu buka Portofolio secara terpisah cuma untuk holding
// pertama. Mirror family-finance-app/components/AccountsManager.tsx. Saat MENGUBAH akun investasi yang
// sudah ada, form tetap generik seperti biasa — holding-nya diubah lewat Portofolio.
export function AccountForm({ initialValues, submitLabel, loading, error, onSubmit }: AccountFormProps) {
  const { membership } = useFamily();
  const isNew = !initialValues;
  const [values, setValues] = useState<AccountFormValues>(() => {
    const picked = pickFormValues(initialValues);
    return initialValues ? picked : { ...picked, owner_member_id: membership?.id ?? null };
  });
  const [openingBalanceText, setOpeningBalanceText] = useState(String(values.opening_balance ?? 0));
  const [members, setMembers] = useState<{ id: string; display_name: string }[]>([]);
  const [holdingError, setHoldingError] = useState<string | null>(null);

  const investmentCategory = getInvestmentCategoryForAccountType(values.account_type);
  const showHoldingFields = isNew && investmentCategory !== null;
  const holdingState = useHoldingFormState(investmentCategory ?? 'saham');

  useEffect(() => {
    if (!membership) return;
    listFamilyMembers(membership.family_id)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [membership]);

  function set<K extends keyof AccountFormValues>(key: K, value: AccountFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (showHoldingFields) {
      if (!holdingState.values.name.trim()) {
        setHoldingError('Nama instrumen wajib diisi.');
        return;
      }
      const result = holdingState.getSubmitValues();
      if (!result.ok) {
        setHoldingError(result.error);
        return;
      }
      setHoldingError(null);
      onSubmit({ ...values, opening_balance: 0 }, result.values);
      return;
    }
    setHoldingError(null);
    onSubmit({ ...values, opening_balance: parseAmount(openingBalanceText) });
  }

  const canSubmit = values.name.trim().length > 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <TextField
          label="Nama rekening"
          value={values.name}
          onChangeText={(text) => set('name', text)}
          placeholder={showHoldingFields ? 'mis. RDN Mirae Asset, Bibit' : 'mis. BNI Tabungan'}
        />

        <ChipSelect
          label="Jenis akun"
          options={ACCOUNT_TYPES}
          value={values.account_type}
          onChange={(v) => set('account_type', v)}
        />

        {isNew && isInvestmentAccountType(values.account_type) && !investmentCategory && (
          <ThemedText type="small" themeColor="textSecondary">
            Jenis akun ini belum punya form holding khusus — buat akunnya dulu, isi detail investasinya
            nanti lewat halaman Portofolio.
          </ThemedText>
        )}

        {showHoldingFields && investmentCategory && (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Isi holding pertama untuk akun ini sekalian — bisa tambah lagi nanti di Portofolio.
            </ThemedText>
            <InvestmentHoldingFields category={investmentCategory} state={holdingState} />
          </>
        )}

        {!showHoldingFields && (
          <>
            <TextField
              label="Institusi (opsional)"
              value={values.institution ?? ''}
              onChangeText={(text) => set('institution', text)}
              placeholder="mis. Bank BNI"
            />

            <TextField
              label="Saldo awal"
              value={openingBalanceText}
              onChangeText={setOpeningBalanceText}
              keyboardType="numeric"
              placeholder="0"
            />

            {members.length > 0 && (
              <ChipSelect
                label="Pemilik"
                options={members.map((m) => m.display_name)}
                value={members.find((m) => m.id === values.owner_member_id)?.display_name ?? ''}
                onChange={(name) => set('owner_member_id', members.find((m) => m.display_name === name)?.id ?? null)}
              />
            )}

            <ChipSelect
              label="Mata uang"
              options={CURRENCIES}
              value={(values.currency ?? 'IDR') as (typeof CURRENCIES)[number]}
              onChange={(v) => set('currency', v)}
            />

            <ChipSelect
              label="Status"
              options={ACCOUNT_STATUSES}
              value={(values.status ?? 'Aktif') as (typeof ACCOUNT_STATUSES)[number]}
              onChange={(v) => set('status', v)}
            />

            <TextField
              label="Catatan (opsional)"
              value={values.notes ?? ''}
              onChangeText={(text) => set('notes', text)}
              placeholder="Catatan tambahan..."
              multiline
            />
          </>
        )}

        {(holdingError ?? error) && (
          <ThemedText type="small" themeColor="danger">
            {holdingError ?? error}
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
