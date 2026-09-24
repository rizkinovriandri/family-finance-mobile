import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

const TABS: { name: string; href: '/' | '/accounts' | '/transactions' | '/budget' | '/reports' | '/more'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'index', href: '/', label: 'Beranda', icon: 'home-outline' },
  { name: 'accounts', href: '/accounts', label: 'Akun', icon: 'wallet-outline' },
  { name: 'transactions', href: '/transactions', label: 'Transaksi', icon: 'swap-horizontal-outline' },
  { name: 'budget', href: '/budget', label: 'Budget', icon: 'pie-chart-outline' },
  { name: 'reports', href: '/reports', label: 'Laporan', icon: 'bar-chart-outline' },
  { name: 'more', href: '/more', label: 'Lainnya', icon: 'ellipsis-horizontal' },
];

export default function AppTabs() {
  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <BottomBar>
          {/* href cast: Expo Router's typed-route generator for `accounts/index.tsx` is
              flaky — the bare `/accounts` alias sometimes drops from its generated union
              between rebuilds even though it's a real, working route. */}
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href as never} asChild>
              <TabButton icon={tab.icon}>{tab.label}</TabButton>
            </TabTrigger>
          ))}
        </BottomBar>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & { icon: keyof typeof Ionicons.glyphMap };

export function TabButton({ children, icon, isFocused, ...props }: TabButtonProps) {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Ionicons name={icon} size={24} color={isFocused ? theme.accent : theme.textSecondary} />
      <ThemedText type="small" themeColor={isFocused ? 'accent' : 'textSecondary'} style={styles.tabLabel}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function BottomBar(props: TabListProps) {
  const theme = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[
        styles.bar,
        {
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, Spacing.two),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
  bar: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
});
