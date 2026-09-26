import { useLocalSearchParams } from 'expo-router';

import { TransactionFormScreen } from '@/components/transaction-form-screen';
import type { TxType } from '@/components/transaction-form';

const TX_TYPES: readonly TxType[] = ['Pengeluaran', 'Pemasukan', 'Transfer'];

export default function NewTransactionScreen() {
  const { type, categoryId, accountId } = useLocalSearchParams<{
    type?: string;
    categoryId?: string;
    accountId?: string;
  }>();
  const initialType = TX_TYPES.find((t) => t === type);

  return <TransactionFormScreen initialType={initialType} initialCategoryId={categoryId} initialAccountId={accountId} />;
}
