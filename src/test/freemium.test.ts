import { beforeEach, describe, expect, it } from "vitest";
import {
  DAILY_CHAT_COUNT_KEY,
  FREE_DAILY_CHAT_LIMIT,
  LAST_CHAT_DATE_KEY,
  TRIAL_CHAT_LIMIT_PER_PERSONA,
  canSendChatAsFreeUser,
  canSendFreeChat,
  getDailyCardDrawState,
  getDailyChatCount,
  getTrialMessagesRemaining,
  incrementDailyChatCount,
  incrementTrialChatCount,
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

  it("locks premium personas for daily card until VIP", () => {
    expect(isPersonaUnlocked("gentle", false)).toBe(true);
    expect(isPersonaUnlocked("fierce", false)).toBe(false);
    expect(isPersonaUnlocked("wise", true)).toBe(true);
  });

  it("allows chat trial for fierce and wise until limit", () => {
    expect(isPersonaChatUnlocked("fierce", false)).toBe(true);
    expect(isPersonaChatUnlocked("wise", false)).toBe(true);
    for (let i = 0; i < TRIAL_CHAT_LIMIT_PER_PERSONA; i++) incrementTrialChatCount("fierce");
    expect(isPersonaTrialLocked("fierce", false)).toBe(true);
    expect(isPersonaChatUnlocked("fierce", false)).toBe(false);
    expect(canSendChatAsFreeUser("fierce")).toBe(false);
    expect(getTrialMessagesRemaining("wise", false)).toBe(TRIAL_CHAT_LIMIT_PER_PERSONA);
    expect(canSendChatAsFreeUser("gentle")).toBe(true);
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
});
