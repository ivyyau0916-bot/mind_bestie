import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Vite env — use publishable/anon key from Supabase Dashboard → Project Settings → API. */
export function getSupabaseUrl(): string | undefined {
  return import.meta.env.VITE_SUPABASE_URL?.trim() || undefined;
}

export function getSupabaseAnonKey(): string | undefined {
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    undefined
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

let browserClient: SupabaseClient | null = null;

/** Browser Supabase client (Vite SPA — session persisted in cookies via @supabase/ssr). */
export function createSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(getSupabaseUrl()!, getSupabaseAnonKey()!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}

/** @alias createSupabaseClient */
export function getSupabaseClient(): SupabaseClient | null {
  return createSupabaseClient();
}

export type BestieAuthUser = {
  id: string;
  email: string | null;
  /** Supabase Auth `user.created_at` — 用於 3 天註冊試用判定 */
  created_at?: string | null;
};

export function mapSupabaseUser(
  user: { id: string; email?: string | null; created_at?: string | null } | null,
): BestieAuthUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? null, created_at: user.created_at ?? null };
}

/** Canonical site origin for Magic Link redirects (must match Supabase allowlist). */
export function getAppOrigin(): string {
  const configured = import.meta.env.VITE_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "https://mind-bestie-znvt.vercel.app";
}

export function getAuthRedirectUrl(path = "/auth/callback"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getAppOrigin()}${normalized}`;
}
