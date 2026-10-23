import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPENROUTER_MODEL,
  OPENROUTER_CHAT_TEMPERATURE,
  OPENROUTER_FREQUENCY_PENALTY,
  OPENROUTER_TOP_P,
  buildOpenRouterHistoryFromChat,
  sanitizeOpenRouterChatTurns,
  formatOpenRouterUserMessage,
  isOpenRouterRateLimitMessage,
  isRetryableOpenRouterStatus,
  resolveOpenRouterModelChain,
  retryDelayMs,
} from "@/lib/openrouter-chat";

describe("OpenRouter resilience", () => {
  it("balances creativity and accuracy for chat sampling", () => {
    expect(OPENROUTER_CHAT_TEMPERATURE).toBe(0.7);
    expect(OPENROUTER_TOP_P).toBe(0.9);
    expect(OPENROUTER_FREQUENCY_PENALTY).toBe(0.5);
  });

  it("sanitizes API context to dialogue text only", () => {
    const turns = sanitizeOpenRouterChatTurns([
      { role: "user", content: " 今日好攰 " },
      { role: "assistant", content: "OpenRouter 回應失敗（429）" },
      { role: "assistant", content: "className=foo strokeStyle red" },
      { role: "user", content: "OT 加到頂" },
    ]);
    expect(turns).toEqual([
      { role: "user", content: "今日好攰" },
      { role: "user", content: "OT 加到頂" },
    ]);
    const history = buildOpenRouterHistoryFromChat(
      [
        { role: "ai", text: "Hey～ 今日過得點啊？", time: 0, persona: "gentle" },
        { role: "user", text: "老細又 OT", time: 1 },
        { role: "ai", text: "下？又 OT？", time: 2, persona: "gentle" },
      ],
      "gentle",
    );
    expect(history).toEqual([
      { role: "user", content: "老細又 OT" },
      { role: "assistant", content: "下？又 OT？" },
    ]);
  });

  it("defaults to qwen with deepseek fallback chain", () => {
    expect(DEFAULT_OPENROUTER_MODEL).toBe("qwen/qwen-2.5-72b-instruct");
    expect(resolveOpenRouterModelChain()[0]).toBeTruthy();
  });

  it("treats 429 as retryable", () => {
    expect(isRetryableOpenRouterStatus(429)).toBe(true);
    expect(isRetryableOpenRouterStatus(400)).toBe(false);
    expect(isRetryableOpenRouterStatus(503, "temporarily unavailable")).toBe(true);
  });

  it("uses exponential backoff delays", () => {
    expect(retryDelayMs(0)).toBe(700);
    expect(retryDelayMs(1)).toBe(1400);
  });

  it("formats friendly 429 copy", () => {
    expect(formatOpenRouterUserMessage(429, "Rate limit exceeded", true)).toMatch(/429/);
    expect(formatOpenRouterUserMessage(429, "Rate limit exceeded", true)).toMatch(/重試/);
    expect(isOpenRouterRateLimitMessage(formatOpenRouterUserMessage(429, "x", true))).toBe(true);
  });
});
