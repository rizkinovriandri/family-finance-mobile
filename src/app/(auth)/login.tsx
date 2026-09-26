import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField } from '@/components/auth-field';
import { AuthHeader } from '@/components/auth-header';
import { GradientButton } from '@/components/gradient-button';
import { IconLock, IconMail } from '@/components/icons';
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
          <AuthHeader title="Selamat datang kembali!" subtitle="Yuk, kelola keuanganmu lebih" highlight="pintar." />

          <AuthField
            Icon={IconMail}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <AuthField
            Icon={IconLock}
            secure
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
          />

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          <GradientButton
            label="Masuk"
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
});
