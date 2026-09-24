import { isInvestmentAccountType, isLiabilityAccountType } from '@/constants/enums';
import type { AccountWithBalance } from '@/lib/queries/accounts';

export type NetWorthBreakdown = {
  currency: string;
  tabungan: number;
  investasi: number;
  liabilitas: number;
  total: number;
};

// Kekayaan bersih = tabungan + investasi - liabilitas (Kartu Kredit, Pinjaman/Utang).
// Dipisah per mata uang karena tidak ada konversi kurs; akun "Ditutup" tidak dihitung.
// Mirror dari family-finance-app/lib/utils/networth.ts.
export function computeNetWorth(
  accounts: AccountWithBalance[],
  portfolioValueByAccount: Map<string, number>
): NetWorthBreakdown[] {
  const byCurrency = new Map<string, { tabungan: number; investasi: number; liabilitas: number }>();

  for (const a of accounts) {
    if (a.status === 'Ditutup') continue;
    const isInvestment = isInvestmentAccountType(a.account_type);
    const value = isInvestment ? (portfolioValueByAccount.get(a.id) ?? 0) : a.current_balance;
    const entry = byCurrency.get(a.currency) ?? { tabungan: 0, investasi: 0, liabilitas: 0 };

    if (isLiabilityAccountType(a.account_type)) entry.liabilitas += value;
    else if (isInvestment) entry.investasi += value;
    else entry.tabungan += value;

    byCurrency.set(a.currency, entry);
  }

  return Array.from(byCurrency.entries())
    .map(([currency, v]) => ({ currency, ...v, total: v.tabungan + v.investasi - v.liabilitas }))
    .sort((a, b) => (a.currency === 'IDR' ? -1 : b.currency === 'IDR' ? 1 : 0));
}
