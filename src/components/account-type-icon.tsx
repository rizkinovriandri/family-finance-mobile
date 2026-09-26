import { StyleSheet, View } from 'react-native';

import {
  IconBuildingBank,
  IconCash,
  IconCircleMinus,
  IconCreditCard,
  IconFolder,
  IconTrendingUp,
  IconWallet,
  type TablerIcon,
} from '@/components/icons';
import type { AccountWithBalance } from '@/lib/queries/accounts';

type AccountType = AccountWithBalance['account_type'];

// Mirror family-finance-app/components/AccountTypeIcon.tsx.
const STYLE_BY_TYPE: Record<AccountType, { Icon: TablerIcon; bg: string; color: string }> = {
  Tabungan: { Icon: IconBuildingBank, bg: '#0B2A4A', color: '#4FA0F0' },
  Giro: { Icon: IconBuildingBank, bg: '#0B2A4A', color: '#4FA0F0' },
  Deposito: { Icon: IconBuildingBank, bg: '#0B2A4A', color: '#4FA0F0' },
  'Investasi Saham': { Icon: IconTrendingUp, bg: '#12332E', color: '#3ECFAE' },
  'Investasi Reksadana': { Icon: IconTrendingUp, bg: '#12332E', color: '#3ECFAE' },
  'Investasi Obligasi': { Icon: IconTrendingUp, bg: '#12332E', color: '#3ECFAE' },
  'Investasi Emas': { Icon: IconTrendingUp, bg: '#12332E', color: '#3ECFAE' },
  'Investasi Kripto': { Icon: IconTrendingUp, bg: '#12332E', color: '#3ECFAE' },
  'Dana Pensiun': { Icon: IconTrendingUp, bg: '#12332E', color: '#3ECFAE' },
  'E-Wallet': { Icon: IconWallet, bg: '#222149', color: '#AC6FF0' },
  'Kas Tunai': { Icon: IconCash, bg: '#0E3B2E', color: '#16D992' },
  'Kartu Kredit': { Icon: IconCreditCard, bg: '#3A1620', color: '#F86673' },
  'Pinjaman/Utang': { Icon: IconCircleMinus, bg: '#2E1F26', color: '#F0554F' },
  Lainnya: { Icon: IconFolder, bg: '#1E2938', color: '#8896A8' },
};

export function AccountTypeIcon({ accountType, size = 36 }: { accountType: AccountType; size?: number }) {
  const style = STYLE_BY_TYPE[accountType];
  const { Icon } = style;

  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: style.bg }]}>
      <Icon size={size * 0.5} color={style.color} strokeWidth={1.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
