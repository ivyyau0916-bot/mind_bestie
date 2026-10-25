import type { PersonaId } from "@/lib/chat-personas";
import { canAccessCharacter, isInRegistrationTrial, personaToCharacterId } from "@/lib/trial-limits";

export const FREE_DAILY_CHAT_LIMIT = 20;
export const TRIAL_CHAT_LIMIT_PER_PERSONA = 5;
export const VIP_PRICE_LABEL = "HK$38/月";

export const TRIAL_CHAT_COUNTS_KEY = "bestie_trial_chat_counts";

/** Persisted trial usage for premium chat personas (legacy keys warrior/rational supported). */
export type TrialChatCounts = { fierce: number; wise: number };

export const DAILY_CHAT_COUNT_KEY = "daily_chat_count";
export const LAST_CHAT_DATE_KEY = "last_chat_date";
/** Per-Bestie daily chat: { gentle: { "YYYY-MM-DD": count }, ... } */
export const DAILY_CHAT_BY_PERSONA_KEY = "bestie_daily_chat_by_persona";

const DAILY_CHAT_PERSONAS: PersonaId[] = ["gentle", "fierce", "wise"];
export const DAILY_CARD_DATE_KEY = "bestie_daily_card_date";
export const DAILY_CARD_QUOTE_KEY = "bestie_daily_card_quote";
export const DAILY_CARD_ID_KEY = "bestie_daily_card_id";
/** Per-Bestie daily draws: { gentle: { "YYYY-MM-DD": { id, quote } }, ... } */
export const DAILY_CARD_DRAWS_BY_PERSONA_KEY = "bestie_daily_card_draws_by_role";

const DAILY_DRAW_PERSONAS: PersonaId[] = ["gentle", "fierce", "wise"];

export type PersonaDayDraw = { id: string; quote: string };
export type DrawHistoryByPersona = Record<PersonaId, Record<string, PersonaDayDraw>>;

/** Inline chat hint when free daily messages are used up (no modal). */
export const QUOTA_EXHAUSTED_INLINE_MESSAGE =
  "🫂 今日嘅傾訴額度用完喇～Bestie 要先去洗個澡休息下！去【🔮 抽卡】分頁抽張今日金句卡，或者去【🌱 每日微光打卡】吧 ❤️";

/** @deprecated Use QUOTA_EXHAUSTED_INLINE_MESSAGE in chat UI. */
export const QUOTA_EXHAUSTED_MESSAGE = QUOTA_EXHAUSTED_INLINE_MESSAGE;

/** Shown when today's draw for this role is already used. */
export const DAILY_CARD_DRAW_LIMIT_MESSAGE =
  "今日呢位 Bestie 嘅靈魂卡已經領取過喇～聽日再嚟啦！升級 VIP 可解鎖另外兩位 Bestie，每日最多 3 張金句卡 ✨";

/** Shown when a free user taps a locked Bestie tab on the daily card page. */
export const DAILY_CARD_PERSONA_LOCK_MESSAGE =
  "免費版只開放 🌸 溫柔 Bestie。升級 VIP 可解鎖 🔥 戰友同 🦉 理性，每日三位 Bestie 各抽 1 張，最多 3 張靈魂金句卡。";

/** Inline hint on the card face after today's draw for this role. */
export const DAILY_CARD_ROLE_CLAIMED_HINT = "今日已領取該 Bestie 的靈魂卡片，明天再來吧 ✨";

export function todayDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readStorage(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(key);
}

function writeStorage(key: string, value: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, value);
}

function emptyDailyChatByPersona(): Record<PersonaId, Record<string, number>> {
  return { gentle: {}, fierce: {}, wise: {} };
}

function readDailyChatByPersona(): Record<PersonaId, Record<string, number>> {
  try {
    const raw = readStorage(DAILY_CHAT_BY_PERSONA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<PersonaId, Record<string, number>>>;
      const store = emptyDailyChatByPersona();
      for (const p of DAILY_CHAT_PERSONAS) {
        const bucket = parsed[p];
        if (bucket && typeof bucket === "object") {
          store[p] = Object.fromEntries(
            Object.entries(bucket).filter(
              (entry): entry is [string, number] =>
                typeof entry[0] === "string" && typeof entry[1] === "number" && entry[1] >= 0,
            ),
          );
        }
      }
      return store;
    }
  } catch {
    /* fall through */
  }
  return emptyDailyChatByPersona();
}

function writeDailyChatByPersona(store: Record<PersonaId, Record<string, number>>) {
  writeStorage(DAILY_CHAT_BY_PERSONA_KEY, JSON.stringify(store));
}

