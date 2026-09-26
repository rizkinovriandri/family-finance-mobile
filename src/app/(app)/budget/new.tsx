import { useLocalSearchParams } from 'expo-router';

import { BudgetFormScreen } from '@/components/budget-form-screen';

export default function NewBudgetScreen() {
  const { month } = useLocalSearchParams<{ month?: string }>();

  return <BudgetFormScreen month={month} />;
}
