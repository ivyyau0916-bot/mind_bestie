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
import { fetchVipEntitlementByEmail } from "@/lib/vip-entitlement";
import { readStoredIsVip } from "@/lib/vip-subscription";
import { useMood } from "@/lib/mood-store";

type BestieAuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: BestieAuthUser | null;
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  signInWithGoogle: () => Promise<void>;
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

  const applySessionUser = useCallback(
    async (next: BestieAuthUser | null, options?: { closeAuthDialog?: boolean }) => {
      setUser(next);
      writePersistedAuthUser(next);
      if (!next?.email) {
        setIsVip(readStoredIsVip());
        return;
      }
      const entitled = await fetchVipEntitlementByEmail(next.email);
      if (entitled) setIsVip(true);
      else setIsVip(readStoredIsVip());
      if (options?.closeAuthDialog) setAuthOpen(false);
    },
    [setIsVip],
  );

  const refreshFromCallback = useCallback(
    async (authUser: BestieAuthUser) => {
      await applySessionUser(authUser, { closeAuthDialog: true });
    },
    [applySessionUser],
  );

  const refreshVipFromAccount = useCallback(async () => {
    const current = user;
    if (!current?.email) {
      setIsVip(readStoredIsVip());
      return;
    }
    const entitled = await fetchVipEntitlementByEmail(current.email);
    setIsVip(entitled || readStoredIsVip());
  }, [setIsVip, user]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function bootstrapAuth() {
      await completeSupabaseAuthCallback(supabase!);
      const { data: { session }, error } = await supabase!.auth.getSession();
      if (error) console.warn("[auth]", error.message);
      if (!mounted) return;
      await applySessionUser(mapSupabaseUser(session?.user ?? null));
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

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase 尚未設定");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthRedirectUrl("/profile") },
    });
    if (error) throw error;
  }, []);

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
      options: { emailRedirectTo: getAuthRedirectUrl("/profile") },
    });
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    await applySessionUser(null);
    setIsVip(readStoredIsVip());
  }, [applySessionUser, setIsVip]);

  const value = useMemo(
    () => ({
      configured,
      loading,
      user,
      authOpen,
      openAuth: () => setAuthOpen(true),
      closeAuth: () => setAuthOpen(false),
      signInWithGoogle,
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
      signInWithGoogle,
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
        <BestieAuthDialog
          open={authOpen}
          onOpenChange={setAuthOpen}
          onGoogleSignIn={signInWithGoogle}
          onMagicLink={signInWithMagicLink}
        />
      )}
    </BestieAuthContext.Provider>
  );
}

export function useBestieAuth() {
  const ctx = useContext(BestieAuthContext);
  if (!ctx) throw new Error("useBestieAuth must be used within BestieAuthProvider");
  return ctx;
}