/** 試用期內三位 Bestie 各 20 次／日；試用期後僅溫柔用每日池。 */
export function usesPerPersonaDailyChatLimit(persona: PersonaId, createdAt?: string | null): boolean {
  if (isInRegistrationTrial(false, createdAt)) return true;
  return persona === "gentle";
}

function migrateLegacyGentleDailyIntoPersonaStore(now = new Date()) {
  const today = todayDateKey(now);
  const last = readStorage(LAST_CHAT_DATE_KEY);
  if (last !== today) return;
  const store = readDailyChatByPersona();
  if (store.gentle[today] != null) return;
  const legacy = readStorage(DAILY_CHAT_COUNT_KEY);
  const n = legacy ? Number.parseInt(legacy, 10) : 0;
  if (!Number.isFinite(n) || n <= 0) return;
  store.gentle[today] = n;
  writeDailyChatByPersona(store);
}

export function getPersonaDailyChatCount(persona: PersonaId, now = new Date()): number {
  migrateLegacyGentleDailyIntoPersonaStore(now);
  const today = todayDateKey(now);
  const store = readDailyChatByPersona();
  return store[persona][today] ?? 0;
}

export function incrementPersonaDailyChatCount(persona: PersonaId, now = new Date()): number {
  const today = todayDateKey(now);
  const store = readDailyChatByPersona();
  const next = (store[persona][today] ?? 0) + 1;
  store[persona][today] = next;
  writeDailyChatByPersona(store);
  if (persona === "gentle") {
    writeStorage(LAST_CHAT_DATE_KEY, today);
    writeStorage(DAILY_CHAT_COUNT_KEY, String(next));
  }
  return next;
}

/** Reset counter when calendar day changes (HK local device date). Legacy gentle-only key. */
export function resetDailyChatIfNeeded(now = new Date()): number {
  const today = todayDateKey(now);
  const last = readStorage(LAST_CHAT_DATE_KEY);
  if (last !== today) {
    writeStorage(LAST_CHAT_DATE_KEY, today);
    writeStorage(DAILY_CHAT_COUNT_KEY, "0");
    return 0;
  }
  return getDailyChatCount();
}

