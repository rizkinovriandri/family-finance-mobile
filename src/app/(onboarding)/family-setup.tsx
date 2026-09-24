import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useFamily } from '@/lib/family-context';
import { createFamilyWithOwner, joinFamilyByInviteCode } from '@/lib/queries/families';
import { signOut } from '@/lib/queries/auth';

type Mode = 'create' | 'join';

export default function FamilySetupScreen() {
  const { refresh } = useFamily();
  const [mode, setMode] = useState<Mode>('create');
  const [displayName, setDisplayName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    displayName.trim().length > 0 && (mode === 'create' ? familyName.trim().length > 0 : inviteCode.trim().length > 0);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'create') {
        await createFamilyWithOwner(familyName.trim(), displayName.trim());
      } else {
        await joinFamilyByInviteCode(inviteCode, displayName.trim());
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.form}>
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Satu langkah lagi
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              Buat ruang keuangan baru untuk keluargamu, atau gabung pakai kode undangan.
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.tabs}>
            <PrimaryButton
              label="Buat Keluarga"
              variant={mode === 'create' ? 'primary' : 'secondary'}
              style={styles.tabButton}
              onPress={() => setMode('create')}
            />
            <PrimaryButton
              label="Gabung"
              variant={mode === 'join' ? 'primary' : 'secondary'}
              style={styles.tabButton}
              onPress={() => setMode('join')}
            />
          </ThemedView>

          <TextField
            label="Nama kamu"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="mis. Andri"
          />

          {mode === 'create' ? (
            <TextField
              label="Nama keluarga"
              value={familyName}
              onChangeText={setFamilyName}
              placeholder="mis. Keluarga Wijaya"
            />
          ) : (
            <TextField
              label="Kode undangan"
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="mis. AB12CD34"
              autoCapitalize="characters"
            />
          )}

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          <PrimaryButton
            label={loading ? 'Memproses...' : mode === 'create' ? 'Buat Keluarga' : 'Gabung Keluarga'}
            loading={loading}
            disabled={!canSubmit}
            onPress={handleSubmit}
          />

          <PrimaryButton label="Keluar akun" variant="danger" onPress={() => signOut()} />
        </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: Spacing.two,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  tabButton: {
    flex: 1,
  },
});
