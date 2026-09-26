import { useEffect, useId, useState } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

// Jeda penggabungan event: satu aksi bisa menulis beberapa baris (mis. transfer = 3 tulis),
// jadi event beruntun dalam jendela ini cukup memicu satu kali muat ulang.
const DEBOUNCE_MS = 300;

// Realtime sync antar anggota keluarga & antar platform (web ↔ mobile) — padanan
// family-finance-app/lib/hooks/useRealtimeTable.ts.
//
// Hook mengembalikan penghitung `tick` yang naik tiap kali ada perubahan (insert/update/delete)
// pada salah satu `tables` milik `familyId`, atau saat aplikasi kembali aktif dari background.
// Cara pakai: masukkan `tick` ke dependency fungsi muat data layar, sehingga data ikut dimuat
// ulang tanpa perlu menyimpan callback:
//
//   const reloadTick = useRealtimeTick(['transactions', 'accounts'], membership?.family_id);
//   useFocusEffect(useCallback(() => { load(); }, [load, reloadTick]));
//
// Tabel yang dilanggan harus masuk publication `supabase_realtime` (lihat migrasi di family-finance-app).
export function useRealtimeTick(tables: readonly string[], familyId: string | undefined) {
  const [tick, setTick] = useState(0);
  // Nama channel harus unik per instance hook — dua layar yang melanggan tabel + keluarga yang sama
  // akan berebut channel yang sama dan gagal dengan "cannot add postgres_changes callbacks after subscribe()".
  const instanceId = useId();
  const tablesKey = tables.join(',');

  useEffect(() => {
    if (!familyId) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const bump = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setTick((t) => t + 1), DEBOUNCE_MS);
    };

    let channel = supabase.channel(`realtime-${familyId}-${instanceId}`);
    for (const table of tablesKey.split(',')) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `family_id=eq.${familyId}` },
        bump
      );
    }
    channel.subscribe();

    // Event yang terlewat saat aplikasi di background tidak diputar ulang — muat ulang saat kembali aktif.
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') bump();
    });

    return () => {
      if (timer) clearTimeout(timer);
      appStateSubscription.remove();
      supabase.removeChannel(channel);
    };
  }, [tablesKey, familyId, instanceId]);

  return tick;
}
