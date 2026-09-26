import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Kartu kode undangan keluarga + tombol Salin — mirror family-finance-app/components/InviteCodeCard.tsx.
export function InviteCodeCard({ inviteCode }: { inviteCode: string }) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function handleCopy() {
    try {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard bisa gagal (mis. izin browser) — abaikan, kode tetap terlihat dan bisa disalin manual.
    }
  }

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View>
        <ThemedText type="small" themeColor="textSecondary">
          Kode undangan keluarga
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          Bagikan ke anggota keluarga lain supaya bisa gabung ke keluarga ini.
        </ThemedText>
      </View>
      <View style={[styles.codeRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <ThemedText selectable style={styles.code}>
          {inviteCode}
        </ThemedText>
        <Pressable onPress={handleCopy} hitSlop={8}>
          <ThemedText type="smallBold" themeColor="accent">
            {copied ? 'Tersalin!' : 'Salin'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  hint: {
    opacity: 0.85,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  code: {
    fontSize: 18,
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
});
