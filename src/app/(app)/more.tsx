import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useFamily } from '@/lib/family-context';
import { signOut } from '@/lib/queries/auth';
import { getFamilyInviteCode } from '@/lib/queries/families';

export default function MoreScreen() {
  const { membership } = useFamily();
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    if (!membership) return;
    getFamilyInviteCode(membership.family_id).then(setInviteCode);
  }, [membership]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Lainnya
        </ThemedText>

        {membership && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Nama
              </ThemedText>
              <ThemedText type="smallBold">{membership.display_name}</ThemedText>
            </View>
            <View style={styles.cardRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Keluarga
              </ThemedText>
              <ThemedText type="smallBold">{membership.family_name}</ThemedText>
            </View>
            <View style={styles.cardRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Kode undangan
              </ThemedText>
              <ThemedText type="smallBold" themeColor="accent">
                {inviteCode ?? '...'}
              </ThemedText>
            </View>
          </ThemedView>
        )}

        <ThemedText type="small" themeColor="textSecondary">
          Bagikan kode undangan di atas ke anggota keluarga lain supaya mereka bisa gabung ke ruang
          data yang sama.
        </ThemedText>

        <ThemedView style={styles.spacer} />

        <PrimaryButton label="Keluar akun" variant="danger" onPress={() => signOut()} />
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
  },
});
