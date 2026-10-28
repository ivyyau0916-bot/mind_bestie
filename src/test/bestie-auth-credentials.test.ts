import { describe, expect, it } from "vitest";
import {
  friendlyAuthErrorMessage,
  MIN_AUTH_PASSWORD_LENGTH,
  validateAuthEmail,
  validateAuthPassword,
} from "@/lib/bestie-auth-credentials";

describe("bestie auth credentials", () => {
  it("rejects short passwords", () => {
    const result = validateAuthPassword("12345");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain(String(MIN_AUTH_PASSWORD_LENGTH));
    }
  });

  it("accepts valid email and password", () => {
    expect(validateAuthEmail("ivy@example.com")).toEqual({ ok: true, email: "ivy@example.com" });
    expect(validateAuthPassword("secret1").ok).toBe(true);
  });

  it("maps invalid login to friendly copy", () => {
    expect(friendlyAuthErrorMessage({ message: "Invalid login credentials" })).toContain("密碼不正確");
  });
});
