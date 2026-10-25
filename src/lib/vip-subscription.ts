import { todayDateKey } from "@/lib/freemium";

export const VIP_STORAGE_KEY = "isVIP";
export const VIP_START_DATE_KEY = "vipStartDate";

export const VIP_ACTIVE_STATUS_LABEL = "👑 VIP 尊尚會員生效中";

export function readStoredIsVip(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(VIP_STORAGE_KEY) === "true";
}

export function readVipStartDate(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(VIP_START_DATE_KEY);
}

/** Persist VIP flags and return the active start date (YYYY-MM-DD). */
export function activateVipMembership(now = new Date()): string {
  const start = readVipStartDate() ?? todayDateKey(now);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(VIP_STORAGE_KEY, "true");
    localStorage.setItem(VIP_START_DATE_KEY, start);
  }
  return start;
}

export function clearVipMembership(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(VIP_STORAGE_KEY);
  localStorage.removeItem(VIP_START_DATE_KEY);
}

/** Set when checkout return URL was handled (celebration dialog after URL strip). */
export const VIP_CHECKOUT_CELEBRATION_PENDING_KEY = "bestie_vip_checkout_celebrate";

const CHECKOUT_SUCCESS_QUERY_KEYS = [
  "vip",
  "pay_status",
  "success",
  "session_id",
  "redirect_status",
  "payment_intent",
] as const;

export function readCheckoutReturnSearchParams(location: Pick<Location, "search" | "hash">): URLSearchParams {
  const params = new URLSearchParams(location.search);
  const hash = location.hash;
  const hashQueryStart = hash.indexOf("?");
  if (hashQueryStart >= 0) {
    const fromHash = new URLSearchParams(hash.slice(hashQueryStart + 1));
    fromHash.forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }
  return params;
}

export function isStripeCheckoutSuccessParams(params: URLSearchParams): boolean {
  if (params.get("vip") === "success" || params.get("pay_status") === "success") return true;
  const success = params.get("success");
  if (success === "true" || success === "1") return true;
  if (params.get("redirect_status") === "succeeded") return true;
  if (params.get("checkout") === "success") return true;
  const sessionId = params.get("session_id")?.trim();
  if (sessionId && sessionId.startsWith("cs_")) return true;
  return false;
}

export function stripCheckoutSuccessFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const key of CHECKOUT_SUCCESS_QUERY_KEYS) {
    url.searchParams.delete(key);
  }
  url.searchParams.delete("checkout");
  if (url.hash.includes("?")) {
    const [hashPath, hashQuery] = url.hash.split("?");
    const hashParams = new URLSearchParams(hashQuery ?? "");
    for (const key of CHECKOUT_SUCCESS_QUERY_KEYS) {
      hashParams.delete(key);
    }
    hashParams.delete("checkout");
    const remaining = hashParams.toString();
    url.hash = remaining ? `${hashPath}?${remaining}` : hashPath;
  }
  const search = url.searchParams.toString();
  const next = url.pathname + (search ? `?${search}` : "") + url.hash;
  window.history.replaceState({}, document.title, next);
}

/**
 * Stripe 成功回跳：立即寫入本機 VIP（在 auth 同步之前），避免被「未入 vip_members」覆寫。
 * @returns 是否剛處理成功回跳（需顯示慶祝 UI）
 */
/** Set when user leaves the app for Stripe (Payment Link often returns with no query params). */
export const STRIPE_CHECKOUT_PENDING_KEY = "bestie_stripe_checkout_pending_at";

const STRIPE_CHECKOUT_PENDING_MAX_MS = 2 * 60 * 60 * 1000;
/** Typical Payment Link success paths (e.g. mind-bestie → /chat). */
const STRIPE_RETURN_PATH = /^\/(?:chat|profile|daily-card)\/?$/;

export function markStripeCheckoutPending(now = Date.now()): void {
  const at = String(now);
  try {
    localStorage.setItem(STRIPE_CHECKOUT_PENDING_KEY, at);
    sessionStorage.setItem(STRIPE_CHECKOUT_PENDING_KEY, at);
  } catch {
    /* ignore */
  }
}

export function clearStripeCheckoutPending(): void {
  try {
    localStorage.removeItem(STRIPE_CHECKOUT_PENDING_KEY);
    sessionStorage.removeItem(STRIPE_CHECKOUT_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

function readStripeCheckoutPendingStartedAt(): number | null {
  try {
    const raw =
      localStorage.getItem(STRIPE_CHECKOUT_PENDING_KEY) ??
      sessionStorage.getItem(STRIPE_CHECKOUT_PENDING_KEY);
    if (!raw) return null;
    const started = Number.parseInt(raw, 10);
    return Number.isFinite(started) ? started : null;
  } catch {
    return null;
  }
}

export function isRecentStripeCheckoutPending(now = Date.now()): boolean {
  const started = readStripeCheckoutPendingStartedAt();
  if (started == null) return false;
  if (now - started > STRIPE_CHECKOUT_PENDING_MAX_MS) {
    clearStripeCheckoutPending();
    return false;
  }
  return true;
}

export function isLikelyStripeCheckoutReferrer(): boolean {
  if (typeof document === "undefined") return false;
  return /stripe\.com|stripe\.network/i.test(document.referrer);
}

function markVipCelebrationPending(): void {
  try {
    sessionStorage.setItem(VIP_CHECKOUT_CELEBRATION_PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

function completeCheckoutVipActivation(): void {
  activateVipMembership();
  clearStripeCheckoutPending();
  markVipCelebrationPending();
}

export type StripeCheckoutReturnResult = {
  activated: boolean;
  showCelebration: boolean;
  promptPaymentConfirm: boolean;
};

/**
 * Handle Stripe return: URL params, referrer, or Payment Link bare success URL (e.g. /chat).
 */
export function processStripeCheckoutReturn(now = Date.now()): StripeCheckoutReturnResult {
  if (typeof window === "undefined") {
    return { activated: false, showCelebration: false, promptPaymentConfirm: false };
  }

  const params = readCheckoutReturnSearchParams(window.location);
  if (isStripeCheckoutSuccessParams(params)) {
    completeCheckoutVipActivation();
    stripCheckoutSuccessFromUrl();
    return { activated: true, showCelebration: true, promptPaymentConfirm: false };
  }

  const celebrateOnly = consumeVipCheckoutCelebrationPending();

  if (!isRecentStripeCheckoutPending(now)) {
    return { activated: false, showCelebration: celebrateOnly, promptPaymentConfirm: false };
  }

  const onReturnPath = STRIPE_RETURN_PATH.test(window.location.pathname);
  if (onReturnPath) {
    return { activated: false, showCelebration: false, promptPaymentConfirm: true };
  }

  return { activated: false, showCelebration: celebrateOnly, promptPaymentConfirm: false };
}

/** @deprecated Prefer processStripeCheckoutReturn */
export function grantVipMembershipFromCheckoutReturn(): boolean {
  return processStripeCheckoutReturn().activated;
}

export function confirmStripeCheckoutPaymentCompleted(): void {
  completeCheckoutVipActivation();
}

export function consumeVipCheckoutCelebrationPending(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  const pending = sessionStorage.getItem(VIP_CHECKOUT_CELEBRATION_PENDING_KEY) === "1";
  if (pending) sessionStorage.removeItem(VIP_CHECKOUT_CELEBRATION_PENDING_KEY);
  return pending;
}

/** VIP for UI after login: trust Supabase entitlement only (not stale localStorage). */
export function resolveVipActive(entitledFromServer: boolean): boolean {
  return entitledFromServer;
}
