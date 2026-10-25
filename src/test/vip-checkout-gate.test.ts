import { describe, expect, it } from "vitest";
import { VIP_CHECKOUT_LOGIN_REQUIRED_MESSAGE } from "@/lib/vip-checkout-gate";

describe("VIP checkout gate copy", () => {
  it("uses the required login hint for blocked checkout", () => {
    expect(VIP_CHECKOUT_LOGIN_REQUIRED_MESSAGE).toContain("請先登入 Email 帳號再進行升級");
  });
});
