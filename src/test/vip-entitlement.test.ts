import { describe, expect, it, vi } from "vitest";
import { fetchVipEntitlementByEmail, normalizeEntitlementEmail } from "@/lib/vip-entitlement";
import * as supabaseModule from "@/lib/supabase";

describe("VIP entitlement", () => {
  it("normalizes email for lookup", () => {
    expect(normalizeEntitlementEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("returns false when Supabase is not configured", async () => {
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(false);
    expect(await fetchVipEntitlementByEmail("test@example.com")).toBe(false);
    vi.restoreAllMocks();
  });
});
