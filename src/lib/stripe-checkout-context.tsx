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
  /** Block Stripe until Bestie Email session exists; opens login dialog if needed. */
  startVipCheckout: () => void;
};

const StripeCheckoutContext = createContext<StripeCheckoutContextValue | null>(null);

export function StripeCheckoutProvider({ children }: { children: ReactNode }) {
  const { user, loading, signInWithMagicLink } = useBestieAuth();
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
      // User has not left for Stripe yet — drop stale pending so login return cannot grant VIP.
      clearStripeCheckoutPending();
      pendingAfterLoginRef.current = true;
      markVipCheckoutResumeAfterLogin();
      setLoginPromptOpen(true);
    })();
  }, [closePreferences, loading]);

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
        onMagicLink={async (email) => {
          pendingAfterLoginRef.current = true;
          markVipCheckoutResumeAfterLogin();
          const result = await signInWithMagicLink(email);
          if (!result.ok) {
            pendingAfterLoginRef.current = false;
            consumeVipCheckoutResumeAfterLogin();
          }
          return result;
        }}
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
