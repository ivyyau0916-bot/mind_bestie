import { beforeEach, describe, expect, it } from "vitest";
import {
  DAILY_CARD_DRAWS_BY_PERSONA_KEY,
  DAILY_CHAT_BY_PERSONA_KEY,
  DAILY_CHAT_COUNT_KEY,
  FREE_DAILY_CHAT_LIMIT,
  LAST_CHAT_DATE_KEY,
  TRIAL_CHAT_COUNTS_KEY,
  TRIAL_CHAT_LIMIT_PER_PERSONA,
  canSendChatAsFreeUser,
  canSendFreeChat,
  getDailyCardDrawState,
  getDailyChatCount,
  getTrialMessagesRemaining,
  incrementDailyChatCount,
  incrementPersonaDailyChatCount,
  incrementTrialChatCount,
  USAGE_QUOTA_PRESERVE_KEYS,
  isPersonaChatUnlocked,
  isPersonaTrialLocked,
  isPersonaUnlocked,
  resetDailyChatIfNeeded,
  saveDailyCardDraw,
  todayDateKey,
} from "@/lib/freemium";

describe("Freemium daily chat limits", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("resets count on a new calendar day", () => {
    localStorage.setItem(LAST_CHAT_DATE_KEY, "2020-01-01");
    localStorage.setItem(DAILY_CHAT_COUNT_KEY, "20");
    expect(resetDailyChatIfNeeded(new Date("2026-10-22T12:00:00"))).toBe(0);
    expect(getDailyChatCount()).toBe(0);
    expect(localStorage.getItem(LAST_CHAT_DATE_KEY)).toBe(todayDateKey(new Date("2026-10-22T12:00:00")));
  });

  it("blocks free users after 20 sends", () => {
    for (let i = 0; i < FREE_DAILY_CHAT_LIMIT; i++) incrementDailyChatCount();
    expect(canSendFreeChat(false)).toBe(false);
    expect(canSendFreeChat(true)).toBe(true);
  });

  it("locks premium personas after registration trial unless VIP or in trial", () => {
    const afterTrial = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    expect(isPersonaUnlocked("gentle", false, afterTrial)).toBe(true);
    expect(isPersonaUnlocked("fierce", false, afterTrial)).toBe(false);
    expect(isPersonaUnlocked("fierce", false, null)).toBe(true);
    expect(isPersonaUnlocked("wise", true, afterTrial)).toBe(true);
  });

  it("locks premium chat personas after registration trial until VIP", () => {
    const afterTrial = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    expect(isPersonaChatUnlocked("fierce", false, afterTrial)).toBe(false);
    expect(isPersonaChatUnlocked("wise", false, afterTrial)).toBe(false);
    expect(isPersonaChatUnlocked("gentle", false, afterTrial)).toBe(true);
    expect(canSendChatAsFreeUser("fierce", afterTrial)).toBe(false);
    expect(canSendChatAsFreeUser("gentle", afterTrial)).toBe(true);
  });

  it("unlocks all chat personas during registration trial", () => {
    expect(isPersonaChatUnlocked("fierce", false, null)).toBe(true);
    expect(isPersonaChatUnlocked("wise", false, null)).toBe(true);
  });

  it("tracks independent daily chat per persona during registration trial", () => {
    for (let i = 0; i < FREE_DAILY_CHAT_LIMIT; i++) incrementPersonaDailyChatCount("fierce");
    expect(canSendChatAsFreeUser("fierce", null)).toBe(false);
    expect(canSendChatAsFreeUser("wise", null)).toBe(true);
    expect(canSendChatAsFreeUser("gentle", null)).toBe(true);
  });

  it("tracks daily draws independently per Bestie role", () => {
    const now = new Date("2026-10-23T10:00:00");
    saveDailyCardDraw({ id: "g1", quote: "溫柔金句" }, "gentle", now);
    expect(getDailyCardDrawState(false, "gentle", now).canDraw).toBe(false);
    expect(getDailyCardDrawState(false, "fierce", now).canDraw).toBe(true);
    expect(getDailyCardDrawState(false, "wise", now).canDraw).toBe(true);

    saveDailyCardDraw({ id: "f1", quote: "戰友金句" }, "fierce", now);
    expect(getDailyCardDrawState(false, "fierce", now).canDraw).toBe(false);
    expect(getDailyCardDrawState(false, "gentle", now).savedQuote).toBe("溫柔金句");
    expect(getDailyCardDrawState(false, "fierce", now).savedQuote).toBe("戰友金句");
  });

  it("caps VIP to one draw per role per day", () => {
    const now = new Date("2026-10-23T10:00:00");
    saveDailyCardDraw({ id: "v1", quote: "VIP 金句" }, "gentle", now);
    expect(getDailyCardDrawState(true, "gentle", now).canDraw).toBe(false);
    expect(getDailyCardDrawState(true, "fierce", now).canDraw).toBe(true);
  });

  it("documents chat quota keys preserved on privacy reset", () => {
    const now = new Date("2026-10-23T12:00:00");
    for (let i = 0; i < 5; i++) incrementPersonaDailyChatCount("gentle", now);
    incrementTrialChatCount("fierce");
    const snapshot = Object.fromEntries(
      USAGE_QUOTA_PRESERVE_KEYS.map((key) => [key, localStorage.getItem(key)]),
    );
    expect(snapshot[DAILY_CHAT_BY_PERSONA_KEY]).toContain("gentle");
    expect(snapshot[TRIAL_CHAT_COUNTS_KEY]).toBeTruthy();
    expect(USAGE_QUOTA_PRESERVE_KEYS).not.toContain(DAILY_CARD_DRAWS_BY_PERSONA_KEY);
  });
});
