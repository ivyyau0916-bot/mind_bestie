import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type AppSettingsContextValue = {
  preferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  setPreferencesOpen: (open: boolean) => void;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const openPreferences = useCallback(() => setPreferencesOpen(true), []);
  const closePreferences = useCallback(() => setPreferencesOpen(false), []);

  const value = useMemo(
    () => ({
      preferencesOpen,
      openPreferences,
      closePreferences,
      setPreferencesOpen,
    }),
    [preferencesOpen, openPreferences, closePreferences],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): AppSettingsContextValue {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return ctx;
}
