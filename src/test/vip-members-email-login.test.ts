import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyVipEntitlementForSession, lookupVipMemberActiveByEmail } from "@/lib/vip-entitlement";
import * as supabaseModule from "@/lib/supabase";

describe("vip_members follows email across login methods", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("grants VIP when vip_members.active is true for session email", async () => {
    const ilike = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { active: true, email: "ivy@example.com" }, error: null }),
    });
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);
    vi.spyOn(supabaseModule, "getSupabaseClient").mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ ilike }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as never);

    expect(await lookupVipMemberActiveByEmail("Ivy@Example.COM")).toBe("active");
    expect(await applyVipEntitlementForSession("ivy@example.com")).toBe(true);
    expect(localStorage.getItem("isVIP")).toBe("true");
    expect(localStorage.getItem("bestie_vip_paid_for_email")).toBe("ivy@example.com");
  });

  it("denies VIP for signed-in email without a row (inactive)", async () => {
    const ilike = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);
    vi.spyOn(supabaseModule, "getSupabaseClient").mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ ilike }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as never);

    expect(await lookupVipMemberActiveByEmail("free@example.com")).toBe("inactive");
    expect(await applyVipEntitlementForSession("free@example.com")).toBe(false);
  });
});
