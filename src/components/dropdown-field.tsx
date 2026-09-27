import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { IconChevronDown } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PickerOption } from '@/components/chip-picker';

type DropdownFieldProps = {
  label?: string;
  options: readonly PickerOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
};

// Sama seperti ChipPicker (opsi {value, label}), tapi dibuka lewat modal dropdown, bukan
// baris chip yang bisa digeser — dipakai untuk pilihan akun di form transaksi.
export function DropdownField({ label, options, value, onChange, error, placeholder = 'Pilih...' }: DropdownFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      )}

      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="default" numberOfLines={1} style={styles.triggerLabel} themeColor={selected ? undefined : 'textSecondary'}>
          {selected ? selected.label : placeholder}
        </ThemedText>
        <IconChevronDown size={18} color={theme.textSecondary} />
      </Pressable>

      {error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ScrollView>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => select(option.value)}
                    style={[styles.option, isSelected && { backgroundColor: `${theme.accent}26` }]}>
                    <ThemedText
                      type="small"
                      themeColor={isSelected ? 'accent' : undefined}
                      numberOfLines={1}
                      style={styles.optionLabel}>
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.half,
  },
  triggerLabel: {
    flex: 1,
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
    maxWidth: 360,
    maxHeight: 360,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two,
  },
  option: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.two + Spacing.half,
  },
  optionLabel: {
    flex: 1,
  },
});
