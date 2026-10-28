import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bindVipPaidToEmail,
  clearVipMembership,
  hasVipPaidProofForEmail,
  VIP_PAID_EMAIL_KEY,
  VIP_PAID_LOCALLY_KEY,
  VIP_STORAGE_KEY,
} from "@/lib/vip-subscription";
import { applyVipEntitlementForSession } from "@/lib/vip-entitlement";
import * as supabaseModule from "@/lib/supabase";

describe("VIP email-bound proof (no user.id)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("restores VIP when Google session email matches paid email", async () => {
    bindVipPaidToEmail("ivy@example.com");
    localStorage.setItem(VIP_PAID_LOCALLY_KEY, "1");

    const entitled = await applyVipEntitlementForSession("Ivy@Example.COM");
    expect(entitled).toBe(true);
    expect(localStorage.getItem(VIP_STORAGE_KEY)).toBe("true");
    expect(hasVipPaidProofForEmail("ivy@example.com")).toBe(true);
  });

  it("does not grant VIP to a different signed-in email", async () => {
    bindVipPaidToEmail("paid@example.com");
    localStorage.setItem(VIP_PAID_LOCALLY_KEY, "1");

    const entitled = await applyVipEntitlementForSession("other@example.com");
    expect(entitled).toBe(false);
    expect(localStorage.getItem(VIP_PAID_EMAIL_KEY)).toBeNull();
  });

  it("clearVipMembership removes email-bound proof", () => {
    bindVipPaidToEmail("a@b.com");
    clearVipMembership();
    expect(localStorage.getItem(VIP_PAID_EMAIL_KEY)).toBeNull();
  });
});
