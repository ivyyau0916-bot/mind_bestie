import { describe, expect, it } from "vitest";
import { buildOpenRouterSystemPrompt, containsTechHallucination, refineOpenRouterReply } from "@/lib/chat-personas";

describe("Tech hallucination guardrails", () => {
  it("detects code and UI property leaks", () => {
    expect(containsTechHallucination("試下調 .strokeStyle 同 Fonts")).toBe(true);
    expect(containsTechHallucination("今日 OT 加到好攰呀")).toBe(false);
  });

  it("embeds role-play authenticity boundary in OpenRouter prompts", () => {
    const prompt = buildOpenRouterSystemPrompt("gentle");
    expect(prompt.match(/【角色扮演真實性邊界 - CRITICAL STRICT RULES】/g)?.length).toBe(2);
    expect(prompt).toMatch(/strokeStyle|程式碼/);
  });

  it("falls back when model replies with engineering terms", () => {
    const reply = refineOpenRouterReply(
      "gentle",
      "返工好攰，集中唔到",
      "🫂 不如試下改 div className 同 .strokeStyle fonts",
    );
    expect(containsTechHallucination(reply)).toBe(false);
    expect(reply).toMatch(/攰|集中|🫂|哎呀/);
  });
});
