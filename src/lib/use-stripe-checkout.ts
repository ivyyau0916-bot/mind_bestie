import { useCallback } from "react";
import { useBestieAuth } from "@/lib/bestie-auth-context";
import { redirectToStripeCheckout } from "@/lib/stripe-checkout";

/** Stripe checkout with logged-in user's email prefilled when available. */
export function useStripeCheckout() {
  const { user } = useBestieAuth();
  return useCallback(() => {
    redirectToStripeCheckout(user?.email ?? null);
  }, [user?.email]);
}
