import { useLocalSearchParams } from 'expo-router';

import { TransactionsManager } from '@/components/transactions-manager';

// Riwayat transaksi satu akun — mirror family-finance-app/app/(main)/accounts/[id]/history.
export default function AccountHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <TransactionsManager filterAccountId={id} />;
}
