import { describe, expect, it } from "vitest";
import {
  buildOpenRouterChatMessages,
  buildOpenRouterContextFromChat,
  OPENROUTER_CHAT_MAX_TOKENS,
  OPENROUTER_HISTORY_MAX_TURNS,
  parseOpenRouterSseDataLine,
} from "@/lib/openrouter-chat";

describe("openrouter streaming helpers", () => {
  it("parses SSE content deltas", () => {
    const line = `data: ${JSON.stringify({ choices: [{ delta: { content: "你好" } }] })}`;
    expect(parseOpenRouterSseDataLine(line)).toBe("你好");
    expect(parseOpenRouterSseDataLine("data: [DONE]")).toBeNull();
  });

  it("keeps chat latency tuning constants in range", () => {
    expect(OPENROUTER_HISTORY_MAX_TURNS).toBeGreaterThanOrEqual(6);
    expect(OPENROUTER_HISTORY_MAX_TURNS).toBeLessThanOrEqual(8);
    expect(OPENROUTER_CHAT_MAX_TOKENS).toBeGreaterThanOrEqual(150);
    expect(OPENROUTER_CHAT_MAX_TOKENS).toBeLessThanOrEqual(200);
  });

  it("sends only system prompt plus the last 8 turns for fast replies", () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("ai" as const),
      text: i % 2 === 0 ? `用戶訊息 ${i}` : `Bestie 回覆 ${i}`,
      time: i + 1,
      persona: "gentle" as const,
    }));
    const pack = buildOpenRouterContextFromChat(messages, "gentle");
    expect(pack.recentMessages).toHaveLength(8);
    expect(pack.memorySummary).toBeNull();

    const apiMessages = buildOpenRouterChatMessages({
      persona: "gentle",
      messages: pack.recentMessages,
      userName: "阿樂",
    });
    expect(apiMessages).toHaveLength(1 + 8);
    expect(apiMessages[0]?.content).toMatch(/阿樂/);
    expect(apiMessages[0]?.content).not.toMatch(/【記憶摘要】/);
    expect(pack.recentMessages.at(-1)?.content).toContain("Bestie 回覆 9");
    expect(pack.recentMessages.some((turn) => turn.content.includes("用戶訊息 8"))).toBe(true);
  });
});
