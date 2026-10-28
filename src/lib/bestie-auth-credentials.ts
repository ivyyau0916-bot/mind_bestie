export const MIN_AUTH_PASSWORD_LENGTH = 6;

export type AuthActionResult = { ok: true } | { ok: false; message: string };

export function normalizeAuthEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateAuthEmail(raw: string): AuthActionResult | { ok: true; email: string } {
  const email = normalizeAuthEmail(raw);
  if (!email.includes("@") || !email.includes(".")) {
    return { ok: false, message: "請輸入有效的 Email 地址。" };
  }
  return { ok: true, email };
}

export function validateAuthPassword(password: string): AuthActionResult | { ok: true } {
  if (password.length < MIN_AUTH_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `密碼至少需要 ${MIN_AUTH_PASSWORD_LENGTH} 個字元，請再試一次。`,
    };
  }
  return { ok: true };
}

/** Map Supabase auth errors to friendly Traditional Chinese copy. */
export function friendlyAuthErrorMessage(error: { message?: string } | string): string {
  const message = typeof error === "string" ? error : (error.message ?? "");
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid email or password")) {
    return "Email 或密碼不正確，請再確認一次。";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "此 Email 已註冊過，請直接登入。";
  }
  if (lower.includes("password") && lower.includes("short")) {
    return `密碼至少需要 ${MIN_AUTH_PASSWORD_LENGTH} 個字元。`;
  }
  if (lower.includes("email not confirmed")) {
    return "請先到信箱完成 Email 驗證，再登入。";
  }
  return message || "登入或註冊時發生問題，請稍後再試。";
}
