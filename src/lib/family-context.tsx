import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/lib/auth-context';
import { getMyFamilyMembership, type FamilyMembership } from '@/lib/queries/families';
import { supabase } from '@/lib/supabase';

// Sama seperti jeda penggabungan event di use-realtime-tick.ts.
const DEBOUNCE_MS = 300;

type FamilyContextValue = {
  membership: FamilyMembership | null;
  isLoading: boolean;
  // Terisi kalau memuat keanggotaan gagal (mis. offline) — layar root menampilkan tombol "Coba lagi"
  // alih-alih salah mengira pengguna belum punya keluarga.
  loadError: string | null;
  // Muat ulang diam-diam (tanpa spinner) setelah data keluarga/profil berubah.
  refresh: () => Promise<void>;
  // Muat ulang penuh dengan spinner, setelah gagal memuat.
  retry: () => void;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  // Pakai id (string), bukan objek `user` — Supabase menerbitkan objek session baru tiap token
  // di-refresh, dan itu tidak boleh memicu muat ulang keanggotaan (yang menampilkan spinner
  // dan membongkar seluruh navigator).
  const userId = user?.id;
  const [membership, setMembership] = useState<FamilyMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) {
      setMembership(null);
      return;
    }
    setMembership(await getMyFamilyMembership(userId));
  }, [userId]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!userId) {
        setMembership(null);
        setLoadError(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await getMyFamilyMembership(userId);
        if (!cancelled) setMembership(result);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Gagal memuat data keluarga.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  // Realtime sync untuk nama keluarga & profil anggota (termasuk yang diubah dari perangkat/anggota
  // lain) — beda dari useRealtimeTick karena "families" difilter lewat `id`, bukan `family_id`.
  const familyId = membership?.family_id;
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  });

  useEffect(() => {
    if (!familyId) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const bump = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => refreshRef.current(), DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`realtime-family-${familyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'families', filter: `id=eq.${familyId}` }, bump)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'family_members', filter: `family_id=eq.${familyId}` },
        bump
      )
      .subscribe();

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') bump();
    });

    return () => {
      if (timer) clearTimeout(timer);
      appStateSubscription.remove();
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  return (
    <FamilyContext.Provider value={{ membership, isLoading, loadError, refresh, retry }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const value = useContext(FamilyContext);
  if (!value) throw new Error('useFamily harus dipakai di dalam FamilyProvider');
  return value;
}
