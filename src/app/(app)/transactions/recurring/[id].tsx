import { useLocalSearchParams } from 'expo-router';

import { RecurringTransactionFormScreen } from '@/components/recurring-transaction-form-screen';

export default function EditRecurringTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <RecurringTransactionFormScreen recurringId={id} />;
}
