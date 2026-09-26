import Constants from 'expo-constants';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import {
  IconCalendar,
  IconChevronRight,
  IconFolder,
  IconInfoCircle,
  IconLogout,
  IconUser,
  type TablerIcon,
} from '@/components/icons';
import { InviteCodeCard } from '@/components/invite-code-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { useFamily } from '@/lib/family-context';
import { signOut } from '@/lib/queries/auth';
import { getFamilyInviteCode } from '@/lib/queries/families';

type MenuItem = { label: string; icon: TablerIcon; href: Href };

const MENU_ITEMS: MenuItem[] = [
  { label: 'Edit Profil', icon: IconUser, href: '/more/profile' },
  { label: 'Kelola Kategori', icon: IconFolder, href: '/more/categories' },
  { label: 'Tanggal Awal', icon: IconCalendar, href: '/more/start-date' },
];

// Layar "Lainnya" — mirror halaman "Profil & Pengaturan" family-finance-app: kartu profil, kode
// undangan, daftar menu (Edit Profil, Kelola Kategori, Tanggal Awal, Tentang Aplikasi), lalu Keluar.
// "Install Hint" milik web (PWA) sengaja tidak ada — di aplikasi ini tidak relevan.
export default function MoreScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { membership } = useFamily();
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!membership) return;
      let cancelled = false;
      getFamilyInviteCode(membership.family_id)
        .then((code) => {
          if (!cancelled) setInviteCode(code);
        })
        .catch(() => {
          if (!cancelled) setInviteCode(null);
        });
      return () => {
        cancelled = true;
      };
    }, [membership])
  );

  const displayName = membership?.display_name ?? '-';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Profil & Pengaturan
        </ThemedText>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedView type="backgroundElement" style={[styles.card, styles.profileCard, { borderColor: theme.border }]}>
            <Avatar uri={membership?.avatar_url} name={displayName} size={48} />
            <View style={styles.profileText}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {displayName}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {user?.email}
              </ThemedText>
            </View>
          </ThemedView>

          {inviteCode && <InviteCodeCard inviteCode={inviteCode} />}

          <ThemedView type="backgroundElement" style={[styles.menu, { borderColor: theme.border }]}>
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.href)}
                style={[styles.menuRow, { borderBottomColor: theme.border }]}>
                <MenuIcon Icon={item.icon} />
                <ThemedText type="small" style={styles.menuLabel}>
                  {item.label}
                </ThemedText>
                <IconChevronRight size={16} color={theme.textSecondary} />
              </Pressable>
            ))}

            <View style={styles.menuRow}>
              <MenuIcon Icon={IconInfoCircle} />
              <ThemedText type="small" style={styles.menuLabel}>
                Tentang Aplikasi
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.versionText}>
                Mavyn v{version}
              </ThemedText>
            </View>
          </ThemedView>

          <Pressable
            onPress={() => signOut()}
            style={[styles.card, styles.logoutRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.menuIcon, { backgroundColor: `${theme.danger}26` }]}>
              <IconLogout size={18} color={theme.danger} />
            </View>
            <ThemedText type="smallBold" themeColor="danger">
              Keluar
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function MenuIcon({ Icon }: { Icon: TablerIcon }) {
  const theme = useTheme();
  return (
    <View style={[styles.menuIcon, { backgroundColor: `${theme.accent}26` }]}>
      <Icon size={18} color={theme.accent} />
    </View>
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  card: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    padding: Spacing.three,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  menu: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
  },
  versionText: {
    fontSize: 12,
    lineHeight: 16,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
