import { beforeEach, describe, expect, it } from "vitest";
import {
  VIP_START_DATE_KEY,
  VIP_STORAGE_KEY,
  activateVipMembership,
  clearVipMembership,
  isStripeCheckoutSuccessParams,
  readStoredIsVip,
  readVipStartDate,
} from "@/lib/vip-subscription";
import { STRIPE_PAYMENT_LINK, buildStripeCheckoutUrl, getStripePaymentLink } from "@/lib/stripe-checkout";

describe("VIP subscription storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("activates VIP with start date", () => {
    const start = activateVipMembership(new Date("2026-10-23T12:00:00"));
    expect(start).toBe("2026-10-23");
    expect(readStoredIsVip()).toBe(true);
    expect(readVipStartDate()).toBe("2026-10-23");
    expect(localStorage.getItem(VIP_STORAGE_KEY)).toBe("true");
    expect(localStorage.getItem(VIP_START_DATE_KEY)).toBe("2026-10-23");
  });

  it("detects Stripe success query params", () => {
    expect(isStripeCheckoutSuccessParams(new URLSearchParams("vip=success"))).toBe(true);
    expect(isStripeCheckoutSuccessParams(new URLSearchParams("pay_status=success"))).toBe(true);
    expect(isStripeCheckoutSuccessParams(new URLSearchParams("vip=pending"))).toBe(false);
  });

  it("clears VIP membership", () => {
    activateVipMembership();
    clearVipMembership();
    expect(readStoredIsVip()).toBe(false);
    expect(readVipStartDate()).toBeNull();
  });

  it("exposes the configured Stripe payment link", () => {
    expect(getStripePaymentLink()).toBe(STRIPE_PAYMENT_LINK);
  });

  it("appends prefilled_email for Stripe checkout when user is logged in", () => {
    const url = buildStripeCheckoutUrl("ivy@example.com");
    expect(url).toContain("prefilled_email=ivy%40example.com");
  });
});
