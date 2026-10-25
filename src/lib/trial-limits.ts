// 角色 ID 型別
export type CharacterId = "gentle" | "sarcastic" | "rational";

const DAILY_CHAT_LIMIT = 20;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * 1. 取得或初始化「首次訪問時間」
 */
export function getFirstVisitTime(userCreatedAt?: string | null): number {
  if (userCreatedAt) {
    return new Date(userCreatedAt).getTime();
  }
  let localTime = localStorage.getItem("app_first_visit_time");
  if (!localTime) {
    localTime = new Date().toISOString();
    localStorage.setItem("app_first_visit_time", localTime);
  }
  return new Date(localTime).getTime();
}

/**
 * 2. 檢查是否在 3 天試用期內
 */
export function isWithin3DaysTrial(userCreatedAt?: string | null): boolean {
  const startTime = getFirstVisitTime(userCreatedAt);
  const now = Date.now();
  return (now - startTime) <= THREE_DAYS_MS;
}

/**
 * 3. 檢查角色訪問權限（適用於聊天頁面切換 & 抽卡頁面）
 */
export function canAccessCharacter(
  characterId: CharacterId,
  isVip: boolean = false,
  userCreatedAt?: string | null
): { allowed: boolean; reason?: "REQUIRE_VIP_OR_LOGIN" } {
  // 溫柔 Bestie 永遠免費開放
  if (characterId === "gentle") {
    return { allowed: true };
  }

  // VIP 用戶解鎖全部
  if (isVip) {
    return { allowed: true };
  }

  // 前 3 天試用期內開放毒舌與理智
  if (isWithin3DaysTrial(userCreatedAt)) {
    return { allowed: true };
  }

  // 超過 3 天且非 VIP -> 鎖定
  return { allowed: false, reason: "REQUIRE_VIP_OR_LOGIN" };
}

/**
 * 4. 檢查當天剩餘聊天次數
 */
export function getRemainingChatCount(characterId: CharacterId, isVip: boolean = false): number {
  if (isVip) return 999; // VIP 無限聊天

  const today = new Date().toISOString().split("T")[0];
  const key = `chat_count_${characterId}_${today}`;
  const count = parseInt(localStorage.getItem(key) || "0", 10);

  return Math.max(0, DAILY_CHAT_LIMIT - count);
}

/**
 * 5. 記錄發送了一條訊息 (次數 +1)
 */
export function incrementChatCount(characterId: CharacterId, isVip: boolean = false) {
  if (isVip) return;

  const today = new Date().toISOString().split("T")[0];
  const key = `chat_count_${characterId}_${today}`;
  const count = parseInt(localStorage.getItem(key) || "0", 10);
  localStorage.setItem(key, (count + 1).toString());
}
