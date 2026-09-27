import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconPicker } from '@/components/icon-picker';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useFamily } from '@/lib/family-context';
import { createCategory, listCategories, updateCategory, type Category } from '@/lib/queries/categories';
import { categorySchema } from '@/lib/validation/category';

const DEFAULT_ICON = 'folder';

// Form tambah/ubah kategori — mirror modal di family-finance-app/components/CategoriesManager.tsx.
// `id` diisi saat mengubah; `type` (expense | income) menentukan jenis saat menambah.
export default function CategoryFormScreen() {
  const { membership } = useFamily();
  const { id, type } = useLocalSearchParams<{ id?: string; type?: string }>();
  const categoryType = type === 'income' ? 'income' : 'expense';

  const [editing, setEditing] = useState<Category | null>(null);
  const [loadingEditing, setLoadingEditing] = useState(Boolean(id));
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    listCategories()
      .then((list) => {
        if (cancelled) return;
        const found = list.find((c) => c.id === id) ?? null;
        setEditing(found);
        if (found) {
          setName(found.name);
          setIcon(found.icon ?? DEFAULT_ICON);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat kategori.');
      })
      .finally(() => {
        if (!cancelled) setLoadingEditing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit() {
    if (!membership) return;
    const result = categorySchema.safeParse({ name, type: editing?.type ?? categoryType, icon });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Data tidak valid');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (editing) {
        await updateCategory(editing.id, { name: result.data.name, icon: result.data.icon });
      } else {
        await createCategory(membership.family_id, result.data);
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kategori.');
      setLoading(false);
    }
  }

  const title = id
    ? 'Ubah kategori'
    : `Tambah kategori ${categoryType === 'expense' ? 'pengeluaran' : 'pemasukan'}`;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="smallBold" themeColor="accent">
              Batal
            </ThemedText>
          </Pressable>
          <ThemedText type="smallBold">{title}</ThemedText>
          <ThemedView style={styles.headerSpacer} />
        </ThemedView>

        {loadingEditing ? (
          <ActivityIndicator style={styles.loading} />
        ) : id && !editing ? (
          <ThemedText type="small" themeColor="danger">
            {error ?? 'Kategori tidak ditemukan.'}
          </ThemedText>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
              <TextField label="Nama kategori" value={name} onChangeText={setName} autoFocus />

              <View style={styles.field}>
                <ThemedText type="small" themeColor="textSecondary">
                  Ikon
                </ThemedText>
                <IconPicker value={icon} onChange={setIcon} />
              </View>

              {error && (
                <ThemedText type="small" themeColor="danger">
                  {error}
                </ThemedText>
              )}

              <PrimaryButton label={loading ? 'Menyimpan...' : 'Simpan'} loading={loading} onPress={handleSubmit} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 40,
  },
  loading: {
    marginTop: Spacing.five,
  },
  form: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  field: {
    gap: Spacing.one,
  },
});
