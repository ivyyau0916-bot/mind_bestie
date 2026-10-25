import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export function normalizeEntitlementEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Returns true when Supabase `vip_members` has an active row for this email.
 * Populate via Stripe webhook / admin (see supabase/vip_members.sql).
 */
export async function fetchVipEntitlementByEmail(email: string | null | undefined): Promise<boolean> {
  if (!email?.trim() || !isSupabaseConfigured()) return false;
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const normalized = normalizeEntitlementEmail(email);
  const { data, error } = await supabase
    .from("vip_members")
    .select("active")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    console.warn("[vip-entitlement]", error.message);
    return false;
  }
  return Boolean(data?.active);
}

/**
 * After client-side Stripe return, bind VIP to the logged-in email in Supabase.
 * Requires RLS policies in supabase/vip_members.sql (insert/update own row).
 */
export async function upsertVipMemberForEmail(email: string | null | undefined): Promise<boolean> {
  if (!hasCheckoutEmailForEntitlement(email) || !isSupabaseConfigured()) return false;
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const normalized = normalizeEntitlementEmail(email);
  const { error } = await supabase.from("vip_members").upsert(
    {
      email: normalized,
      active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );

  if (error) {
    console.warn("[vip-entitlement] upsert failed", error.message);
    return false;
  }
  return true;
}

function hasCheckoutEmailForEntitlement(email: string | null | undefined): email is string {
  return Boolean(email?.trim().includes("@"));
}

/** Local VIP activated + optional Supabase row for signed-in user. */
export async function syncVipAfterCheckoutReturn(email: string | null | undefined): Promise<void> {
  if (!hasCheckoutEmailForEntitlement(email)) return;
  await upsertVipMemberForEmail(email);
}
