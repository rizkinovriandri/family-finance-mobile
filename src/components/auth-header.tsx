import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { BrandGradient, Spacing } from '@/constants/theme';

type AuthHeaderProps = {
  title: string;
  subtitle: string;
  // Kata penutup subtitle yang diberi warna aksen mint, mis. "pintar."
  highlight: string;
};

// Kepala layar Masuk/Daftar (design/mockup splash and login.png, opsi 3): logo M kecil, judul,
// subjudul dengan kata sorotan berwarna mint, dan cahaya gradient dekoratif di pojok kanan atas.
export function AuthHeader({ title, subtitle, highlight }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.glow} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="authGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={BrandGradient[2]} stopOpacity="0.35" />
              <Stop offset="0.55" stopColor={BrandGradient[1]} stopOpacity="0.14" />
              <Stop offset="1" stopColor={BrandGradient[0]} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#authGlow)" />
        </Svg>
      </View>

      <Image source={require('@/assets/images/logo-mark.png')} style={styles.logo} contentFit="contain" />

      <View style={styles.text}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          {subtitle}{' '}
          <ThemedText style={styles.subtitle} themeColor="accent">
            {highlight}
          </ThemedText>
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
    marginBottom: Spacing.two,
  },
  glow: {
    position: 'absolute',
    top: -Spacing.six,
    right: -Spacing.six,
    width: 280,
    height: 280,
  },
  logo: {
    width: 56,
    height: 52,
  },
  text: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
  },
});
