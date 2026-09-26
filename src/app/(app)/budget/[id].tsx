import { useLocalSearchParams } from 'expo-router';

import { BudgetFormScreen } from '@/components/budget-form-screen';

export default function EditBudgetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <BudgetFormScreen budgetId={id} />;
}
