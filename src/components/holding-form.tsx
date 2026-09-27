import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { InvestmentHoldingFields } from '@/components/investment-holding-fields';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useHoldingFormState } from '@/hooks/use-holding-form-state';
import type { InvestmentCategory } from '@/lib/database.types';
import type { HoldingFormValues } from '@/lib/queries/holdings';

type HoldingFormProps = {
  category: InvestmentCategory;
  initialValues?: Partial<HoldingFormValues>;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: HoldingFormValues) => void;
};

export function HoldingForm({ category, initialValues, submitLabel, loading, error, onSubmit }: HoldingFormProps) {
  const state = useHoldingFormState(category, initialValues);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit() {
    const result = state.getSubmitValues();
    if (!result.ok) return setValidationError(result.error);
    setValidationError(null);
    onSubmit(result.values);
  }

  const canSubmit = state.values.name.trim().length > 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <InvestmentHoldingFields category={category} state={state} />

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
