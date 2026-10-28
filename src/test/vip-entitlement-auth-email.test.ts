import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyVipEntitlementForSession, fetchVipEntitlementByEmail } from "@/lib/vip-entitlement";
import * as supabaseModule from "@/lib/supabase";

describe("VIP entitlement by auth email (not user id)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("grants VIP from vip_members via case-insensitive email lookup", async () => {
    const ilike = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { active: true, email: "ivy@example.com" }, error: null }),
    });
    const from = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ ilike }) });
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);
    vi.spyOn(supabaseModule, "getSupabaseClient").mockReturnValue({ from } as never);

    expect(await fetchVipEntitlementByEmail("Ivy@Example.COM")).toBe(true);
    expect(ilike).toHaveBeenCalledWith("email", "ivy@example.com");
  });

  it("applyVipEntitlementForSession merges row when server says active", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const ilike = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { active: true, email: "pay@example.com" }, error: null }),
    });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ ilike }),
      upsert,
    });
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);
    vi.spyOn(supabaseModule, "getSupabaseClient").mockReturnValue({ from } as never);

    const entitled = await applyVipEntitlementForSession("pay@example.com");
    expect(entitled).toBe(true);
    expect(upsert).toHaveBeenCalled();
    expect(localStorage.getItem("isVIP")).toBe("true");
  });
});