export function getDailyChatCount(): number {
  const raw = readStorage(DAILY_CHAT_COUNT_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function incrementDailyChatCount(): number {
  return incrementPersonaDailyChatCount("gentle");
}

export function remainingFreeChatsForPersona(
  persona: PersonaId,
  isVip: boolean,
  createdAt?: string | null,
  now = new Date(),
): number {
  if (isVip) return Number.POSITIVE_INFINITY;
  if (usesPerPersonaDailyChatLimit(persona, createdAt)) {
    return Math.max(0, FREE_DAILY_CHAT_LIMIT - getPersonaDailyChatCount(persona, now));
  }
  return Math.max(0, TRIAL_CHAT_LIMIT_PER_PERSONA - getTrialMessagesUsed(persona));
}

/** @deprecated Prefer remainingFreeChatsForPersona("gentle", …) */
export function remainingFreeChats(isVip: boolean, now = new Date()): number {
  return remainingFreeChatsForPersona("gentle", isVip, null, now);
}

export function canSendFreeChat(isVip: boolean, now = new Date()): boolean {
  return canSendFreeChatForPersona("gentle", isVip, null, now);
}

export function canSendFreeChatForPersona(
  persona: PersonaId,
  isVip: boolean,
  createdAt?: string | null,
  now = new Date(),
): boolean {
  if (isVip) return true;
  if (usesPerPersonaDailyChatLimit(persona, createdAt)) {
    return getPersonaDailyChatCount(persona, now) < FREE_DAILY_CHAT_LIMIT;
  }
  return getTrialMessagesUsed(persona) < TRIAL_CHAT_LIMIT_PER_PERSONA;
}

function emptyTrialCounts(): TrialChatCounts {
  return { fierce: 0, wise: 0 };
}

function normalizeTrialCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function getTrialChatCounts(): TrialChatCounts {
  try {
    const raw = readStorage(TRIAL_CHAT_COUNTS_KEY);
    if (!raw) return emptyTrialCounts();
    const parsed = JSON.parse(raw) as Partial<
      TrialChatCounts & { warrior?: number; rational?: number }
    >;
    return {
      fierce: normalizeTrialCount(parsed.fierce ?? parsed.warrior),
      wise: normalizeTrialCount(parsed.wise ?? parsed.rational),
    };
  } catch {
    return emptyTrialCounts();
  }
}

function writeTrialChatCounts(counts: TrialChatCounts) {
  writeStorage(TRIAL_CHAT_COUNTS_KEY, JSON.stringify(counts));
}

export function getTrialMessagesUsed(persona: PersonaId): number {
  if (persona === "gentle") return 0;
  const counts = getTrialChatCounts();
  return counts[persona];
}

export function getTrialMessagesRemaining(persona: PersonaId, isVip: boolean): number {
  if (isVip || persona === "gentle") return Number.POSITIVE_INFINITY;
  return Math.max(0, TRIAL_CHAT_LIMIT_PER_PERSONA - getTrialMessagesUsed(persona));
}

export function isPersonaTrialLocked(persona: PersonaId, isVip: boolean): boolean {
  if (isVip || persona === "gentle") return false;
  return getTrialMessagesUsed(persona) >= TRIAL_CHAT_LIMIT_PER_PERSONA;
}

/** Daily card & settings persona pickers — VIP 或 3 天試用期內全解鎖。 */
export function isPersonaUnlocked(
  persona: PersonaId,
  isVip: boolean,
  createdAt?: string | null,
): boolean {
  return canAccessCharacter(personaToCharacterId(persona), isVip, createdAt).allowed;
}

/** Chat — 試用期內全角色可選；試用期後 fierce/wise 另有 5 則試用。 */
export function isPersonaChatUnlocked(
  persona: PersonaId,
  isVip: boolean,
  createdAt?: string | null,
): boolean {
  if (!canAccessCharacter(personaToCharacterId(persona), isVip, createdAt).allowed) return false;
  if (isVip) return true;
  if (isInRegistrationTrial(false, createdAt)) return true;
  if (persona === "gentle") return true;
  return !isPersonaTrialLocked(persona, false);
}

/** Free-user send gate: 試用期內各角色每日 20 次；試用期後 gentle 每日 20、fierce/wise 鎖定或 5 則試用。 */
export function canSendChatAsFreeUser(
  persona: PersonaId,
  createdAt?: string | null,
  now = new Date(),
): boolean {
  if (!isPersonaChatUnlocked(persona, false, createdAt)) return false;
  return canSendFreeChatForPersona(persona, false, createdAt, now);
}

/** 非 VIP 發送後遞增用量（試用期內按角色分開計每日 20 次）。 */
export function recordFreeChatSend(persona: PersonaId, createdAt?: string | null, now = new Date()): void {
  if (usesPerPersonaDailyChatLimit(persona, createdAt)) {
    incrementPersonaDailyChatCount(persona, now);
    return;
  }
  incrementTrialChatCount(persona);
}

export type FreeUserAccountStatus = {
  tierTitle: string;
  quotaLine: string;
  footnote: string;
  remaining: number;
  usedToday: number;
};

/** 設定／帳號區塊：免費用戶身份與剩餘對話文案。 */
export function getFreeUserAccountStatus(
  persona: PersonaId,
  createdAt?: string | null,
  now = new Date(),
): FreeUserAccountStatus {
  const inTrial = isInRegistrationTrial(false, createdAt);
  if (inTrial) {
    const remaining = remainingFreeChatsForPersona(persona, false, createdAt, now);
    return {
      tierTitle: "免費用戶（3 天完整試用中 ✨）",
      quotaLine: `當前角色今日剩餘對話：${remaining} / ${FREE_DAILY_CHAT_LIMIT} 次`,
      footnote: "三個角色每日各享 20 次對話（分別計算，不共用）。",
      remaining,
      usedToday: getPersonaDailyChatCount(persona, now),
    };
  }
  const gentleRemaining = remainingFreeChatsForPersona("gentle", false, createdAt, now);
  return {
    tierTitle: "免費用戶",
    quotaLine: `溫柔角色今日剩餘對話：${gentleRemaining} / ${FREE_DAILY_CHAT_LIMIT} 次`,
    footnote: "升級 VIP 解鎖毒舌與理智角色。",
    remaining: gentleRemaining,
    usedToday: getPersonaDailyChatCount("gentle", now),
  };
}

export function incrementTrialChatCount(persona: PersonaId): number {
  if (persona === "gentle") return 0;
  const counts = getTrialChatCounts();
  const next = Math.min(TRIAL_CHAT_LIMIT_PER_PERSONA, counts[persona] + 1);
  counts[persona] = next;
  writeTrialChatCounts(counts);
  return next;
}

export function clearTrialChatCounts(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(TRIAL_CHAT_COUNTS_KEY);
}

/**
 * Keys that must survive「重設／清除資料」— prevents resetting daily free chat or draw quotas.
 * Registration trial length uses Supabase Auth `user.created_at` (not cleared here).
 */
export const USAGE_QUOTA_PRESERVE_KEYS = [
  DAILY_CHAT_COUNT_KEY,
  LAST_CHAT_DATE_KEY,
  DAILY_CHAT_BY_PERSONA_KEY,
  TRIAL_CHAT_COUNTS_KEY,
  DAILY_CARD_DRAWS_BY_PERSONA_KEY,
  DAILY_CARD_DATE_KEY,
  DAILY_CARD_QUOTE_KEY,
  DAILY_CARD_ID_KEY,
] as const;

export function buildTrialExhaustedVipMessage(persona: PersonaId): string {
  const label = persona === "fierce" ? "戰友" : persona === "wise" ? "理性" : "Bestie";
  return `你已用完 ${TRIAL_CHAT_LIMIT_PER_PERSONA} 次${label}試用對話。訂閱 VIP 尊尚會員，解鎖全 3 位 Bestie 無限傾訴與每日靈魂金句卡片 ✨`;
}

function emptyDrawHistoryByPersona(): DrawHistoryByPersona {
  return { gentle: {}, fierce: {}, wise: {} };
}

function migrateLegacyDailyDrawInto(store: DrawHistoryByPersona): DrawHistoryByPersona {
  const drawnDate = readStorage(DAILY_CARD_DATE_KEY);
  const savedQuote = readStorage(DAILY_CARD_QUOTE_KEY);
  const savedCardId = readStorage(DAILY_CARD_ID_KEY);
  if (drawnDate && savedQuote && savedCardId && !store.gentle[drawnDate]) {
    store.gentle[drawnDate] = { id: savedCardId, quote: savedQuote };
  }
  if (drawnDate && savedQuote && savedCardId) {
    localStorage.removeItem(DAILY_CARD_DATE_KEY);
    localStorage.removeItem(DAILY_CARD_QUOTE_KEY);
    localStorage.removeItem(DAILY_CARD_ID_KEY);
  }
  return store;
}

export function readDailyCardDrawHistory(): DrawHistoryByPersona {
  try {
    const raw = readStorage(DAILY_CARD_DRAWS_BY_PERSONA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DrawHistoryByPersona>;
      const store = emptyDrawHistoryByPersona();
      for (const persona of DAILY_DRAW_PERSONAS) {
        const bucket = parsed[persona];
        if (bucket && typeof bucket === "object") {
          store[persona] = Object.fromEntries(
            Object.entries(bucket).filter(
              (entry): entry is [string, PersonaDayDraw] =>
                typeof entry[0] === "string"
                && !!entry[1]
                && typeof entry[1].id === "string"
                && typeof entry[1].quote === "string",
            ),
          );
        }
      }
      return store;
    }
  } catch {
    /* fall through */
  }
  return migrateLegacyDailyDrawInto(emptyDrawHistoryByPersona());
}

function writeDailyCardDrawHistory(store: DrawHistoryByPersona) {
  writeStorage(DAILY_CARD_DRAWS_BY_PERSONA_KEY, JSON.stringify(store));
}

export function clearDailyCardDrawHistory() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(DAILY_CARD_DRAWS_BY_PERSONA_KEY);
  localStorage.removeItem(DAILY_CARD_DATE_KEY);
  localStorage.removeItem(DAILY_CARD_QUOTE_KEY);
  localStorage.removeItem(DAILY_CARD_ID_KEY);
}

export function getDailyCardDrawState(
  _isVip: boolean,
  persona: PersonaId,
  now = new Date(),
): { canDraw: boolean; savedQuote: string | null; savedCardId: string | null } {
  const today = todayDateKey(now);
  const store = readDailyCardDrawHistory();
  const todayDraw = store[persona][today];

  if (todayDraw) {
    return { canDraw: false, savedQuote: todayDraw.quote, savedCardId: todayDraw.id };
  }
  return { canDraw: true, savedQuote: null, savedCardId: null };
}

export function saveDailyCardDraw(
  card: { id: string; quote: string },
  persona: PersonaId,
  now = new Date(),
) {
  const today = todayDateKey(now);
  const store = readDailyCardDrawHistory();
  store[persona][today] = { id: card.id, quote: card.quote };
  writeDailyCardDrawHistory(store);
}
export function getPersonaTrialState(createdAt?: string | null, isVip?: boolean) {
  if (isVip) return { isUnlocked: true, remaining: "無限" as const };
  if (isInRegistrationTrial(false, createdAt)) {
    return { isUnlocked: true, remaining: "試用中" as const };
  }
  return { isUnlocked: false, remaining: "已用完" as const };
}
