export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_3cI4gydftcOkghl8xB1ck00";

export function getStripePaymentLink(): string {
  const fromEnv = import.meta.env.VITE_STRIPE_PAYMENT_LINK?.trim();
  return fromEnv || STRIPE_PAYMENT_LINK;
}

export function buildStripeCheckoutUrl(email?: string | null): string {
  const base = getStripePaymentLink();
  const trimmed = email?.trim();
  if (!trimmed || !trimmed.includes("@")) return base;
  try {
    const url = new URL(base);
    url.searchParams.set("prefilled_email", trimmed);
    return url.toString();
  } catch {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}prefilled_email=${encodeURIComponent(trimmed)}`;
  }
}

export function redirectToStripeCheckout(email?: string | null): void {
  window.location.href = buildStripeCheckoutUrl(email);
}

/** @deprecated Use redirectToStripeCheckout */
export function openStripeCheckout(email?: string | null): boolean {
  redirectToStripeCheckout(email);
  return true;
}

/** Configure this as the Payment Link success URL in Stripe Dashboard. */
export function buildStripeSuccessReturnUrl(origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  return `${origin}/?success=true`;
}
