import { clearBestieAccountData } from "@/lib/bestie-account";
import {
  LAST_EVENING_NOTIF_DATE_KEY,
  LAST_MORNING_NOTIF_DATE_KEY,
} from "@/lib/care-notifications";
import { clearSoulCardLocalState } from "@/lib/daily-card-draw";
import { clearDailyCardDrawHistory, USAGE_QUOTA_PRESERVE_KEYS } from "@/lib/freemium";
import { clearSelfCareLocalData } from "@/lib/self-care-checkin";
import {
  AUTH_USER_EMAIL_KEY,
  AUTH_USER_ID_KEY,
} from "@/lib/supabase-auth-callback";
import { STRIPE_CHECKOUT_EMAIL_KEY } from "@/lib/stripe-checkout";
import { consumeVipCheckoutResumeAfterLogin } from "@/lib/vip-checkout-after-login";
import {
  clearStripeCheckoutPending,
  VIP_CHECKOUT_CELEBRATION_PENDING_KEY,
  VIP_PAID_LOCALLY_KEY,
  VIP_START_DATE_KEY,
  VIP_STORAGE_KEY,
} from "@/lib/vip-subscription";

export const MOOD_APP_STORAGE_KEY = "mood-weather-v1";

const VIP_PRESERVE_KEYS = [VIP_STORAGE_KEY, VIP_START_DATE_KEY, VIP_PAID_LOCALLY_KEY] as const;

const SESSION_CLEAR_KEYS = [
  VIP_CHECKOUT_CELEBRATION_PENDING_KEY,
  "bestie_vip_checkout_after_login",
] as const;

const LOCAL_CLEAR_KEYS = [
  MOOD_APP_STORAGE_KEY,
  STRIPE_CHECKOUT_EMAIL_KEY,
  "bestie_vip_checkout_after_login",
  LAST_MORNING_NOTIF_DATE_KEY,
  LAST_EVENING_NOTIF_DATE_KEY,
] as const;

function snapshotKeys(keys: readonly string[]): Record<string, string | null> {
  if (typeof localStorage === "undefined") return {};
  return Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)]));
}

function restoreSnapshot(snapshot: Record<string, string | null>): void {
  if (typeof localStorage === "undefined") return;
  for (const [key, value] of Object.entries(snapshot)) {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }
}

/**
 * Full privacy reset: chat, mood journal, soul cards, daily glimmer, account prefs.
 * Preserves login snapshot, VIP (if any), and daily chat quota counters.
 */
export function resetAllUserAppData(): void {
  if (typeof localStorage === "undefined") return;

  const preserve = {
    ...snapshotKeys(USAGE_QUOTA_PRESERVE_KEYS),
    ...snapshotKeys([AUTH_USER_ID_KEY, AUTH_USER_EMAIL_KEY]),
    ...snapshotKeys(VIP_PRESERVE_KEYS),
  };

  for (const key of LOCAL_CLEAR_KEYS) {
    localStorage.removeItem(key);
  }

  clearBestieAccountData();
  clearDailyCardDrawHistory();
  clearSoulCardLocalState();
  clearSelfCareLocalData();
  clearStripeCheckoutPending();
  consumeVipCheckoutResumeAfterLogin();

  if (typeof sessionStorage !== "undefined") {
    for (const key of SESSION_CLEAR_KEYS) {
      sessionStorage.removeItem(key);
    }
  }

  restoreSnapshot(preserve);
}
