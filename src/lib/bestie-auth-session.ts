import { normalizeEntitlementEmail } from "@/lib/vip-entitlement";
import { getSupabaseClient } from "@/lib/supabase";

/** Only a live Supabase session counts as signed-in (not stale localStorage). */
export async function fetchActiveAuthEmail(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn("[auth-session]", error.message);
    return null;
  }
  const email = data.session?.user?.email?.trim();
  return email?.includes("@") ? email : null;
}

/**
 * VIP / Stripe entitlement always keys off normalized session email — never `user.id`.
 * Prefer JWT email over cached localStorage (Google vs Email+Password may differ in id).
 */
export async function resolveAuthEmailForEntitlement(
  fallbackEmail?: string | null,
): Promise<string | null> {
  const fromSession = await fetchActiveAuthEmail();
  const raw = fromSession ?? fallbackEmail?.trim();
  if (!raw?.includes("@")) return null;
  return normalizeEntitlementEmail(raw);
}
