// src/lib/trial-limits.ts

import type { PersonaId } from "@/lib/chat-personas";

export type CharacterId = "gentle" | "sarcastic" | "rational";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function personaToCharacterId(persona: PersonaId): CharacterId {
  if (persona === "fierce") return "sarcastic";
  if (persona === "wise") return "rational";
  return "gentle";
}

/** 註冊後 3 天試用（非 VIP）；無 created_at 視為本機測試帳號，仍在試用內。 */
export function isInRegistrationTrial(isVip: boolean, createdAt?: string | null): boolean {
  if (isVip) return false;
  if (!createdAt) return true;
  const createdTime = new Date(createdAt).getTime();
  if (!Number.isFinite(createdTime)) return true;
  return Date.now() - createdTime < THREE_DAYS_MS;
}

/**
 * 檢查用戶是否可以存取該角色（前 3 天享有完整試用期，之後非 VIP 僅能使用溫柔/gentle）
 */
export function canAccessCharacter(
  characterId: CharacterId,
  isVip: boolean,
  createdAt?: string | null
): { allowed: boolean; reason?: string } {
  // 1. 如果是 VIP，直接全部開放
  if (isVip) {
    return { allowed: true };
  }

  // 2. 溫柔角色永久免費開放
  if (characterId === "gentle") {
    return { allowed: true };
  }

  // 3. 針對毒舌 (sarcastic) 與理智 (rational) 角色，檢查 3 天試用期
  // 如果沒有建立時間（例如本機測試帳號），為了方便測試，預設視為「在試用期內（允許免費使用）」！
  if (!createdAt) {
    return { allowed: true };
  }

  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const isInTrial = now - createdTime < THREE_DAYS_MS;

  if (isInTrial) {
    return { allowed: true };
  }

  // 超過 3 天且非 VIP 則鎖定
  return { 
    allowed: false, 
    reason: "3 天試用期已過，升級 VIP 即可解鎖完整對話與抽卡權限 ✨" 
  };
}