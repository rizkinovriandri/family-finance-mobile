import { BALANCE_ADJUSTMENT_CATEGORY_NAME, getCategoryStyle } from '@/constants/enums';
import { fetchAllRows } from '@/lib/queries/paging';
import { supabase } from '@/lib/supabase';
import { getCycleRange, getCycleStart, shiftCycle } from '@/lib/utils/date';

// Mirror family-finance-app/lib/supabase/queries/reports.ts.

export type WeeklyPoint = {
  weekLabel: string;
  amount: number;
};

export type ReportCategorySlice = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  amount: number;
  percentage: number;
  color: string;
};

export type ReportSummary = {
  total: number;
  changePercentage: number;
  weekly: WeeklyPoint[];
  categories: ReportCategorySlice[];
};

export type ReportType = 'Pemasukan' | 'Pengeluaran';

export async function getReportSummary(
  familyId: string,
  monthDate: Date,
  monthStartDay: number,
  type: ReportType,
  categoryId?: string
): Promise<ReportSummary> {
  const cycleStart = getCycleStart(monthDate, monthStartDay);
  const { start, end } = getCycleRange(cycleStart, monthStartDay);
  const prevCycleStart = shiftCycle(cycleStart, -1);
  const { start: prevStart } = getCycleRange(prevCycleStart, monthStartDay);

  const [transactions, { data: categories, error: catError }] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from('transactions')
        .select('date, type, amount, category_id, transfer_pair_id')
        .eq('family_id', familyId)
        .gte('date', prevStart)
        .lt('date', end)
        .order('id')
        .range(from, to)
    ),
    supabase.from('categories').select('id, name, icon'),
  ]);

  if (catError) throw catError;

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const adjustmentCategoryIds = new Set(
    categories.filter((c) => c.name === BALANCE_ADJUSTMENT_CATEGORY_NAME).map((c) => c.id)
  );

  let total = 0;
  let previousTotal = 0;
  const byCategory = new Map<string, number>();
  // Siklus bulan berjalan dibagi 4 "minggu" tetap (hari ke 1-7, 8-14, 15-21, 22-akhir, dihitung
  // sejak awal siklus, bukan tanggal kalender) — pendekatan sederhana meniru W1-W4 di mockup.
  const weeklyBuckets = [0, 0, 0, 0];
  const msPerDay = 24 * 60 * 60 * 1000;

  for (const t of transactions) {
    // Transfer antar akun dan penyesuaian saldo bukan pemasukan/pengeluaran sungguhan.
    if (t.transfer_pair_id) continue;
    if (adjustmentCategoryIds.has(t.category_id)) continue;
    if (t.type !== type) continue;
    if (categoryId && t.category_id !== categoryId) continue;

    const isCurrentMonth = t.date >= start && t.date < end;
    if (isCurrentMonth) {
      total += t.amount;
      byCategory.set(t.category_id, (byCategory.get(t.category_id) ?? 0) + t.amount);
      const txDate = new Date(`${t.date}T00:00:00`);
      const daysSinceCycleStart = Math.round((txDate.getTime() - cycleStart.getTime()) / msPerDay);
      const weekIndex = Math.min(3, Math.floor(daysSinceCycleStart / 7));
      weeklyBuckets[weekIndex] += t.amount;
    } else {
      previousTotal += t.amount;
    }
  }

  const changePercentage =
    previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : total > 0 ? 100 : 0;

  const categorySlices = Array.from(byCategory.entries())
    .map(([id, amount]) => {
      const cat = categoryById.get(id);
      const categoryName = cat?.name ?? 'Lainnya';
      return {
        categoryId: id,
        categoryName,
        categoryIcon: cat?.icon ?? null,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: getCategoryStyle(categoryName).bright,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const weekly = weeklyBuckets.map((amount, i) => ({ weekLabel: `W${i + 1}`, amount }));

  return { total, changePercentage, weekly, categories: categorySlices };
}
