import type { SupabaseClient } from "@supabase/supabase-js";
import type { BestieAuthUser } from "@/lib/supabase";
import { mapSupabaseUser } from "@/lib/supabase";

export const AUTH_USER_ID_KEY = "bestie_auth_user_id";
export const AUTH_USER_EMAIL_KEY = "bestie_auth_email";

const AUTH_QUERY_KEYS = ["code", "state", "error", "error_description", "access_token", "refresh_token", "type"] as const;

export function readPersistedAuthUser(): BestieAuthUser | null {
  if (typeof localStorage === "undefined") return null;
  const id = localStorage.getItem(AUTH_USER_ID_KEY);
  if (!id) return null;
  const email = localStorage.getItem(AUTH_USER_EMAIL_KEY);
  return { id, email: email || null };
}

export function writePersistedAuthUser(user: BestieAuthUser | null): void {
  if (typeof localStorage === "undefined") return;
  if (!user) {
    localStorage.removeItem(AUTH_USER_ID_KEY);
    localStorage.removeItem(AUTH_USER_EMAIL_KEY);
    return;
  }
  localStorage.setItem(AUTH_USER_ID_KEY, user.id);
  if (user.email) localStorage.setItem(AUTH_USER_EMAIL_KEY, user.email);
  else localStorage.removeItem(AUTH_USER_EMAIL_KEY);
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
    return params.has("access_token") || params.has("refresh_token") || params.get("type") === "recovery";
  } catch {
    return false;
  }
}

export function stripAuthCallbackFromUrl(href = window.location.href): void {
  const url = new URL(href);
  for (const key of AUTH_QUERY_KEYS) url.searchParams.delete(key);
  const search = url.searchParams.toString();
  const path = url.pathname + (search ? `?${search}` : "");
  window.history.replaceState({}, document.title, path);
}

export function stripAuthHashFromUrl(): void {
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
}

/**
 * Completes OAuth / Magic Link return handling (PKCE `code` or hash tokens).
 * Returns the session user when exchange succeeds.
 */
export async function completeSupabaseAuthCallback(
  supabase: SupabaseClient,
): Promise<BestieAuthUser | null> {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const authError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (authError) {
    stripAuthCallbackFromUrl();
    console.warn("[auth-callback]", authError);
    return null;
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    stripAuthCallbackFromUrl();
    if (error) {
      console.warn("[auth-callback]", error.message);
      return null;
    }
    return mapSupabaseUser(data.session?.user ?? null);
  }

  const hash = window.location.hash.replace(/^#/, "");
  if (hash && (hash.includes("access_token=") || hash.includes("refresh_token="))) {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) console.warn("[auth-callback]", error.message);
    if (session?.user) {
      stripAuthHashFromUrl();
      return mapSupabaseUser(session.user);
    }
  }

  return null;
}
