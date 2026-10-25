/** Survives magic-link full page reload so VIP checkout can resume after sign-in. */
export const VIP_CHECKOUT_AFTER_LOGIN_KEY = "bestie_vip_checkout_after_login";

export function markVipCheckoutResumeAfterLogin(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(VIP_CHECKOUT_AFTER_LOGIN_KEY, "1");
    localStorage.setItem(VIP_CHECKOUT_AFTER_LOGIN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasVipCheckoutResumeAfterLogin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      sessionStorage.getItem(VIP_CHECKOUT_AFTER_LOGIN_KEY) === "1" ||
      localStorage.getItem(VIP_CHECKOUT_AFTER_LOGIN_KEY) === "1"
    );
  } catch {
    return false;
  }
}

export function consumeVipCheckoutResumeAfterLogin(): boolean {
  const pending = hasVipCheckoutResumeAfterLogin();
  if (!pending || typeof window === "undefined") return false;
  try {
    sessionStorage.removeItem(VIP_CHECKOUT_AFTER_LOGIN_KEY);
    localStorage.removeItem(VIP_CHECKOUT_AFTER_LOGIN_KEY);
  } catch {
    /* ignore */
  }
  return true;
}
