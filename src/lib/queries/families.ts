import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';
import { generateInviteCode } from '@/lib/utils/invite-code';

export type FamilyMembership = {
  id: string;
  family_id: string;
  display_name: string;
  avatar_url: string | null;
  default_account_id: string | null;
  family_name: string;
  month_start_day: number;
};

export async function getMyFamilyMembership(userId: string): Promise<FamilyMembership | null> {
  const { data: membership, error } = await supabase
    .from('family_members')
    .select('id, family_id, display_name, avatar_url, default_account_id, families(name, month_start_day)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!membership) return null;

  const family = membership.families;
  if (!family) return null;

  return {
    id: membership.id,
    family_id: membership.family_id,
    display_name: membership.display_name,
    avatar_url: membership.avatar_url,
    default_account_id: membership.default_account_id,
    family_name: family.name,
    month_start_day: family.month_start_day,
  };
}

export async function createFamilyWithOwner(familyName: string, displayName: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Belum login');

  // ID di-generate di client (bukan pakai .select() setelah insert) karena
  // RLS select "families" mensyaratkan user sudah jadi family_members —
  // padahal baris family_members-nya baru dibuat di langkah berikutnya.
  const familyId = Crypto.randomUUID();
  const inviteCode = generateInviteCode();

  const { error: familyError } = await supabase
    .from('families')
    .insert({ id: familyId, name: familyName, invite_code: inviteCode });
  if (familyError) throw familyError;

  const { error: memberError } = await supabase.from('family_members').insert({
    family_id: familyId,
    user_id: user.id,
    display_name: displayName,
  });
  if (memberError) throw memberError;

  return { id: familyId, name: familyName, invite_code: inviteCode };
}

export async function joinFamilyByInviteCode(inviteCode: string, displayName: string) {
  const { data, error } = await supabase.rpc('join_family_by_invite_code', {
    p_code: inviteCode.trim().toUpperCase(),
    p_display_name: displayName,
  });
  if (error) throw error;
  return data[0];
}

export async function getFamilyInviteCode(familyId: string) {
  const { data, error } = await supabase.from('families').select('invite_code').eq('id', familyId).single();
  if (error) throw error;
  return data.invite_code;
}

export async function listFamilyMembers(familyId: string) {
  const { data, error } = await supabase
    .from('family_members')
    .select('id, display_name')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateDefaultAccount(memberId: string, accountId: string | null) {
  const { error } = await supabase
    .from('family_members')
    .update({ default_account_id: accountId })
    .eq('id', memberId);
  if (error) throw error;
}
