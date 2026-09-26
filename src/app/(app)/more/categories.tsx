import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/back-header';
import { CategoryIcon } from '@/components/category-icon';
import { IconChevronRight, IconPencil, IconTrash } from '@/components/icons';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useRealtimeTick } from '@/hooks/use-realtime-tick';
import { useTheme } from '@/hooks/use-theme';
import { useFamily } from '@/lib/family-context';
import {
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  listCategories,
  listSubcategories,
  updateSubcategory,
  type Category,
  type Subcategory,
} from '@/lib/queries/categories';
import { confirmDestructive, notify } from '@/lib/utils/confirm';
import { subcategorySchema } from '@/lib/validation/category';

type Tab = 'expense' | 'income';

const TABS: { value: Tab; label: string }[] = [
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'income', label: 'Pemasukan' },
];

// Kelola Kategori — mirror family-finance-app/components/CategoriesManager.tsx: kategori per jenis
// (Pengeluaran/Pemasukan), ubah/hapus, dan rincian sub kategori yang dibuka lewat panah di tiap kategori.
export default function CategoriesScreen() {
  const theme = useTheme();
  const { membership } = useFamily();
  const reloadTick = useRealtimeTick(['categories', 'subcategories'], membership?.family_id);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('expense');

  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [subName, setSubName] = useState('');
  const [subError, setSubError] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  const load = useCallback(async () => {
    if (!membership) return;
    try {
      const [categoryList, subcategoryList] = await Promise.all([
        listCategories(),
        listSubcategories(membership.family_id),
      ]);
      setCategories(categoryList);
      setSubcategories(subcategoryList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat kategori.');
    }
  }, [membership]);

  // Muat ulang tiap layar kembali fokus (mis. balik dari form tambah/ubah kategori).
  useFocusEffect(
    useCallback(() => {
      load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadTick sengaja jadi dependency: naik saat ada perubahan realtime, memicu muat ulang
    }, [load, reloadTick])
  );

  const filtered = (categories ?? []).filter((c) => c.type === tab);

  function switchTab(next: Tab) {
    setTab(next);
    closeSubForm();
    setExpandedCategoryId(null);
  }

  function toggleExpand(categoryId: string) {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
    closeSubForm();
  }

  function openAddSubForm(categoryId: string) {
    setAddingSubFor(categoryId);
    setEditingSub(null);
    setSubName('');
    setSubError(null);
  }

  function openEditSubForm(s: Subcategory) {
    setEditingSub(s);
    setAddingSubFor(null);
    setSubName(s.name);
    setSubError(null);
  }

  function closeSubForm() {
    setAddingSubFor(null);
    setEditingSub(null);
    setSubError(null);
  }

  async function handleSubSubmit(categoryId: string) {
    if (!membership) return;
    const result = subcategorySchema.safeParse({ category_id: categoryId, name: subName });
    if (!result.success) {
      setSubError(result.error.issues[0]?.message ?? 'Data tidak valid');
      return;
    }
    setSubError(null);
    setSubLoading(true);
    try {
      if (editingSub) {
        await updateSubcategory(editingSub.id, result.data.name);
      } else {
        await createSubcategory(membership.family_id, categoryId, result.data.name);
      }
      await load();
      closeSubForm();
    } catch (err) {
      setSubError(err instanceof Error ? err.message : 'Gagal menyimpan sub kategori.');
    } finally {
      setSubLoading(false);
    }
  }

  function handleDeleteSub(s: Subcategory) {
    confirmDestructive('Hapus sub kategori', `Hapus sub kategori "${s.name}"?`, 'Hapus', async () => {
      try {
        await deleteSubcategory(s.id);
        await load();
      } catch (err) {
        notify('Gagal', err instanceof Error ? err.message : 'Gagal menghapus sub kategori.');
      }
    });
  }

  function handleDelete(c: Category) {
    confirmDestructive('Hapus kategori', `Hapus kategori "${c.name}"?`, 'Hapus', async () => {
      try {
        await deleteCategory(c.id);
        await load();
      } catch (err) {
        notify('Gagal', err instanceof Error ? err.message : 'Gagal menghapus kategori.');
      }
    });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <BackHeader title="Kelola Kategori" />

        <View style={[styles.tabSwitch, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {TABS.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => switchTab(t.value)}
              style={[styles.tabSwitchItem, tab === t.value && { backgroundColor: theme.accent }]}>
              <ThemedText
                type="small"
                themeColor={tab === t.value ? undefined : 'textSecondary'}
                style={tab === t.value ? styles.activeLabel : undefined}>
                {t.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          {categories === null && !error ? (
            <ActivityIndicator style={styles.loading} />
          ) : filtered.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              Belum ada kategori.
            </ThemedText>
          ) : (
            filtered.map((c) => {
              const expanded = expandedCategoryId === c.id;
              const categorySubs = subcategories.filter((s) => s.categoryId === c.id);
              const subFormOpen = addingSubFor === c.id || editingSub?.categoryId === c.id;
              return (
                <ThemedView
                  key={c.id}
                  type="backgroundElement"
                  style={[styles.categoryCard, { borderColor: theme.border }]}>
                  <View style={styles.categoryRow}>
                    <CategoryIcon name={c.name} icon={c.icon} />
                    <View style={styles.categoryName}>
                      <ThemedText type="smallBold" numberOfLines={1} style={styles.categoryNameText}>
                        {c.name}
                      </ThemedText>
                      {c.isDefault && (
                        <ThemedText themeColor="textSecondary" style={styles.defaultBadge}>
                          Bawaan
                        </ThemedText>
                      )}
                    </View>
                    <View style={styles.actions}>
                      <Pressable
                        onPress={() =>
                          router.push({ pathname: '/more/category-form', params: { id: c.id, type: c.type } })
                        }
                        accessibilityLabel={`Ubah ${c.name}`}
                        hitSlop={6}
                        style={styles.actionButton}>
                        <IconPencil size={16} color={theme.textSecondary} />
                      </Pressable>
                      {!c.isDefault && (
                        <Pressable
                          onPress={() => handleDelete(c)}
                          accessibilityLabel={`Hapus ${c.name}`}
                          hitSlop={6}
                          style={styles.actionButton}>
                          <IconTrash size={16} color={theme.danger} />
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => toggleExpand(c.id)}
                        accessibilityLabel={expanded ? `Tutup sub kategori ${c.name}` : `Lihat sub kategori ${c.name}`}
                        hitSlop={6}
                        style={styles.actionButton}>
                        <View style={expanded ? styles.chevronExpanded : undefined}>
                          <IconChevronRight size={16} color={theme.textSecondary} />
                        </View>
                      </Pressable>
                    </View>
                  </View>

                  {expanded && (
                    <View style={[styles.subSection, { borderTopColor: theme.border }]}>
                      {categorySubs.length === 0 && !subFormOpen && (
                        <ThemedText type="small" themeColor="textSecondary">
                          Belum ada sub kategori.
                        </ThemedText>
                      )}

                      {categorySubs.map((s) => (
                        <View key={s.id} style={styles.subRow}>
                          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.subName}>
                            {s.name}
                          </ThemedText>
                          <Pressable
                            onPress={() => openEditSubForm(s)}
                            accessibilityLabel={`Ubah ${s.name}`}
                            hitSlop={6}
                            style={styles.subAction}>
                            <IconPencil size={14} color={theme.textSecondary} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteSub(s)}
                            accessibilityLabel={`Hapus ${s.name}`}
                            hitSlop={6}
                            style={styles.subAction}>
                            <IconTrash size={14} color={theme.danger} />
                          </Pressable>
                        </View>
                      ))}

                      {subFormOpen && (
                        <View style={styles.subForm}>
                          <TextField
                            value={subName}
                            onChangeText={setSubName}
                            placeholder="mis. Bensin"
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={() => handleSubSubmit(c.id)}
                          />
                          <View style={styles.subFormButtons}>
                            <PrimaryButton
                              label="Simpan"
                              loading={subLoading}
                              onPress={() => handleSubSubmit(c.id)}
                              style={styles.subFormButton}
                            />
                            <PrimaryButton
                              label="Batal"
                              variant="secondary"
                              onPress={closeSubForm}
                              style={styles.subFormButton}
                            />
                          </View>
                        </View>
                      )}
                      {subError && (
                        <ThemedText type="small" themeColor="danger">
                          {subError}
                        </ThemedText>
                      )}

                      {!subFormOpen && (
                        <Pressable onPress={() => openAddSubForm(c.id)}>
                          <ThemedText type="small" themeColor="accent">
                            + Tambah Sub Kategori
                          </ThemedText>
                        </Pressable>
                      )}
                    </View>
                  )}
                </ThemedView>
              );
            })
          )}

          <PrimaryButton
            label="+ Tambah Kategori"
            onPress={() => router.push({ pathname: '/more/category-form', params: { type: tab } })}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  activeLabel: {
    color: '#ffffff',
  },
  tabSwitch: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.half * 2,
    gap: Spacing.half,
  },
  tabSwitchItem: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
  },
  content: {
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  loading: {
    marginTop: Spacing.five,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: Spacing.four,
  },
  categoryCard: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  categoryName: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  categoryNameText: {
    flexShrink: 1,
  },
  defaultBadge: {
    fontSize: 10,
    lineHeight: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  subSection: {
    // Sejajar dengan nama kategori: lebar ikon (36) + gap.
    paddingLeft: 36 + Spacing.three,
    gap: Spacing.two,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  subName: {
    flex: 1,
  },
  subAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subForm: {
    gap: Spacing.two,
  },
  subFormButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  subFormButton: {
    flex: 1,
    paddingVertical: Spacing.two + Spacing.half,
  },
});
