import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { ChipSelect } from '@/components/chip-select';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ACCOUNT_STATUSES, ACCOUNT_TYPES, CURRENCIES } from '@/constants/enums';
import { Spacing } from '@/constants/theme';
import { useFamily } from '@/lib/family-context';
import type { AccountFormValues } from '@/lib/queries/accounts';
import { listFamilyMembers } from '@/lib/queries/families';
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
  onSubmit: (values: AccountFormValues) => void;
};

export function AccountForm({ initialValues, submitLabel, loading, error, onSubmit }: AccountFormProps) {
  const { membership } = useFamily();
  const [values, setValues] = useState<AccountFormValues>(() => {
    const picked = pickFormValues(initialValues);
    return initialValues ? picked : { ...picked, owner_member_id: membership?.id ?? null };
  });
  const [openingBalanceText, setOpeningBalanceText] = useState(String(values.opening_balance ?? 0));
  const [members, setMembers] = useState<{ id: string; display_name: string }[]>([]);

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
          placeholder="mis. BNI Tabungan"
        />

        <ChipSelect
          label="Jenis akun"
          options={ACCOUNT_TYPES}
          value={values.account_type}
          onChange={(v) => set('account_type', v)}
        />

        <ChipSelect
          label="Mata uang"
          options={CURRENCIES}
          value={(values.currency ?? 'IDR') as (typeof CURRENCIES)[number]}
          onChange={(v) => set('currency', v)}
        />

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

        {error && (
          <ThemedText type="small" themeColor="danger">
            {error}
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
