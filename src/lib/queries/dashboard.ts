import { BALANCE_ADJUSTMENT_CATEGORY_NAME } from '@/constants/enums';
import { fetchAllRows } from '@/lib/queries/paging';
import { supabase } from '@/lib/supabase';
import { getCycleRange, getCycleStart, shiftCycle, toLocalISODate } from '@/lib/utils/date';

export type CategorySlice = {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
};

export type MonthlySummary = {
  totalIncome: number;
  totalExpense: number;
  categories: CategorySlice[];
};

export type MonthlyTrendPoint = {
  monthLabel: string;
  income: number;
  expense: number;
};

export type BudgetOverview = {
  targetTotal: number;
  realisasiTotal: number;
  overBudgetCategories: string[];
};

async function listCategoryNames() {
  const { data, error } = await supabase.from('categories').select('id, name');
  if (error) throw error;
  return data;
}

// Transfer antar akun (2 baris berpasangan) dan penyesuaian saldo bukan pemasukan/
// pengeluaran sungguhan — tidak dihitung di ringkasan (sama seperti di web).
export async function getMonthlySummary(familyId: string, monthStartDay: number): Promise<MonthlySummary> {
  const { start, end } = getCycleRange(getCycleStart(new Date(), monthStartDay), monthStartDay);

  const [txResult, categories] = await Promise.all([
    supabase
      .from('transactions')
      .select('type, amount, category_id, transfer_pair_id')
      .eq('family_id', familyId)
      .gte('date', start)
      .lt('date', end),
    listCategoryNames(),
  ]);
  if (txResult.error) throw txResult.error;

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const adjustmentIds = new Set(
    categories.filter((c) => c.name === BALANCE_ADJUSTMENT_CATEGORY_NAME).map((c) => c.id)
  );

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory = new Map<string, number>();

  for (const t of txResult.data) {
    if (t.transfer_pair_id || adjustmentIds.has(t.category_id)) continue;
    if (t.type === 'Pemasukan') {
      totalIncome += t.amount;
    } else if (t.type === 'Pengeluaran') {
      totalExpense += t.amount;
      expenseByCategory.set(t.category_id, (expenseByCategory.get(t.category_id) ?? 0) + t.amount);
    }
  }

  const categoriesSlices = Array.from(expenseByCategory.entries())
    .map(([categoryId, amount]) => ({
      categoryId,
      categoryName: categoryNameById.get(categoryId) ?? 'Lainnya',
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return { totalIncome, totalExpense, categories: categoriesSlices };
}

export async function getMonthlyTrend(
  familyId: string,
  monthStartDay: number,
  monthsCount = 6
): Promise<MonthlyTrendPoint[]> {
  const currentCycleStart = getCycleStart(new Date(), monthStartDay);
  const rangeStart = shiftCycle(currentCycleStart, -(monthsCount - 1));
  const rangeEndExclusive = shiftCycle(currentCycleStart, 1);

  const [transactions, categories] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from('transactions')
        .select('date, type, amount, category_id, transfer_pair_id')
        .eq('family_id', familyId)
        .gte('date', toLocalISODate(rangeStart))
        .lt('date', toLocalISODate(rangeEndExclusive))
        .order('id')
        .range(from, to)
    ),
    listCategoryNames(),
  ]);

  const adjustmentIds = new Set(
    categories.filter((c) => c.name === BALANCE_ADJUSTMENT_CATEGORY_NAME).map((c) => c.id)
  );

  const buckets = Array.from({ length: monthsCount }, (_, i) => ({
    cycleStart: shiftCycle(rangeStart, i),
    income: 0,
    expense: 0,
  }));

  for (const t of transactions) {
    if (t.transfer_pair_id || adjustmentIds.has(t.category_id)) continue;
    const txCycleStart = getCycleStart(new Date(`${t.date}T00:00:00`), monthStartDay);
    const index =
      (txCycleStart.getFullYear() - rangeStart.getFullYear()) * 12 +
      (txCycleStart.getMonth() - rangeStart.getMonth());
    const bucket = buckets[index];
    if (!bucket) continue;
    if (t.type === 'Pemasukan') bucket.income += t.amount;
    else if (t.type === 'Pengeluaran') bucket.expense += t.amount;
  }

  return buckets.map((b) => ({
    monthLabel: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(b.cycleStart),
    income: b.income,
    expense: b.expense,
  }));
}

export async function getBudgetOverview(familyId: string, monthStartDay: number): Promise<BudgetOverview> {
  const month = toLocalISODate(getCycleStart(new Date(), monthStartDay));

  const [budgetsResult, realizationsResult, categories] = await Promise.all([
    supabase.from('budgets').select('id, category_id, target_amount').eq('family_id', familyId).eq('month', month),
    supabase.from('budget_realizations').select('budget_id, realisasi').eq('family_id', familyId).eq('month', month),
    listCategoryNames(),
  ]);
  if (budgetsResult.error) throw budgetsResult.error;
  if (realizationsResult.error) throw realizationsResult.error;

  const realisasiByBudgetId = new Map(realizationsResult.data.map((r) => [r.budget_id, r.realisasi]));
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  let targetTotal = 0;
  let realisasiTotal = 0;
  const overBudgetCategories: string[] = [];

  for (const b of budgetsResult.data) {
    const realisasi = realisasiByBudgetId.get(b.id) ?? 0;
    targetTotal += b.target_amount;
    realisasiTotal += realisasi;
    if (b.target_amount > 0 && realisasi > b.target_amount) {
      overBudgetCategories.push(categoryNameById.get(b.category_id) ?? 'Lainnya');
    }
  }

  return { targetTotal, realisasiTotal, overBudgetCategories };
}
