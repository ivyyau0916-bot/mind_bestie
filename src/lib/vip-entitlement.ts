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
