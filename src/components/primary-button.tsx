import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  loading,
  variant = 'primary',
  disabled,
  style,
  ...rest
}: PrimaryButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';

  const backgroundStyle =
    variant === 'primary'
      ? { backgroundColor: theme.accent }
      : { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.border };

  const labelColor = isPrimary ? undefined : variant === 'danger' ? 'danger' : 'text';

  return (
    <Pressable
      disabled={disabled || loading}
      style={[styles.button, backgroundStyle, (disabled || loading) && styles.disabled, style]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : theme.text} />
      ) : (
        <ThemedText
          type="smallBold"
          themeColor={labelColor}
          style={isPrimary ? styles.primaryLabel : undefined}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  primaryLabel: {
    color: '#ffffff',
  },
});
