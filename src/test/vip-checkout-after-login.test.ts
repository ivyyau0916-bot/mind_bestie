import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeVipCheckoutResumeAfterLogin,
  hasVipCheckoutResumeAfterLogin,
  markVipCheckoutResumeAfterLogin,
} from "@/lib/vip-checkout-after-login";

describe("VIP checkout resume after login", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("persists intent across reload and consumes once", () => {
    expect(hasVipCheckoutResumeAfterLogin()).toBe(false);
    markVipCheckoutResumeAfterLogin();
    expect(hasVipCheckoutResumeAfterLogin()).toBe(true);
    expect(consumeVipCheckoutResumeAfterLogin()).toBe(true);
    expect(hasVipCheckoutResumeAfterLogin()).toBe(false);
  });
});
