import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';
import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

import { Colors } from '@/constants/theme';

type TabConfig = {
  name: string;
  label: string;
  sf: SFSymbol;
  md: AndroidSymbol;
};

const TABS: TabConfig[] = [
  { name: 'index', label: 'Beranda', sf: 'house', md: 'home' },
  { name: 'accounts', label: 'Akun', sf: 'wallet.bifold', md: 'account_balance_wallet' },
  { name: 'transactions', label: 'Transaksi', sf: 'arrow.left.arrow.right', md: 'swap_horiz' },
  { name: 'budget', label: 'Budget', sf: 'chart.pie', md: 'pie_chart_outline' },
  { name: 'reports', label: 'Laporan', sf: 'chart.bar', md: 'bar_chart' },
  { name: 'more', label: 'Lainnya', sf: 'ellipsis', md: 'more_horiz' },
];

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : (scheme ?? 'light')];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.accent } }}>
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
