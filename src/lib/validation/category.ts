import { z } from 'zod';

// Mirror family-finance-app/lib/validation/category.ts & subcategory.ts.
export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi').max(50, 'Nama terlalu panjang'),
  type: z.enum(['income', 'expense']),
  icon: z.string().min(1, 'Pilih ikon'),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const subcategorySchema = z.object({
  category_id: z.string().min(1, 'Pilih kategori'),
  name: z.string().trim().min(1, 'Nama sub kategori wajib diisi').max(50, 'Nama terlalu panjang'),
});

export type SubcategoryFormValues = z.infer<typeof subcategorySchema>;
