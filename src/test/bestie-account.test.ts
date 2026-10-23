import { beforeEach, describe, expect, it } from "vitest";
import {
  appendUserCardHistory,
  getUserCardHistory,
  getUserName,
  normalizeUserName,
  setUserName,
  USER_CARD_HISTORY_KEY,
  USER_NAME_KEY,
} from "@/lib/bestie-account";

describe("bestie account", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and reads user name", () => {
    setUserName("  阿樂  ");
    expect(getUserName()).toBe("阿樂");
    expect(localStorage.getItem(USER_NAME_KEY)).toBe("阿樂");
  });

  it("normalizes empty names", () => {
    expect(normalizeUserName("   ")).toBe("");
  });

  it("appends card draw history", () => {
    appendUserCardHistory({
      id: "card-1",
      quote: "今日要對自己好啲",
      persona: "gentle",
      dateKey: "2026-10-23",
    });
    const history = getUserCardHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.id).toBe("card-1");
    expect(history[0]?.role).toBe("gentle");
    expect(history[0]?.persona).toBe("gentle");
    expect(localStorage.getItem(USER_CARD_HISTORY_KEY)).toContain("card-1");
  });
});
