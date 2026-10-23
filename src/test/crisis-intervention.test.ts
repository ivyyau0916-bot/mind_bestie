import { describe, expect, it, vi } from "vitest";
import { chooseReplyPlan, createPersonaReply, buildOpenRouterSystemPrompt } from "@/lib/chat-personas";
import { CRISIS_SAFE_REPLY_HK, detectUserCrisis, getCrisisSafeReply } from "@/lib/crisis-intervention";
import { fetchOpenRouterReplyWithResilience } from "@/lib/openrouter-chat";

describe("Crisis intervention", () => {
  it("detects explicit suicide-related keywords", () => {
    expect(detectUserCrisis("我好累，想跳樓結束生命")).toBe(true);
    expect(detectUserCrisis("今日真係好攰")).toBe(false);
  });

  it("returns Hong Kong helpline safe reply", () => {
    expect(getCrisisSafeReply()).toBe(CRISIS_SAFE_REPLY_HK);
    expect(getCrisisSafeReply()).toMatch(/2389 2222/);
    expect(getCrisisSafeReply()).toMatch(/999/);
  });

  it.each(["gentle", "fierce", "wise"] as const)("skips persona tone for %s on crisis", (persona) => {
    const text = "我好累，想跳樓結束生命";
    expect(chooseReplyPlan(persona, text).crisis).toBe(true);
    expect(createPersonaReply(persona, text)).toBe(CRISIS_SAFE_REPLY_HK);
  });

  it("embeds safety rule in all system prompts", () => {
    expect(buildOpenRouterSystemPrompt("gentle")).toMatch(/自殺、自殘或放棄生命/);
    expect(buildOpenRouterSystemPrompt("fierce")).toMatch(/絕對不可以給予任何輔助自殘/);
  });

  it("does not call OpenRouter when crisis is detected", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("should not fetch"));
    const result = await fetchOpenRouterReplyWithResilience({
      persona: "gentle",
      messages: [{ role: "user", content: "我好累，想跳樓結束生命" }],
    });
    expect(result.text).toMatch(/撒瑪利亞防止自殺會/);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
