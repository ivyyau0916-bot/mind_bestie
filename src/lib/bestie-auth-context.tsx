import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { BestieAuthDialog } from "@/components/BestieAuthDialog";
import {
  getAuthRedirectUrl,
  getSupabaseClient,
  isSupabaseConfigured,
  mapSupabaseUser,
  type BestieAuthUser,
} from "@/lib/supabase";
import {
  completeSupabaseAuthCallback,
  readPersistedAuthUser,
  writePersistedAuthUser,
} from "@/lib/supabase-auth-callback";
import { applyVipEntitlementForSession } from "@/lib/vip-entitlement";
import { clearVipMembership } from "@/lib/vip-subscription";
import { useMood } from "@/lib/mood-store";

type BestieAuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: BestieAuthUser | null;
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  signInWithMagicLink: (email: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
  refreshVipFromAccount: () => Promise<void>;
  /** Apply session after URL callback exchange (also persists email locally). */
  refreshFromCallback: (user: BestieAuthUser) => Promise<void>;
};

const BestieAuthContext = createContext<BestieAuthContextValue | null>(null);

export function BestieAuthProvider({ children }: { children: ReactNode }) {
  const { setIsVip } = useMood();
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<BestieAuthUser | null>(() => readPersistedAuthUser());
  const [authOpen, setAuthOpen] = useState(false);

  const syncVipAfterAuth = useCallback(
    async (email: string | null | undefined) => {
      const entitled = await applyVipEntitlementForSession(email);
      setIsVip(entitled);
    },
    [setIsVip],
  );

  const applySessionUser = useCallback(
    async (next: BestieAuthUser | null, options?: { closeAuthDialog?: boolean }) => {
      setUser(next);
      writePersistedAuthUser(next);
      await syncVipAfterAuth(next?.email ?? null);
      if (options?.closeAuthDialog) setAuthOpen(false);
    },
    [syncVipAfterAuth],
  );

  const refreshFromCallback = useCallback(
    async (authUser: BestieAuthUser) => {
      await applySessionUser(authUser, { closeAuthDialog: true });
    },
    [applySessionUser],
  );

  const refreshVipFromAccount = useCallback(async () => {
    const email = readPersistedAuthUser()?.email ?? user?.email;
    await syncVipAfterAuth(email ?? null);
  }, [syncVipAfterAuth, user?.email]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      void syncVipAfterAuth(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function bootstrapAuth() {
      const fromCallback = await completeSupabaseAuthCallback(supabase!);
      const { data: { session }, error } = await supabase!.auth.getSession();
      if (error) console.warn("[auth]", error.message);
      if (!mounted) return;
      const mapped = mapSupabaseUser(session?.user ?? null) ?? fromCallback;
      await applySessionUser(mapped, { closeAuthDialog: Boolean(fromCallback?.email) });
      if (mounted) setLoading(false);
    }

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const mapped = mapSupabaseUser(session?.user ?? null);
      void applySessionUser(mapped, { closeAuthDialog: event === "SIGNED_IN" });
      if (event === "SIGNED_IN" && mapped?.email) {
        toast.success(`已登入：${mapped.email}`);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySessionUser]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false as const, message: "Supabase 尚未設定，請稍後再試。" };
    }
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      return { ok: false as const, message: "請輸入有效的 Email。" };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    writePersistedAuthUser(null);
    clearVipMembership();
    setIsVip(false);
  }, [setIsVip]);

  const value = useMemo(
    () => ({
      configured,
      loading,
      user,
      authOpen,
      openAuth: () => setAuthOpen(true),
      closeAuth: () => setAuthOpen(false),
      signInWithMagicLink,
      signOut,
      refreshVipFromAccount,
      refreshFromCallback,
    }),
    [
      configured,
      loading,
      user,
      authOpen,
      signInWithMagicLink,
      signOut,
      refreshVipFromAccount,
      refreshFromCallback,
    ],
  );

  return (
    <BestieAuthContext.Provider value={value}>
      {children}
      {configured && (
        <BestieAuthDialog open={authOpen} onOpenChange={setAuthOpen} onMagicLink={signInWithMagicLink} />
      )}
    </BestieAuthContext.Provider>
  );
}

export function useBestieAuth() {
  const ctx = useContext(BestieAuthContext);
  if (!ctx) throw new Error("useBestieAuth must be used within BestieAuthProvider");
  return ctx;
}
