import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { getInitials } from '@/lib/utils/avatar';

type AvatarProps = {
  uri?: string | null;
  name: string;
  size?: number;
};

// Foto profil, atau lingkaran aksen berisi inisial kalau belum ada foto.
export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const theme = useTheme();
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[dimension, { backgroundColor: theme.background }]} />;
  }

  return (
    <View style={[styles.fallback, dimension, { backgroundColor: theme.accent }]}>
      <ThemedText type="smallBold" style={[styles.initials, { fontSize: size * 0.36, lineHeight: size * 0.5 }]}>
        {getInitials(name)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
  },
});
