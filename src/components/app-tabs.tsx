import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { IconChartBar, IconChartLine, IconHome, IconLayoutGrid, IconListDetails, IconWallet, type TablerIcon } from './icons';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

const TABS: { name: string; href: '/' | '/accounts' | '/transactions' | '/budget' | '/reports' | '/more'; label: string; icon: TablerIcon }[] = [
  { name: 'index', href: '/', label: 'Beranda', icon: IconHome },
  { name: 'accounts', href: '/accounts', label: 'Akun', icon: IconWallet },
  { name: 'transactions', href: '/transactions', label: 'Transaksi', icon: IconListDetails },
  { name: 'budget', href: '/budget', label: 'Budget', icon: IconChartBar },
  { name: 'reports', href: '/reports', label: 'Laporan', icon: IconChartLine },
  { name: 'more', href: '/more', label: 'Lainnya', icon: IconLayoutGrid },
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

type TabButtonProps = TabTriggerSlotProps & { icon: TablerIcon };

export function TabButton({ children, icon: Icon, isFocused, ...props }: TabButtonProps) {
  const theme = Colors[useColorScheme()];

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Icon size={24} color={isFocused ? theme.accent : theme.textSecondary} />
      <ThemedText type="small" themeColor={isFocused ? 'accent' : 'textSecondary'} style={styles.tabLabel}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function BottomBar(props: TabListProps) {
  const theme = Colors[useColorScheme()];
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
