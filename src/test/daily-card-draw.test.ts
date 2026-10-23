import { beforeEach, describe, expect, it, vi } from "vitest";
import { DAILY_SOUL_CARDS, getSoulCardsForPersona } from "@/lib/daily-card-quotes";
import { displayDailyCardText } from "@/lib/hk-traditional";
import {
  clearDrawnCardIds,
  drawLocalSoulCard,
  drawNextSoulCard,
  getDrawnCardIdsForPersona,
  setDrawnCardIdsForPersona,
} from "@/lib/daily-card-draw";

vi.mock("@/lib/daily-card-openrouter", () => ({
  fetchGeneratedSoulCard: vi.fn(),
}));

import { fetchGeneratedSoulCard } from "@/lib/daily-card-openrouter";

describe("Daily card no-duplicate queue", () => {
  beforeEach(() => {
    localStorage.clear();
    clearDrawnCardIds();
    vi.mocked(fetchGeneratedSoulCard).mockReset();
  });

  it("has at least 10 built-in cards per persona", () => {
    expect(getSoulCardsForPersona("gentle").length).toBeGreaterThanOrEqual(10);
    expect(getSoulCardsForPersona("fierce").length).toBeGreaterThanOrEqual(10);
    expect(getSoulCardsForPersona("wise").length).toBeGreaterThanOrEqual(10);
    expect(DAILY_SOUL_CARDS.length).toBeGreaterThanOrEqual(30);
  });

  it("built-in soul card copy has no simplified han in library", () => {
    for (const card of DAILY_SOUL_CARDS) {
      for (const field of [card.quote, card.vipReading]) {
        expect(displayDailyCardText(field)).toBe(field);
      }
    }
  });

  it("displayDailyCardText converts simplified legacy storage to HK traditional", () => {
    expect(displayDailyCardText("无论今日点样，你都已经撑到呢度")).toMatch(/無論/);
    expect(displayDailyCardText("无论今日点样，你都已经撑到呢度")).toMatch(/已經/);
  });

  it("never repeats a card until the persona deck cycle completes", () => {
    const persona = "gentle" as const;
    const seen = new Set<string>();
    const deckSize = getSoulCardsForPersona(persona).length;
    for (let i = 0; i < deckSize; i++) {
      const card = drawLocalSoulCard(persona);
      expect(card.persona).toBe(persona);
      expect(seen.has(card.id)).toBe(false);
      seen.add(card.id);
    }
    expect(getDrawnCardIdsForPersona(persona).length).toBe(deckSize);
    const nextCycle = drawLocalSoulCard(persona);
    expect(getDrawnCardIdsForPersona(persona)).toEqual([nextCycle.id]);
  });

  it("draws only fierce cards for fierce persona", () => {
    for (let i = 0; i < 8; i++) {
      const card = drawLocalSoulCard("fierce");
      expect(card.persona).toBe("fierce");
    }
  });

  it("uses AI for VIP draws", async () => {
    vi.mocked(fetchGeneratedSoulCard).mockResolvedValue({
      id: "ai-test-1",
      persona: "gentle",
      quote: "VIP 獨家金句測試 ✨",
      icon: "✨",
      vipReading: "🔮 今日靈魂關心解讀：測試解讀。",
    });
    const result = await drawNextSoulCard({ isVip: true, persona: "gentle" });
    expect(result.source).toBe("ai");
    expect(result.card.id).toBe("ai-test-1");
    expect(fetchGeneratedSoulCard).toHaveBeenCalled();
  });

  it("falls back to local draw for free users", async () => {
    const result = await drawNextSoulCard({ isVip: false, persona: "wise" });
    expect(result.source).toBe("local");
    expect(result.card.persona).toBe("wise");
  });

  it("triggers AI when persona local deck is fully drawn", async () => {
    const persona = "gentle" as const;
    setDrawnCardIdsForPersona(
      persona,
      getSoulCardsForPersona(persona).map((c) => c.id),
    );
    vi.mocked(fetchGeneratedSoulCard).mockResolvedValue({
      id: "ai-test-2",
      persona: "gentle",
      quote: "抽完庫存後嘅 AI 金句 🌙",
      icon: "🌙",
      vipReading: "🔮 今日靈魂關心解讀：全新一輪開始。",
    });
    const result = await drawNextSoulCard({ isVip: false, persona });
    expect(result.source).toBe("ai");
  });
});
