import { fetchActiveAuthEmail } from "@/lib/bestie-auth-session";
import { openStripeCustomerPortal } from "@/lib/stripe-checkout";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export type SubscriptionActionResult = { ok: true; message?: string } | { ok: false; message: string };

const CANCEL_RENEWAL_FUNCTION = "stripe-cancel-renewal";

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

/**
 * Calls Supabase Edge Function `stripe-cancel-renewal` (requires STRIPE_SECRET_KEY secret).
 * Sets cancel_at_period_end on the user's active Stripe subscription.
 */
export async function cancelSubscriptionAtPeriodEnd(): Promise<SubscriptionActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase 尚未設定，無法取消訂閱。" };
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, message: "無法連線 Supabase，請稍後再試。" };
  }

  const email = await fetchActiveAuthEmail();
  if (!email) {
    return { ok: false, message: "請先登入 Bestie 帳號，再取消自動續訂。" };
  }

  const { data, error } = await supabase.functions.invoke(CANCEL_RENEWAL_FUNCTION, {
    method: "POST",
    body: { email },
  });

  if (error) {
    const hint =
      error.message?.includes("404") || error.message?.includes("not found")
        ? "後端尚未部署 stripe-cancel-renewal，請改用「管理 VIP 訂閱」或聯絡支援。"
        : error.message;
    return { ok: false, message: hint || "取消自動續訂失敗，請稍後再試。" };
  }

  const payload = data as { ok?: boolean; message?: string; cancel_at?: number } | null;
  if (payload?.ok) {
    const when =
      typeof payload.cancel_at === "number"
        ? new Date(payload.cancel_at * 1000).toLocaleDateString("zh-Hant")
        : null;
    return {
      ok: true,
      message:
        payload.message ??
        (when
          ? `已設定於 ${when} 結束後不再自動續訂，到期前仍可使用 VIP。`
          : "已取消自動續訂，本期結束前仍可使用 VIP。"),
    };
  }

  return {
    ok: false,
    message: payload?.message ?? "找不到有效的 Stripe 訂閱，請改用管理頁面確認。",
  };
}
