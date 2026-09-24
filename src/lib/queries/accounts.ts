import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type AccountRow = Database['public']['Tables']['accounts']['Row'];
export type AccountFormValues = Omit<
  Database['public']['Tables']['accounts']['Insert'],
  'id' | 'family_id' | 'created_at' | 'updated_at'
>;

export type AccountWithBalance = AccountRow & { current_balance: number };

export async function listAccounts(familyId: string): Promise<AccountWithBalance[]> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const { data: balances, error: balanceError } = await supabase
    .from('account_balances')
    .select('account_id, current_balance')
    .eq('family_id', familyId);
  if (balanceError) throw balanceError;

  const balanceByAccountId = new Map(balances.map((b) => [b.account_id, b.current_balance]));

  return accounts.map((account) => ({
    ...account,
    current_balance: balanceByAccountId.get(account.id) ?? account.opening_balance,
  }));
}

export async function getAccount(accountId: string): Promise<AccountRow> {
  const { data, error } = await supabase.from('accounts').select('*').eq('id', accountId).single();
  if (error) throw error;
  return data;
}

export async function createAccount(familyId: string, input: AccountFormValues) {
  const { data, error } = await supabase
    .from('accounts')
    .insert({ family_id: familyId, ...input })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function updateAccount(accountId: string, input: AccountFormValues) {
  const { error } = await supabase
    .from('accounts')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', accountId);
  if (error) throw error;
}

export async function deleteAccount(accountId: string) {
  const { error } = await supabase.from('accounts').delete().eq('id', accountId);
  if (error) throw error;
}
