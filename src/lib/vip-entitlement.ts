import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  activateVipFromStripeSuccessUrl,
  activateVipMembership,
  bindVipPaidToEmail,
  clearStripeCheckoutPending,
  clearVipMembership,
  hasLocalPaidVipProof,
  hasStripeSuccessInUrl,
  hasVipPaidProofForEmail,
  readStoredIsVip,
  readVipPaidForEmail,
  VIP_PAID_LOCALLY_KEY,
} from "@/lib/vip-subscription";

export function normalizeEntitlementEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isMissingVipMembersTableError(error: { message?: string; code?: string }): boolean {
  const message = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    (message.includes("vip_members") && message.includes("does not exist")) ||
    message.includes("could not find the table")
  );
}

export type VipMemberLookupStatus = "active" | "inactive" | "unknown";

/**
 * Authoritative VIP check: Supabase `vip_members` by normalized session email (never user.id).
 */
export async function lookupVipMemberActiveByEmail(
  email: string | null | undefined,
): Promise<VipMemberLookupStatus> {
  if (!email?.trim() || !isSupabaseConfigured()) return "inactive";
  const supabase = getSupabaseClient();
  if (!supabase) return "unknown";

  const normalized = normalizeEntitlementEmail(email);
  const { data, error } = await supabase
    .from("vip_members")
    .select("active, email")
    .ilike("email", normalized)
    .maybeSingle();

  if (error) {
    if (isMissingVipMembersTableError(error)) return "inactive";
    console.warn("[vip-entitlement]", error.message);
    return "unknown";
  }
  if (!data) return "inactive";
  return data.active ? "active" : "inactive";
}

/** @deprecated Prefer lookupVipMemberActiveByEmail for explicit inactive vs network-unknown. */
export async function fetchVipEntitlementByEmail(email: string | null | undefined): Promise<boolean> {
  const status = await lookupVipMemberActiveByEmail(email);
  return status === "active";
}

/**
 * Bind VIP row to the signed-in email (PK = email). Safe when Google and Email+Password
 * auth produce different `user.id` values for the same mailbox.
 */
export async function mergeVipMemberRecordForAuthEmail(email: string | null | undefined): Promise<boolean> {
  if (!hasCheckoutEmailForEntitlement(email) || !isSupabaseConfigured()) return false;
  return upsertVipMemberForEmail(normalizeEntitlementEmail(email));
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
    if (!isMissingVipMembersTableError(error)) {
      console.warn("[vip-entitlement] upsert failed", error.message);
    }
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

/**
 * Session VIP sync: Supabase entitlement, Stripe ?success=true return, or verified local paid flag.
 * Magic Link alone never sets VIP (no paid proof).
 */
function persistLocalPaidVipProof(): void {
  try {
    localStorage.setItem(VIP_PAID_LOCALLY_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Activate local VIP flags after email-scoped entitlement is confirmed or merged. */
async function grantVipForEntitledEmail(normalizedEmail: string): Promise<boolean> {
  activateVipMembership();
  persistLocalPaidVipProof();
  bindVipPaidToEmail(normalizedEmail);
  await mergeVipMemberRecordForAuthEmail(normalizedEmail);
  return true;
}

export async function applyVipEntitlementForSession(
  email: string | null | undefined,
): Promise<boolean> {
  const normalizedEmail = email?.trim().includes("@") ? normalizeEntitlementEmail(email) : null;

  if (typeof window !== "undefined" && hasStripeSuccessInUrl()) {
    activateVipFromStripeSuccessUrl();
    if (normalizedEmail) {
      await mergeVipMemberRecordForAuthEmail(normalizedEmail);
    }
    return true;
  }

  if (!normalizedEmail) {
    if (hasLocalPaidVipProof()) return true;
    clearVipMembership();
    clearStripeCheckoutPending();
    return false;
  }

  const serverStatus = await lookupVipMemberActiveByEmail(normalizedEmail);
  if (serverStatus === "active") {
    return grantVipForEntitledEmail(normalizedEmail);
  }

  if (serverStatus === "unknown") {
    if (hasVipPaidProofForEmail(normalizedEmail)) {
      activateVipMembership();
      persistLocalPaidVipProof();
      return true;
    }
    if (readVipPaidForEmail() === normalizedEmail && readStoredIsVip()) {
      activateVipMembership();
      return true;
    }
    return false;
  }

  if (hasVipPaidProofForEmail(normalizedEmail)) {
    await syncVipAfterCheckoutReturn(normalizedEmail);
    activateVipMembership();
    persistLocalPaidVipProof();
    bindVipPaidToEmail(normalizedEmail);
    return true;
  }

  if (hasLocalPaidVipProof() && !readVipPaidForEmail()) {
    bindVipPaidToEmail(normalizedEmail);
    activateVipMembership();
    persistLocalPaidVipProof();
    return true;
  }

  clearVipMembership();
  clearStripeCheckoutPending();
  return false;
}

/** Re-fetch VIP from `vip_members` for the signed-in email (Google / Email+Password agnostic). */
export async function syncVipEntitlementForAuthEmail(
  email: string | null | undefined,
): Promise<boolean> {
  return applyVipEntitlementForSession(email);
}
