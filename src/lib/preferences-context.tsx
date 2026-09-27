import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import {
  getDefaultBalanceVisible,
  setDefaultBalanceVisible as persistDefaultBalanceVisible,
} from '@/lib/preferences';

type PreferencesContextValue = {
  defaultBalanceVisible: boolean;
  setDefaultBalanceVisible: (visible: boolean) => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// Satu sumber kebenaran untuk preferensi lokal per perangkat, dipasang di root layout supaya
// perubahan di Lainnya -> Pengaturan langsung kepropagasi ke layar lain yang sudah ter-mount
// (mis. Beranda) tanpa perlu restart aplikasi — beda dari baca AsyncStorage sekali per layar,
// yang cuma kebaca ulang kalau layarnya baru mount.
export function PreferencesProvider({ children }: PropsWithChildren) {
  const [defaultBalanceVisible, setLocalDefaultBalanceVisible] = useState(true);

  useEffect(() => {
    getDefaultBalanceVisible().then(setLocalDefaultBalanceVisible);
  }, []);

  const setDefaultBalanceVisible = useCallback(async (visible: boolean) => {
    setLocalDefaultBalanceVisible(visible);
    await persistDefaultBalanceVisible(visible);
  }, []);

  return (
    <PreferencesContext.Provider value={{ defaultBalanceVisible, setDefaultBalanceVisible }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences harus dipakai di dalam PreferencesProvider');
  return value;
}
