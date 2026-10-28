import { beforeEach, describe, expect, it } from "vitest";
import {
  VIP_CHECKOUT_CELEBRATION_PENDING_KEY,
  VIP_START_DATE_KEY,
  VIP_PAID_LOCALLY_KEY,
  VIP_STORAGE_KEY,
  activateVipMembership,
  clearVipMembership,
  grantVipMembershipFromCheckoutReturn,
  markStripeCheckoutPending,
  processStripeCheckoutReturn,
  isStripeCheckoutSuccessParams,
  readStoredIsVip,
  readVipStartDate,
  resolveVipActive,
} from "@/lib/vip-subscription";
import {
  STRIPE_PAYMENT_LINK,
  buildStripeCheckoutUrl,
  buildStripeCustomerPortalUrl,
  getStripePaymentLink,
} from "@/lib/stripe-checkout";

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
    expect(isStripeCheckoutSuccessParams(new URLSearchParams("success=true"))).toBe(true);
    expect(isStripeCheckoutSuccessParams(new URLSearchParams("session_id=cs_test_abc"))).toBe(true);
    expect(isStripeCheckoutSuccessParams(new URLSearchParams("redirect_status=succeeded"))).toBe(true);
    expect(isStripeCheckoutSuccessParams(new URLSearchParams("vip=pending"))).toBe(false);
    expect(isStripeCheckoutSuccessParams(new URLSearchParams("success=false"))).toBe(false);
  });

  it("grants local VIP from checkout return URL", () => {
    window.history.replaceState({}, "", "/chat?success=true");
    expect(grantVipMembershipFromCheckoutReturn()).toBe(true);
    expect(readStoredIsVip()).toBe(true);
    expect(localStorage.getItem(VIP_PAID_LOCALLY_KEY)).toBe("1");
    expect(sessionStorage.getItem(VIP_CHECKOUT_CELEBRATION_PENDING_KEY)).toBe("1");
    expect(window.location.search).toBe("");
  });

  it("does not grant VIP on bare /chat with pending only (e.g. Magic Link return)", () => {
    window.history.replaceState({}, "", "/chat");
    markStripeCheckoutPending();
    const result = processStripeCheckoutReturn();
    expect(result.activated).toBe(false);
    expect(result.promptPaymentConfirm).toBe(true);
    expect(readStoredIsVip()).toBe(false);
  });

  it("does not grant VIP from Stripe referrer alone (requires success URL or server entitlement)", () => {
    window.history.replaceState({}, "", "/chat");
    markStripeCheckoutPending();
    const originalDescriptor = Object.getOwnPropertyDescriptor(document, "referrer");
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://checkout.stripe.com/c/pay/cs_test_abc",
    });
    try {
      const result = processStripeCheckoutReturn();
      expect(result.activated).toBe(false);
      expect(result.promptPaymentConfirm).toBe(true);
      expect(readStoredIsVip()).toBe(false);
    } finally {
      if (originalDescriptor) Object.defineProperty(document, "referrer", originalDescriptor);
      else Object.defineProperty(document, "referrer", { configurable: true, value: "" });
    }
  });

  it("does not treat stale local VIP as checkout activation on reload", () => {
    activateVipMembership();
    window.history.replaceState({}, "", "/auth/callback?code=test");
    const result = processStripeCheckoutReturn();
    expect(result.activated).toBe(false);
  });

  it("resolveVipActive trusts server entitlement only after login sync", () => {
    activateVipMembership();
    expect(resolveVipActive(false)).toBe(false);
    expect(resolveVipActive(true)).toBe(true);
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

  it("appends prefilled_email for Stripe customer portal login", () => {
    const url = buildStripeCustomerPortalUrl("ivy@example.com");
    expect(url).toContain("prefilled_email=ivy%40example.com");
  });
});
