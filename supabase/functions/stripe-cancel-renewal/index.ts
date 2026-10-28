/**
 * Deploy: supabase functions deploy stripe-cancel-renewal
 * Secrets: supabase secrets set STRIPE_SECRET_KEY=sk_live_...
 *
 * Cancels auto-renewal (cancel_at_period_end) for the authenticated user's Stripe subscription.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return json({ ok: false, message: "STRIPE_SECRET_KEY not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ ok: false, message: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user?.email) {
      return json({ ok: false, message: "請先登入 Bestie 帳號。" }, 401);
    }

    const email = user.email.trim().toLowerCase();
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    let customerId: string | undefined;
    const { data: vipRow } = await supabase
      .from("vip_members")
      .select("stripe_customer_id")
      .ilike("email", email)
      .maybeSingle();
    if (vipRow?.stripe_customer_id?.startsWith("cus_")) {
      customerId = vipRow.stripe_customer_id;
    }

    const customer = customerId
      ? await stripe.customers.retrieve(customerId).catch(() => null)
      : null;
    const resolvedCustomer =
      customer && !("deleted" in customer && customer.deleted)
        ? customer
        : (await stripe.customers.list({ email, limit: 3 })).data[0];

    if (!resolvedCustomer) {
      return json({ ok: false, message: "Stripe 找不到此 Email 的客戶紀錄。" }, 404);
    }

    const subs = await stripe.subscriptions.list({
      customer: resolvedCustomer.id,
      status: "active",
      limit: 1,
    });
    const subscription = subs.data[0];
    if (!subscription) {
      return json({ ok: false, message: "找不到進行中的訂閱。" }, 404);
    }

    if (subscription.cancel_at_period_end) {
      return json({
        ok: true,
        message: "你已設定於本期結束後停止續訂。",
        cancel_at: subscription.current_period_end,
      });
    }

    const updated = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    return json({
      ok: true,
      message: "已取消自動續訂，本期結束前仍可使用 VIP。",
      cancel_at: updated.current_period_end,
    });
  } catch (err) {
    console.error("[stripe-cancel-renewal]", err);
    return json({ ok: false, message: "伺服器處理失敗，請稍後再試。" }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
