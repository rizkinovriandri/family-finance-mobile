import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { signUpWithPassword } from '@/lib/queries/auth';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const { error } = await signUpWithPassword(email.trim(), password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.form}>
            <ThemedText type="title" style={styles.title}>
              Cek email kamu
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              Kami sudah mengirim link konfirmasi ke {email}. Setelah dikonfirmasi, kamu bisa masuk
              dan membuat atau bergabung ke keluarga.
            </ThemedText>
            <Link href="/login">
              <ThemedText type="smallBold" themeColor="accent">
                Kembali ke halaman masuk
              </ThemedText>
            </Link>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.form}>
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Daftar
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              Buat akun untuk mulai mencatat keuangan keluarga.
            </ThemedText>
          </ThemedView>

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
          />

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          <PrimaryButton
            label={loading ? 'Memproses...' : 'Daftar'}
            loading={loading}
            disabled={!email || password.length < 6}
            onPress={handleSubmit}
          />

          <ThemedView style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              Sudah punya akun?{' '}
            </ThemedText>
            <Link href="/login">
              <ThemedText type="smallBold" themeColor="accent">
                Masuk
              </ThemedText>
            </Link>
          </ThemedView>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
});
