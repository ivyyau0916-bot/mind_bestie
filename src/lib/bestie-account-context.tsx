import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BestieOnboardingDialog } from "@/components/BestieOnboardingDialog";
import { getUserName, normalizeUserName, setUserName as persistUserName } from "@/lib/bestie-account";

type BestieAccountContextValue = {
  userName: string | null;
  setUserName: (name: string) => void;
  ready: boolean;
};

const BestieAccountContext = createContext<BestieAccountContextValue | null>(null);

export function BestieAccountProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUserNameState(getUserName());
    setReady(true);
  }, []);

  const setUserName = useCallback((name: string) => {
    const normalized = normalizeUserName(name);
    if (!normalized) return;
    persistUserName(normalized);
    setUserNameState(normalized);
  }, []);

  const value = useMemo(
    () => ({
      userName,
      setUserName,
      ready,
    }),
    [userName, setUserName, ready],
  );

  return (
    <BestieAccountContext.Provider value={value}>
      {children}
      {ready && !userName && <BestieOnboardingDialog onComplete={setUserName} />}
    </BestieAccountContext.Provider>
  );
}

export function useBestieAccount() {
  const ctx = useContext(BestieAccountContext);
  if (!ctx) throw new Error("useBestieAccount must be used within BestieAccountProvider");
  return ctx;
}
