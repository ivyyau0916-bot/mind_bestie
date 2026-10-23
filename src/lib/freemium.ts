import type { PersonaId } from "@/lib/chat-personas";

export const FREE_DAILY_CHAT_LIMIT = 20;
export const TRIAL_CHAT_LIMIT_PER_PERSONA = 5;
export const VIP_PRICE_LABEL = "HK$38/月";

export const TRIAL_CHAT_COUNTS_KEY = "bestie_trial_chat_counts";

/** Persisted trial usage for premium chat personas (legacy keys warrior/rational supported). */
export type TrialChatCounts = { fierce: number; wise: number };

export const DAILY_CHAT_COUNT_KEY = "daily_chat_count";
export const LAST_CHAT_DATE_KEY = "last_chat_date";
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

/** Reset counter when calendar day changes (HK local device date). */
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
  resetDailyChatIfNeeded();
  const next = getDailyChatCount() + 1;
  writeStorage(DAILY_CHAT_COUNT_KEY, String(next));
  writeStorage(LAST_CHAT_DATE_KEY, todayDateKey());
  return next;
}

export function remainingFreeChats(isVip: boolean, now = new Date()): number {
  if (isVip) return Number.POSITIVE_INFINITY;
  resetDailyChatIfNeeded(now);
  return Math.max(0, FREE_DAILY_CHAT_LIMIT - getDailyChatCount());
}

export function canSendFreeChat(isVip: boolean, now = new Date()): boolean {
  if (isVip) return true;
  resetDailyChatIfNeeded(now);
  return getDailyChatCount() < FREE_DAILY_CHAT_LIMIT;
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

/** Daily card & settings persona pickers — premium roles require VIP. */
export function isPersonaUnlocked(persona: PersonaId, isVip: boolean): boolean {
  if (isVip) return true;
  return persona === "gentle";
}

/** Chat — free users may trial fierce/wise until per-persona limit. */
export function isPersonaChatUnlocked(persona: PersonaId, isVip: boolean): boolean {
  if (isVip) return true;
  if (persona === "gentle") return true;
  return !isPersonaTrialLocked(persona, false);
}

/** Free-user send gate: gentle uses daily pool; fierce/wise use per-persona trial. */
export function canSendChatAsFreeUser(persona: PersonaId, now = new Date()): boolean {
  if (persona === "gentle") return canSendFreeChat(false, now);
  return getTrialMessagesUsed(persona) < TRIAL_CHAT_LIMIT_PER_PERSONA;
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
