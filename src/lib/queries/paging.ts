import type { PostgrestError } from '@supabase/supabase-js';

// PostgREST membatasi satu respons maksimal 1000 baris (max_rows) — query yang lebih banyak akan
// terpotong diam-diam. Helper ini membaca berhalaman sampai habis. Query WAJIB punya urutan yang
// deterministik (mis. tambahkan .order('id') di akhir) supaya baris tidak dobel/terlewat antar halaman.
const PAGE_SIZE = 1000;

export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}
