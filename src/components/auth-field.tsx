import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { IconEye, IconEyeOff } from '@/components/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthFieldProps = TextInputProps & {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  // true → input password dengan tombol mata untuk tampilkan/sembunyikan.
  secure?: boolean;
};

// Input layar Masuk/Daftar: ikon di kiri, tanpa label (placeholder jadi petunjuk) — mengikuti
// design/mockup splash and login.png.
export function AuthField({ Icon, secure, style, ...rest }: AuthFieldProps) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(true);

  return (
    <View style={[styles.field, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Icon size={20} color={theme.textSecondary} />
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text }, style]}
        secureTextEntry={secure ? hidden : undefined}
        {...rest}
      />
      {secure && (
        <Pressable
          onPress={() => setHidden((h) => !h)}
          hitSlop={8}
          accessibilityLabel="Tampilkan atau sembunyikan password">
          {hidden ? (
            <IconEye size={20} color={theme.textSecondary} />
          ) : (
            <IconEyeOff size={20} color={theme.textSecondary} />
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
});
