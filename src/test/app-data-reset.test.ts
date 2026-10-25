import { beforeEach, describe, expect, it } from "vitest";
import { MOOD_APP_STORAGE_KEY, resetAllUserAppData } from "@/lib/app-data-reset";
import { USER_CARD_HISTORY_KEY, USER_NAME_KEY } from "@/lib/bestie-account";
import {
  DAILY_CARD_DRAWS_BY_PERSONA_KEY,
  DAILY_CHAT_BY_PERSONA_KEY,
  saveDailyCardDraw,
} from "@/lib/freemium";
import {
  DRAWN_CARDS_BY_PERSONA_KEY,
  markCardDrawn,
} from "@/lib/daily-card-draw";
import {
  SELF_CARE_DAILY_RECORDS_KEY,
  SELF_CARE_STREAK_KEY,
  toggleSelfCareTask,
} from "@/lib/self-care-checkin";

describe("resetAllUserAppData", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("clears soul cards and daily glimmer but preserves chat quota keys", () => {
    localStorage.setItem(MOOD_APP_STORAGE_KEY, '{"messages":[]}');
    localStorage.setItem(USER_NAME_KEY, "阿樂");
    localStorage.setItem(USER_CARD_HISTORY_KEY, "[]");
    localStorage.setItem(DAILY_CHAT_BY_PERSONA_KEY, '{"gentle":{"2026-10-25":5}}');
    saveDailyCardDraw({ id: "c1", quote: "金句" }, "gentle", new Date("2026-10-25T10:00:00"));
    markCardDrawn("c1", "gentle");
    toggleSelfCareTask("warm-water");
    localStorage.setItem(SELF_CARE_STREAK_KEY, "3");

    resetAllUserAppData();

    expect(localStorage.getItem(MOOD_APP_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(USER_NAME_KEY)).toBeNull();
    expect(localStorage.getItem(DAILY_CARD_DRAWS_BY_PERSONA_KEY)).toBeNull();
    expect(localStorage.getItem(DRAWN_CARDS_BY_PERSONA_KEY)).toBeNull();
    expect(localStorage.getItem(SELF_CARE_DAILY_RECORDS_KEY)).toBeNull();
    expect(localStorage.getItem(SELF_CARE_STREAK_KEY)).toBeNull();
    expect(localStorage.getItem(DAILY_CHAT_BY_PERSONA_KEY)).toContain("gentle");
  });
});
