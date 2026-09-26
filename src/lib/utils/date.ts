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

// Label tanggal baris transaksi, mis. "Kam, 25 Sep" — mirror TransactionsManager web.
export function formatRowDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
}

// Judul grup daftar transaksi: "Hari ini", "Kemarin", atau tanggal panjang.
export function dateGroupLabel(dateStr: string, today: Date = new Date()) {
  const todayKey = toLocalISODate(today);
  if (dateStr === todayKey) return 'Hari ini';
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (dateStr === toLocalISODate(yesterday)) return 'Kemarin';

  const date = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

// Label siklus bulan finansial: "September 2026" kalau mulai tanggal 1, atau rentang tanggal
// ("25 Sep - 24 Okt 2026") kalau `month_start_day` diubah — mirror family-finance-app.
export function formatCycleLabel(cycleStart: Date, monthStartDay: number): string {
  if (monthStartDay === 1) {
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(cycleStart);
  }
  const cycleEndInclusive = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, monthStartDay - 1);
  const startLabel = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(cycleStart);
  const endLabel = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    cycleEndInclusive
  );
  return `${startLabel} - ${endLabel}`;
}

// Tanggal pendek tanpa hari, mis. "25 Sep".
export function formatShortDate(dateStr: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(`${dateStr}T00:00:00`));
}
