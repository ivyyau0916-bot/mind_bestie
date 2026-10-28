import { describe, expect, it } from "vitest";
import { isVipMemberRowActive } from "@/lib/vip-entitlement";

describe("isVipMemberRowActive", () => {
  it("prefers is_active when present", () => {
    expect(isVipMemberRowActive({ is_active: true, active: false })).toBe(true);
    expect(isVipMemberRowActive({ is_active: false, active: true })).toBe(false);
  });

  it("falls back to active column", () => {
    expect(isVipMemberRowActive({ active: true })).toBe(true);
  });
});
