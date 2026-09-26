import { isInvestmentAccountType, isLiabilityAccountType } from '@/constants/enums';
import type { AccountWithBalance } from '@/lib/queries/accounts';

export type NetWorthAccountEntry = {
  id: string;
  name: string;
  accountType: AccountWithBalance['account_type'];
  value: number;
};

export type NetWorthBreakdown = {
  currency: string;
  tabungan: number;
  investasi: number;
  liabilitas: number;
  total: number;
  asetAccounts: NetWorthAccountEntry[];
  liabilitasAccounts: NetWorthAccountEntry[];
};

// Kekayaan bersih = tabungan + investasi - liabilitas (Kartu Kredit, Pinjaman/Utang).
// Dipisah per mata uang karena tidak ada konversi kurs; akun "Ditutup" tidak dihitung.
// Mirror dari family-finance-app/lib/utils/networth.ts.
export function computeNetWorth(
  accounts: AccountWithBalance[],
  portfolioValueByAccount: Map<string, number>
): NetWorthBreakdown[] {
  const byCurrency = new Map<
    string,
    {
      tabungan: number;
      investasi: number;
      liabilitas: number;
      asetAccounts: NetWorthAccountEntry[];
      liabilitasAccounts: NetWorthAccountEntry[];
    }
  >();

  for (const a of accounts) {
    if (a.status === 'Ditutup') continue;
    const isInvestment = isInvestmentAccountType(a.account_type);
    const value = isInvestment ? (portfolioValueByAccount.get(a.id) ?? 0) : a.current_balance;
    const entry = byCurrency.get(a.currency) ?? {
      tabungan: 0,
      investasi: 0,
      liabilitas: 0,
      asetAccounts: [],
      liabilitasAccounts: [],
    };
    const accountEntry = { id: a.id, name: a.name, accountType: a.account_type, value };

    if (isLiabilityAccountType(a.account_type)) {
      entry.liabilitas += value;
      entry.liabilitasAccounts.push(accountEntry);
    } else {
      if (isInvestment) entry.investasi += value;
      else entry.tabungan += value;
      entry.asetAccounts.push(accountEntry);
    }

    byCurrency.set(a.currency, entry);
  }

  return Array.from(byCurrency.entries())
    .map(([currency, v]) => ({
      currency,
      tabungan: v.tabungan,
      investasi: v.investasi,
      liabilitas: v.liabilitas,
      total: v.tabungan + v.investasi - v.liabilitas,
      asetAccounts: v.asetAccounts.sort((a, b) => b.value - a.value),
      liabilitasAccounts: v.liabilitasAccounts.sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => (a.currency === 'IDR' ? -1 : b.currency === 'IDR' ? 1 : 0));
}
