import { fetchActiveAuthEmail } from "@/lib/bestie-auth-session";

/** Shown when VIP checkout is blocked until Bestie Email login. */
export const VIP_CHECKOUT_LOGIN_REQUIRED_MESSAGE =
  "為了妥善保存您的 VIP 資格與權益，請先登入 Email 帳號再進行升級！";

export type VipCheckoutGateResult =
  | { allowed: true; email: string }
  | { allowed: false; reason: "not_signed_in" };

/** Strict gate: only a live Supabase session email may proceed to Stripe. */
export async function evaluateVipCheckoutGate(authLoading: boolean): Promise<VipCheckoutGateResult> {
  const email = authLoading ? await waitForActiveAuthEmail(4000) : await fetchActiveAuthEmail();
  if (email) return { allowed: true, email };
  return { allowed: false, reason: "not_signed_in" };
}

async function waitForActiveAuthEmail(maxWaitMs: number): Promise<string | null> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const email = await fetchActiveAuthEmail();
    if (email) return email;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return fetchActiveAuthEmail();
}
