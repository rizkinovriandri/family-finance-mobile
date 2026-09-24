import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type HoldingRow = Database['public']['Tables']['investment_holdings']['Row'];
export type HoldingFormValues = Omit<
  Database['public']['Tables']['investment_holdings']['Insert'],
  'id' | 'family_id' | 'account_id' | 'created_at' | 'updated_at'
>;

export type Holding = HoldingRow & {
  costBasis: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
};

function withComputed(h: HoldingRow): Holding {
  const costBasis = h.quantity * h.purchase_price;
  const currentValue = h.quantity * h.current_price;
  const gainLoss = currentValue - costBasis;
  return {
    ...h,
    costBasis,
    currentValue,
    gainLoss,
    gainLossPercentage: costBasis > 0 ? (gainLoss / costBasis) * 100 : 0,
  };
}

export async function listHoldingsForAccount(accountId: string): Promise<Holding[]> {
  const { data, error } = await supabase
    .from('investment_holdings')
    .select('*')
    .eq('account_id', accountId)
    .order('purchase_date', { ascending: false });
  if (error) throw error;
  return data.map(withComputed);
}

// Total nilai portofolio (quantity x current_price) per akun investasi —
// dipakai di list Akun supaya nilainya konsisten dengan yang tampil di
// halaman Portofolio, bukan dari saldo transaksi kas (yang biasanya 0 untuk
// akun investasi karena nilainya memang dari holding, bukan transaksi).
export async function getPortfolioValueByAccount(familyId: string): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('investment_holdings')
    .select('account_id, quantity, current_price')
    .eq('family_id', familyId);
  if (error) throw error;

  const valueByAccount = new Map<string, number>();
  for (const h of data) {
    const value = h.quantity * h.current_price;
    valueByAccount.set(h.account_id, (valueByAccount.get(h.account_id) ?? 0) + value);
  }
  return valueByAccount;
}

export async function getHolding(holdingId: string): Promise<HoldingRow> {
  const { data, error } = await supabase
    .from('investment_holdings')
    .select('*')
    .eq('id', holdingId)
    .single();
  if (error) throw error;
  return data;
}

export async function createHolding(familyId: string, accountId: string, input: HoldingFormValues) {
  const { error } = await supabase
    .from('investment_holdings')
    .insert({ family_id: familyId, account_id: accountId, ...input });
  if (error) throw error;
}

export async function updateHolding(holdingId: string, input: HoldingFormValues) {
  const { error } = await supabase
    .from('investment_holdings')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', holdingId);
  if (error) throw error;
}

export async function deleteHolding(holdingId: string) {
  const { error } = await supabase.from('investment_holdings').delete().eq('id', holdingId);
  if (error) throw error;
}
