// Mirror dari family-finance-app/lib/utils/date.ts — "bulan" finansial keluarga bisa
// dimulai dari hari selain tanggal 1 (families.month_start_day, 1-28).

export function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCycleStart(anchorDate: Date, monthStartDay: number): Date {
  const day = anchorDate.getDate();
  const cycleMonth = day >= monthStartDay ? anchorDate.getMonth() : anchorDate.getMonth() - 1;
  return new Date(anchorDate.getFullYear(), cycleMonth, monthStartDay);
}

export function getCycleRange(cycleStart: Date, monthStartDay: number) {
  const end = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, monthStartDay);
  return { start: toLocalISODate(cycleStart), end: toLocalISODate(end) };
}

export function shiftCycle(cycleStart: Date, delta: number): Date {
  return new Date(cycleStart.getFullYear(), cycleStart.getMonth() + delta, cycleStart.getDate());
}
