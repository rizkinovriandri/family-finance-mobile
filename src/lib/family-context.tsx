import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/lib/auth-context';
import { getMyFamilyMembership, type FamilyMembership } from '@/lib/queries/families';

type FamilyContextValue = {
  membership: FamilyMembership | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [membership, setMembership] = useState<FamilyMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setMembership(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await getMyFamilyMembership(user.id);
    setMembership(result);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/dep-change, not a render-triggered update
    refresh();
  }, [refresh]);

  return (
    <FamilyContext.Provider value={{ membership, isLoading, refresh }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const value = useContext(FamilyContext);
  if (!value) throw new Error('useFamily harus dipakai di dalam FamilyProvider');
  return value;
}
