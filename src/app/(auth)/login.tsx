import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { signInWithPassword } from '@/lib/queries/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const { error } = await signInWithPassword(email.trim(), password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Sukses login memicu AuthProvider mengganti session, root layout
    // otomatis redirect lewat Stack.Protected — tidak perlu navigasi manual.
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.form}>
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Masuk
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              Catat keuangan keluarga bareng-bareng, real-time.
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
            autoComplete="password"
          />

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          <PrimaryButton
            label={loading ? 'Memproses...' : 'Masuk'}
            loading={loading}
            disabled={!email || !password}
            onPress={handleSubmit}
          />

          <ThemedView style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              Belum punya akun?{' '}
            </ThemedText>
            <Link href="/register">
              <ThemedText type="smallBold" themeColor="accent">
                Daftar
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
