import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { BrandGradient, Spacing } from '@/constants/theme';

type GradientButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  loading?: boolean;
};

// Tombol utama layar Masuk/Daftar — gradient teal → biru → ungu sesuai design/mockup splash and login.png.
export function GradientButton({ label, loading, disabled, ...rest }: GradientButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [styles.button, isDisabled && styles.disabled, pressed && styles.pressed]}
      {...rest}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="brandGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={BrandGradient[0]} />
            <Stop offset="0.55" stopColor={BrandGradient[1]} />
            <Stop offset="1" stopColor={BrandGradient[2]} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#brandGradient)" />
      </Svg>
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <ThemedText type="smallBold" style={styles.label}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
  },
});
