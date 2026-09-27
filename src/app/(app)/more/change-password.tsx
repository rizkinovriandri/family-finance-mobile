import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/back-header';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { signInWithPassword, updatePassword } from '@/lib/queries/auth';
import { translateAuthError } from '@/lib/utils/auth-errors';

// Ubah Kata Sandi — dipanggil dari Lainnya -> Edit Profil. Password saat ini dipakai untuk
// re-autentikasi (signInWithPassword) sebelum updateUser, supaya sesi yang tertinggal di
// perangkat lain/hilang tidak bisa mengganti password tanpa tahu password lama.
export default function ChangePasswordScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInvalid =
    !currentPassword || newPassword.length < 6 || newPassword !== confirmPassword;

  async function handleSubmit() {
    if (!user?.email) return;
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: reauthError } = await signInWithPassword(user.email, currentPassword);
    if (reauthError) {
      setError(translateAuthError(reauthError.message));
      setLoading(false);
      return;
    }

    const { error: updateError } = await updatePassword(newPassword);
    if (updateError) {
      setError(translateAuthError(updateError.message));
      setLoading(false);
      return;
    }

    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <BackHeader title="Ubah Kata Sandi" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <TextField
                label="Password Saat Ini"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoComplete="password"
                placeholder="Password kamu sekarang"
              />
              <TextField
                label="Password Baru"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoComplete="password-new"
                placeholder="Min. 6 karakter"
              />
              <TextField
                label="Konfirmasi Password Baru"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password-new"
                placeholder="Ulangi password baru"
              />
            </ThemedView>

            {error && (
              <ThemedText type="small" themeColor="danger">
                {error}
              </ThemedText>
            )}

            <PrimaryButton
              label={loading ? 'Menyimpan...' : 'Simpan'}
              loading={loading}
              disabled={isInvalid}
              onPress={handleSubmit}
            />
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  card: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
