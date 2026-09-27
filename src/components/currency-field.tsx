import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CurrencyFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
};

function formatDigits(value: number) {
  if (!value) return '';
  return new Intl.NumberFormat('id-ID').format(value);
}

// Input jumlah Rupiah: hanya angka, ditampilkan dengan pemisah ribuan (1.500.000) — mirror
// family-finance-app/components/CurrencyInput.tsx.
export function CurrencyField({ label, value, onChange, error }: CurrencyFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View
        style={[styles.inputRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText themeColor="textSecondary">Rp</ThemedText>
        <TextInput
          value={formatDigits(value)}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, '');
            onChange(digits ? Number(digits) : 0);
          }}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
      </View>
      {error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.two + Spacing.half,
    fontSize: 16,
  },
});
