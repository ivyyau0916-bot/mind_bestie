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

export function isStripeCheckoutSuccessParams(params: URLSearchParams): boolean {
  if (params.get("vip") === "success" || params.get("pay_status") === "success") return true;
  const success = params.get("success");
  return success === "true" || success === "1";
}

export function stripCheckoutSuccessFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("vip");
  url.searchParams.delete("pay_status");
  url.searchParams.delete("success");
  const search = url.searchParams.toString();
  const next = url.pathname + (search ? `?${search}` : "") + url.hash;
  window.history.replaceState({}, document.title, next);
}
