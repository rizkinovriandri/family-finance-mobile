import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BackHeader } from '@/components/back-header';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { useFamily } from '@/lib/family-context';
import { updateAvatarUrl, updateDisplayName, updateFamilyName, uploadAvatar } from '@/lib/queries/families';

// Edit Profil — mirror family-finance-app/components/ProfileSettings.tsx (nama & nama keluarga).
// Foto profil: dipilih dari galeri (dipotong persegi), diunggah ke bucket `avatars` lalu URL-nya disimpan di family_members.
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProfileScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { membership, refresh } = useFamily();
  const initialDisplayName = membership?.display_name ?? '';
  const initialFamilyName = membership?.family_name ?? '';

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [familyName, setFamilyName] = useState(initialFamilyName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const trimmedDisplayName = displayName.trim();
  const trimmedFamilyName = familyName.trim();
  const isUnchanged = trimmedDisplayName === initialDisplayName && trimmedFamilyName === initialFamilyName;
  const isInvalid = trimmedDisplayName.length === 0 || trimmedFamilyName.length === 0;

  async function handlePickAvatar() {
    if (!membership || !user) return;
    setAvatarError(null);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (!ACCEPTED_AVATAR_TYPES.includes(mimeType)) {
      setAvatarError('Format foto harus JPG, PNG, atau WEBP.');
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_AVATAR_SIZE) {
      setAvatarError('Ukuran foto maksimal 2MB.');
      return;
    }

    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(user.id, asset.uri, mimeType);
      await updateAvatarUrl(membership.id, url);
      await refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Gagal mengunggah foto.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSave() {
    if (!membership) return;
    if (isInvalid) {
      setError('Nama tidak boleh kosong.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (trimmedDisplayName !== initialDisplayName) {
        await updateDisplayName(membership.id, trimmedDisplayName);
      }
      if (trimmedFamilyName !== initialFamilyName) {
        await updateFamilyName(membership.family_id, trimmedFamilyName);
      }
      await refresh();
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <BackHeader title="Edit Profil" />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedView type="backgroundElement" style={[styles.card, styles.avatarCard, { borderColor: theme.border }]}>
              <Avatar uri={membership?.avatar_url} name={displayName} size={80} />
              <PrimaryButton
                variant="secondary"
                label={avatarUploading ? 'Mengunggah foto...' : 'Ganti Foto'}
                loading={avatarUploading}
                onPress={handlePickAvatar}
              />
              <ThemedText type="small" themeColor="textSecondary" style={styles.helper}>
                JPG, PNG, atau WEBP, maks. 2MB
              </ThemedText>
              {avatarError && (
                <ThemedText type="small" themeColor="danger">
                  {avatarError}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <TextField
                label="Nama Kamu"
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={60}
                placeholder="mis. Andri"
              />
              <View style={styles.fieldGroup}>
                <TextField
                  label="Nama Keluarga"
                  value={familyName}
                  onChangeText={setFamilyName}
                  maxLength={60}
                  placeholder="mis. Keluarga Andri"
                />
                <ThemedText type="small" themeColor="textSecondary" style={styles.helper}>
                  Perubahan ini berlaku untuk semua anggota keluarga.
                </ThemedText>
              </View>
            </ThemedView>

            {error && (
              <ThemedText type="small" themeColor="danger">
                {error}
              </ThemedText>
            )}

            <PrimaryButton
              label={loading ? 'Menyimpan...' : 'Simpan'}
              loading={loading}
              disabled={isUnchanged || isInvalid}
              onPress={handleSave}
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
    paddingHorizontal: Spacing.four,
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
  avatarCard: {
    alignItems: 'center',
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  helper: {
    fontSize: 12,
    lineHeight: 16,
  },
});
