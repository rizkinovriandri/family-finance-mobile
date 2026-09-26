import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { IconChevronRight, IconLayoutGrid } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Category } from '@/lib/queries/categories';

type CategoryFilterDropdownProps = {
  categories: readonly Category[];
  value: string;
  onChange: (categoryId: string) => void;
};

// Dropdown filter kategori — mirror family-finance-app/components/CategoryFilterDropdown.tsx.
// Daftar opsi dibuka sebagai modal mengambang (bukan popover) supaya konsisten di layar sempit.
export function CategoryFilterDropdown({ categories, value, onChange }: CategoryFilterDropdownProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value) ?? null;

  function select(categoryId: string) {
    onChange(categoryId);
    setOpen(false);
  }

  const allIcon = (
    <View style={[styles.allIcon, { backgroundColor: theme.background }]}>
      <IconLayoutGrid size={12} color={theme.textSecondary} />
    </View>
  );

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { backgroundColor: theme.background, borderColor: theme.border }]}>
        {selected ? <CategoryIcon name={selected.name} icon={selected.icon} variant="chip" /> : allIcon}
        <ThemedText type="small" numberOfLines={1} style={styles.triggerLabel}>
          {selected ? selected.name : 'Semua Kategori'}
        </ThemedText>
        <View style={styles.chevron}>
          <IconChevronRight size={14} color={theme.textSecondary} />
        </View>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ScrollView>
              <Option
                selected={value === ''}
                label="Semua Kategori"
                icon={allIcon}
                onPress={() => select('')}
              />
              {categories.map((c) => (
                <Option
                  key={c.id}
                  selected={value === c.id}
                  label={c.name}
                  icon={<CategoryIcon name={c.name} icon={c.icon} variant="chip" />}
                  onPress={() => select(c.id)}
                />
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function Option({
  selected,
  label,
  icon,
  onPress,
}: {
  selected: boolean;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.option, selected && { backgroundColor: `${theme.accent}26` }]}>
      {icon}
      <ThemedText type="small" themeColor={selected ? 'accent' : undefined} numberOfLines={1} style={styles.optionLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    maxWidth: 200,
  },
  triggerLabel: {
    flexShrink: 1,
  },
  chevron: {
    transform: [{ rotate: '90deg' }],
  },
  allIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  menu: {
    width: '100%',
    maxWidth: 320,
    maxHeight: 360,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.half,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.two,
  },
  optionLabel: {
    flex: 1,
  },
});
