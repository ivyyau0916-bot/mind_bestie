import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { VipLoginBeforeCheckoutDialog } from "@/components/VipLoginBeforeCheckoutDialog";
import { useAppSettings } from "@/lib/app-settings-context";
import { useBestieAuth } from "@/lib/bestie-auth-context";
import { redirectToStripeCheckout } from "@/lib/stripe-checkout";
import { clearStripeCheckoutPending } from "@/lib/vip-subscription";
import {
  evaluateVipCheckoutGate,
  VIP_CHECKOUT_LOGIN_REQUIRED_MESSAGE,
} from "@/lib/vip-checkout-gate";
import {
  consumeVipCheckoutResumeAfterLogin,
  hasVipCheckoutResumeAfterLogin,
  markVipCheckoutResumeAfterLogin,
} from "@/lib/vip-checkout-after-login";

type StripeCheckoutContextValue = {
  startVipCheckout: () => void;
};

const StripeCheckoutContext = createContext<StripeCheckoutContextValue | null>(null);

export function StripeCheckoutProvider({ children }: { children: ReactNode }) {
  const { user, loading, signInWithPassword, signUpWithPassword, signInWithGoogle } = useBestieAuth();
  const { closePreferences } = useAppSettings();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const pendingAfterLoginRef = useRef(false);

  const proceedToStripeIfAuthed = useCallback(async (): Promise<boolean> => {
    const gate = await evaluateVipCheckoutGate(loading);
    if (gate.allowed) {
      pendingAfterLoginRef.current = false;
      consumeVipCheckoutResumeAfterLogin();
      setLoginPromptOpen(false);
      redirectToStripeCheckout(gate.email);
      return true;
    }
    return false;
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const shouldResume =
      pendingAfterLoginRef.current || hasVipCheckoutResumeAfterLogin();
    if (!shouldResume) return;
    void proceedToStripeIfAuthed();
  }, [loading, user?.email, user?.id, proceedToStripeIfAuthed]);

  const startVipCheckout = useCallback(() => {
    void (async () => {
      closePreferences();
      const gate = await evaluateVipCheckoutGate(loading);
      if (gate.allowed) {
        redirectToStripeCheckout(gate.email);
        return;
      }
      clearStripeCheckoutPending();
      pendingAfterLoginRef.current = true;
      markVipCheckoutResumeAfterLogin();
      setLoginPromptOpen(true);
    })();
  }, [closePreferences, loading]);

  const wrapAuthForCheckout = useCallback(
    (action: (email: string, password: string) => ReturnType<typeof signInWithPassword>) =>
      async (email: string, password: string) => {
        pendingAfterLoginRef.current = true;
        markVipCheckoutResumeAfterLogin();
        const result = await action(email, password);
        if (!result.ok) {
          pendingAfterLoginRef.current = false;
          consumeVipCheckoutResumeAfterLogin();
        }
        return result;
      },
    [],
  );

  const googleSignInForCheckout = useCallback(async () => {
    pendingAfterLoginRef.current = true;
    markVipCheckoutResumeAfterLogin();
    const result = await signInWithGoogle();
    if (!result.ok) {
      pendingAfterLoginRef.current = false;
      consumeVipCheckoutResumeAfterLogin();
    }
    return result;
  }, [signInWithGoogle]);

  return (
    <StripeCheckoutContext.Provider value={{ startVipCheckout }}>
      {children}
      <VipLoginBeforeCheckoutDialog
        open={loginPromptOpen}
        onOpenChange={(open) => {
          setLoginPromptOpen(open);
          if (!open) {
            pendingAfterLoginRef.current = false;
            consumeVipCheckoutResumeAfterLogin();
          }
        }}
        loginHint={VIP_CHECKOUT_LOGIN_REQUIRED_MESSAGE}
        onSignIn={wrapAuthForCheckout(signInWithPassword)}
        onSignUp={wrapAuthForCheckout(signUpWithPassword)}
        onGoogleSignIn={googleSignInForCheckout}
      />
    </StripeCheckoutContext.Provider>
  );
}

export function useStripeCheckout() {
  const ctx = useContext(StripeCheckoutContext);
  if (!ctx) {
    throw new Error("useStripeCheckout must be used within StripeCheckoutProvider");
  }
  return ctx.startVipCheckout;
}
