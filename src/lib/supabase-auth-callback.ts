import type { SupabaseClient } from "@supabase/supabase-js";
import type { BestieAuthUser } from "@/lib/supabase";
import { mapSupabaseUser } from "@/lib/supabase";

export const AUTH_USER_ID_KEY = "bestie_auth_user_id";
export const AUTH_USER_EMAIL_KEY = "bestie_auth_email";
export const AUTH_USER_CREATED_AT_KEY = "bestie_auth_user_created_at";

const AUTH_QUERY_KEYS = ["code", "state", "error", "error_description", "access_token", "refresh_token", "type"] as const;

export function readPersistedAuthUser(): BestieAuthUser | null {
  if (typeof localStorage === "undefined") return null;
  const id = localStorage.getItem(AUTH_USER_ID_KEY);
  if (!id) return null;
  const email = localStorage.getItem(AUTH_USER_EMAIL_KEY);
  const created_at = localStorage.getItem(AUTH_USER_CREATED_AT_KEY);
  return created_at
    ? { id, email: email || null, created_at }
    : { id, email: email || null };
}

export function writePersistedAuthUser(user: BestieAuthUser | null): void {
  if (typeof localStorage === "undefined") return;
  if (!user) {
    localStorage.removeItem(AUTH_USER_ID_KEY);
    localStorage.removeItem(AUTH_USER_EMAIL_KEY);
    localStorage.removeItem(AUTH_USER_CREATED_AT_KEY);
    return;
  }
  localStorage.setItem(AUTH_USER_ID_KEY, user.id);
  if (user.email) localStorage.setItem(AUTH_USER_EMAIL_KEY, user.email);
  else localStorage.removeItem(AUTH_USER_EMAIL_KEY);
  if (user.created_at) localStorage.setItem(AUTH_USER_CREATED_AT_KEY, user.created_at);
  else localStorage.removeItem(AUTH_USER_CREATED_AT_KEY);
}

export function hasAuthCallbackInUrl(href = typeof window !== "undefined" ? window.location.href : ""): boolean {
  if (!href) return false;
  try {
    const url = new URL(href);
    if (url.searchParams.get("code")) return true;
    if (url.searchParams.get("error")) return true;
    const hash = url.hash.replace(/^#/, "");
    if (!hash) return false;
    const params = new URLSearchParams(hash);
    return (
      params.has("access_token") ||
      params.has("refresh_token") ||
      params.get("type") === "recovery" ||
      params.get("type") === "magiclink" ||
      params.get("type") === "signup"
    );
  } catch {
    return false;
  }
}

export function stripAuthCallbackFromUrl(href = window.location.href): void {
  const url = new URL(href);
  for (const key of AUTH_QUERY_KEYS) url.searchParams.delete(key);
  url.hash = "";
  const search = url.searchParams.toString();
  const path = url.pathname + (search ? `?${search}` : "");
  window.history.replaceState({}, document.title, path);
}

export function stripAuthHashFromUrl(): void {
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
}

function parseHashAuthParams(): URLSearchParams | null {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  return new URLSearchParams(hash);
}

/**
 * Completes Magic Link / PKCE return handling.
 * Relies on Supabase `detectSessionInUrl` for PKCE (single code exchange); hash tokens use setSession fallback.
 */
export async function completeSupabaseAuthCallback(
  supabase: SupabaseClient,
): Promise<BestieAuthUser | null> {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const authError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (authError) {
    stripAuthCallbackFromUrl();
    console.warn("[auth-callback]", authError);
    return null;
  }

  const hasCallback = hasAuthCallbackInUrl();
  if (!hasCallback) return null;

  // One exchange path: GoTrue `_initialize()` runs inside `getSession()` when detectSessionInUrl is true.
  let { data: { session }, error } = await supabase.auth.getSession();
  if (error) console.warn("[auth-callback]", error.message);

  if (!session?.user) {
    const hashParams = parseHashAuthParams();
    const access_token = hashParams?.get("access_token");
    const refresh_token = hashParams?.get("refresh_token");
    if (access_token && refresh_token) {
      const setResult = await supabase.auth.setSession({ access_token, refresh_token });
      if (setResult.error) console.warn("[auth-callback]", setResult.error.message);
      session = setResult.data.session ?? session;
    }
  }

  if (session?.user) {
    if (url.searchParams.get("code") || window.location.hash.includes("access_token")) {
      stripAuthCallbackFromUrl();
    }
    return mapSupabaseUser(session.user);
  }

  if (url.searchParams.get("code")) {
    console.warn("[auth-callback] auth callback in URL but no session after getSession");
    stripAuthCallbackFromUrl();
  }

  return null;
}
