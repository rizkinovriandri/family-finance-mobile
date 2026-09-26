import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { IconCalendar } from '@/components/icons';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toLocalISODate } from '@/lib/utils/date';

type DateFieldProps = {
  label: string;
  // Format YYYY-MM-DD (sama dengan kolom `date` di database).
  value: string;
  onChange: (value: string) => void;
};

function parseISODate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatLongDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (!value || Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
}

// Input tanggal dengan kalender bawaan sistem (Android: dialog, iOS: kalender inline).
// Di web (tidak didukung paket kalender) jatuh ke input teks YYYY-MM-DD.
export function DateField({ label, value, onChange }: DateFieldProps) {
  const theme = useTheme();
  const [iosOpen, setIosOpen] = useState(false);

  if (Platform.OS === 'web') {
    return <TextField label={label} value={value} onChangeText={onChange} placeholder="2026-09-25" autoCapitalize="none" />;
  }

  function handlePicked(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'ios') {
      if (selected) onChange(toLocalISODate(selected));
      return;
    }
    if (event.type === 'set' && selected) onChange(toLocalISODate(selected));
  }

  function handlePress() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: parseISODate(value), mode: 'date', onChange: handlePicked });
    } else {
      setIosOpen((open) => !open);
    }
  }

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <Pressable
        onPress={handlePress}
        style={[styles.field, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText themeColor={value ? undefined : 'textSecondary'} style={styles.value}>
          {formatLongDate(value) ?? 'Pilih tanggal'}
        </ThemedText>
        <IconCalendar size={20} color={theme.textSecondary} />
      </Pressable>
      {Platform.OS === 'ios' && iosOpen && (
        <DateTimePicker
          value={parseISODate(value)}
          mode="date"
          display="inline"
          themeVariant="dark"
          accentColor={theme.accent}
          onChange={handlePicked}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.half,
  },
  value: {
    fontSize: 16,
  },
});
