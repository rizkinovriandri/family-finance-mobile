/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Sumber: design/mockup.png (di-sample langsung dari piksel mockup) — lihat
// design/design-system.md untuk rincian & pola komponen. Dark mode adalah
// tema utama (sesuai mockup); light mode diturunkan proporsional, belum ada
// mockup terpisah untuk light mode.
export const Colors = {
  light: {
    text: '#0A0F17',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    border: '#D6D8DD',
    accent: '#2FD6AB',
    danger: '#D13A54',
    success: '#06A055',
  },
  dark: {
    text: '#ffffff',
    background: '#080D14',
    backgroundElement: '#111A24',
    backgroundSelected: '#1C2A3D',
    textSecondary: '#8A94A6',
    border: '#1C2A3D',
    accent: '#2FD6AB',
    danger: '#D13A54',
    success: '#06A055',
  },
} as const;

// Gradient merek (design/mockup splash and login.png): tombol utama layar Masuk/Daftar, kiri ke kanan.
export const BrandGradient = ['#09B1B3', '#3D5CDB', '#743BDE'] as const;

// Warna seri chart (design/design-system.md, palet kategori) — sama di light/dark.
export const ChartColors = {
  tabungan: '#2FD6AB',
  investasi: '#9EBCFB',
} as const;

// Warna berurutan untuk kategori di chart/legend (design/design-system.md), dipakai per peringkat.
export const CategoryPalette = ['#FBB54C', '#D384F9', '#9EBCFB', '#6395F5', '#B08BFA', '#2FD6AB'] as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
