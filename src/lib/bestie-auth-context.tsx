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
  friendlyAuthErrorMessage,
  validateAuthEmail,
  validateAuthPassword,
  type AuthActionResult,
} from "@/lib/bestie-auth-credentials";
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
import { resolveAuthEmailForEntitlement } from "@/lib/bestie-auth-session";
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
  signInWithPassword: (email: string, password: string) => Promise<AuthActionResult>;
  signUpWithPassword: (email: string, password: string) => Promise<AuthActionResult>;
  signInWithGoogle: () => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  refreshVipFromAccount: () => Promise<void>;
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
    async (fallbackEmail?: string | null) => {
      const email = await resolveAuthEmailForEntitlement(fallbackEmail);
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
    await syncVipAfterAuth(user?.email ?? readPersistedAuthUser()?.email ?? null);
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

  const signInWithPassword = useCallback(async (emailRaw: string, password: string): Promise<AuthActionResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const message = "Supabase 尚未設定，請稍後再試。";
      toast.error(message);
      return { ok: false, message };
    }
    const emailCheck = validateAuthEmail(emailRaw);
    if (!emailCheck.ok) {
      toast.error(emailCheck.message);
      return emailCheck;
    }
    const passwordCheck = validateAuthPassword(password);
    if (!passwordCheck.ok) {
      toast.error(passwordCheck.message);
      return passwordCheck;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailCheck.email,
      password,
    });
    if (error) {
      const message = friendlyAuthErrorMessage(error);
      toast.error(message);
      return { ok: false, message };
    }
    return { ok: true };
  }, []);

  const signUpWithPassword = useCallback(async (emailRaw: string, password: string): Promise<AuthActionResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const message = "Supabase 尚未設定，請稍後再試。";
      toast.error(message);
      return { ok: false, message };
    }
    const emailCheck = validateAuthEmail(emailRaw);
    if (!emailCheck.ok) {
      toast.error(emailCheck.message);
      return emailCheck;
    }
    const passwordCheck = validateAuthPassword(password);
    if (!passwordCheck.ok) {
      toast.error(passwordCheck.message);
      return passwordCheck;
    }

    const { data, error } = await supabase.auth.signUp({
      email: emailCheck.email,
      password,
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    if (error) {
      const message = friendlyAuthErrorMessage(error);
      toast.error(message);
      return { ok: false, message };
    }
    if (data.session?.user) {
      toast.success("註冊成功，歡迎加入 Bestie！");
      return { ok: true };
    }
    toast.info("註冊成功 ✉️ 請到信箱點擊驗證連結後再登入。");
    return { ok: true };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthActionResult> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const message = "Supabase 尚未設定，請稍後再試。";
      toast.error(message);
      return { ok: false, message };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    });
    if (error) {
      console.error("Google 登入失敗:", error.message);
      const message = friendlyAuthErrorMessage(error);
      toast.error(message);
      return { ok: false, message };
    }
    return { ok: true };
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
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
      refreshVipFromAccount,
      refreshFromCallback,
    }),
    [
      configured,
      loading,
      user,
      authOpen,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
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
          onSignIn={signInWithPassword}
          onSignUp={signUpWithPassword}
          onGoogleSignIn={signInWithGoogle}
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
