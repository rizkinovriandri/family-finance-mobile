import { useEffect, useState } from 'react';

import { useFamily } from '@/lib/family-context';
import { listAccounts } from '@/lib/queries/accounts';
import { listCategories, listSubcategories, type Category, type Subcategory } from '@/lib/queries/categories';
import { listFamilyMembers } from '@/lib/queries/families';

export type LookupAccount = { id: string; name: string };
export type LookupMember = { id: string; display_name: string };

// Data pendukung form transaksi (akun, anggota, kategori, sub kategori) — dimuat sekali per layar form.
export function useTransactionLookups() {
  const { membership } = useFamily();
  const [accounts, setAccounts] = useState<LookupAccount[]>([]);
  const [members, setMembers] = useState<LookupMember[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!membership) return;
    let cancelled = false;
    Promise.all([
      listAccounts(membership.family_id),
      listFamilyMembers(membership.family_id),
      listCategories(),
      listSubcategories(membership.family_id),
    ])
      .then(([accountRows, memberRows, categoryRows, subcategoryRows]) => {
        if (cancelled) return;
        setAccounts(accountRows.map((a) => ({ id: a.id, name: a.name })));
        setMembers(memberRows);
        setCategories(categoryRows);
        setSubcategories(subcategoryRows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [membership]);

  return { accounts, members, categories, subcategories, loading, error };
}
