import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_USER_EMAIL_KEY,
  AUTH_USER_ID_KEY,
  hasAuthCallbackInUrl,
  readPersistedAuthUser,
  writePersistedAuthUser,
} from "@/lib/supabase-auth-callback";

describe("supabase auth callback helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("detects PKCE code in query string", () => {
    expect(hasAuthCallbackInUrl("https://app.test/profile?code=abc123")).toBe(true);
    expect(hasAuthCallbackInUrl("https://app.test/profile")).toBe(false);
  });

  it("detects access_token in hash", () => {
    expect(hasAuthCallbackInUrl("https://app.test/profile#access_token=xyz&type=bearer")).toBe(true);
  });

  it("persists auth user snapshot for instant UI", () => {
    writePersistedAuthUser({ id: "user-1", email: "ivy@example.com" });
    expect(localStorage.getItem(AUTH_USER_ID_KEY)).toBe("user-1");
    expect(localStorage.getItem(AUTH_USER_EMAIL_KEY)).toBe("ivy@example.com");
    expect(readPersistedAuthUser()).toEqual({ id: "user-1", email: "ivy@example.com" });
    writePersistedAuthUser(null);
    expect(readPersistedAuthUser()).toBeNull();
  });
});
