import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type { CategoryFormValues } from '@/lib/validation/category';

export type Category = {
  id: string;
  name: string;
  type: Database['public']['Tables']['categories']['Row']['type'];
  isDefault: boolean;
  icon: string | null;
};

export type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
};

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, type, is_default, icon')
    .order('name');
  if (error) throw error;
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    isDefault: c.is_default,
    icon: c.icon,
  }));
}

export async function listSubcategories(familyId: string): Promise<Subcategory[]> {
  const { data, error } = await supabase
    .from('subcategories')
    .select('id, category_id, name')
    .eq('family_id', familyId)
    .order('name');
  if (error) throw error;
  return data.map((s) => ({ id: s.id, categoryId: s.category_id, name: s.name }));
}

export async function createCategory(familyId: string, input: CategoryFormValues) {
  const { error } = await supabase.from('categories').insert({
    family_id: familyId,
    name: input.name,
    type: input.type,
    icon: input.icon,
    is_default: false,
  });
  if (error) throw error;
}

export async function updateCategory(categoryId: string, input: Pick<CategoryFormValues, 'name' | 'icon'>) {
  const { error } = await supabase
    .from('categories')
    .update({ name: input.name, icon: input.icon })
    .eq('id', categoryId);
  if (error) throw error;
}

export async function deleteCategory(categoryId: string) {
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) {
    // 23503 = foreign key violation — kategori masih dipakai transaksi/budget.
    if (error.code === '23503') {
      throw new Error('Kategori ini masih dipakai di transaksi atau anggaran, tidak bisa dihapus.');
    }
    throw error;
  }
}

export async function createSubcategory(familyId: string, categoryId: string, name: string) {
  const { error } = await supabase
    .from('subcategories')
    .insert({ family_id: familyId, category_id: categoryId, name });
  if (error) throw error;
}

export async function updateSubcategory(id: string, name: string) {
  const { error } = await supabase.from('subcategories').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteSubcategory(id: string) {
  const { error } = await supabase.from('subcategories').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error('Sub kategori ini masih dipakai di transaksi atau anggaran, tidak bisa dihapus.');
    }
    throw error;
  }
}
