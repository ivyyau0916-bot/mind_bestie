import { fetchActiveAuthEmail } from "@/lib/bestie-auth-session";
import { openStripeCustomerPortal } from "@/lib/stripe-checkout";

export type SubscriptionActionResult = { ok: true; message?: string } | { ok: false; message: string };

/** Opens Stripe portal with the live session email prefilled. */
export async function openManageSubscriptionPortal(): Promise<SubscriptionActionResult> {
  const email = await fetchActiveAuthEmail();
  if (!email) {
    return { ok: false, message: "請先登入 Bestie 帳號，再管理 VIP 訂閱。" };
  }
  try {
    openStripeCustomerPortal(email);
    return {
      ok: true,
      message: `已帶入 ${email}，請在 Stripe 頁面收取驗證信完成登入（無需再手打 Email）。`,
    };
  } catch {
    return { ok: false, message: "無法開啟訂閱管理頁，請稍後再試。" };
  }
}
