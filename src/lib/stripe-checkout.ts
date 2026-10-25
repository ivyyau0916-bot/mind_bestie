import { markStripeCheckoutPending } from "@/lib/vip-subscription";

export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/7sY4gy1AH48q21X2hQ2Ji01";

export function getStripePaymentLink(): string {
  const fromEnv = import.meta.env.VITE_STRIPE_PAYMENT_LINK?.trim();
  return fromEnv || STRIPE_PAYMENT_LINK;
}

export function buildStripeCheckoutUrl(email?: string | null): string {
  const base = getStripePaymentLink();
  const trimmed = email?.trim();
  try {
    const url = new URL(base);
    if (trimmed?.includes("@")) {
      url.searchParams.set("prefilled_email", trimmed);
    }
    return url.toString();
  } catch {
    const parts = [base];
    if (trimmed?.includes("@")) {
      parts.push(`${base.includes("?") ? "&" : "?"}prefilled_email=${encodeURIComponent(trimmed)}`);
    }
    return parts.join("");
  }
}

export const STRIPE_CHECKOUT_EMAIL_KEY = "bestie_stripe_checkout_email";

/**
 * Redirect to Stripe Payment Link. Call only after `evaluateVipCheckoutGate` allows.
 */
export function redirectToStripeCheckout(email: string): void {
  const trimmed = email.trim();
  if (!trimmed.includes("@")) {
    console.error("[stripe] blocked checkout: missing valid session email");
    throw new Error("Stripe checkout requires a signed-in Bestie email");
  }
  markStripeCheckoutPending();
  try {
    localStorage.setItem(STRIPE_CHECKOUT_EMAIL_KEY, trimmed.toLowerCase());
  } catch {
    /* ignore */
  }
  window.location.href = buildStripeCheckoutUrl(trimmed);
}

/** @deprecated Use redirectToStripeCheckout */
export function openStripeCheckout(email: string): boolean {
  redirectToStripeCheckout(email);
  return true;
}

/** Configure this as the Payment Link success URL in Stripe Dashboard. */
export function buildStripeSuccessReturnUrl(origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  return `${origin}/chat?success=true`;
}
