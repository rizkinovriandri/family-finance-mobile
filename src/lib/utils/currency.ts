// Terima "1.000.000", "1,000,000", "1.000.000,50", "1,000.50", atau "1500000.5".
export function parseAmount(text: string): number {
  const cleaned = text.trim().replace(/[^0-9.,-]/g, '');
  const negative = cleaned.startsWith('-');
  const s = cleaned.replace(/-/g, '');
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  const decimalIdx = Math.max(lastDot, lastComma);

  let normalized = s;
  if (decimalIdx !== -1) {
    const sep = s[decimalIdx];
    const after = s.slice(decimalIdx + 1);
    const sepCount = s.split(sep).length - 1;
    const otherSepPresent = sep === '.' ? lastComma !== -1 : lastDot !== -1;
    const isThousands = !otherSepPresent && (sepCount > 1 || after.length === 3);
    normalized = isThousands
      ? s.replace(/[.,]/g, '')
      : `${s.slice(0, decimalIdx).replace(/[.,]/g, '')}.${after}`;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return negative ? -value : value;
}

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
