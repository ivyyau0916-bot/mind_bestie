import { describe, expect, it } from "vitest";
import { buildOpenRouterSystemPrompt, containsSimplifiedChinese, refineOpenRouterReply } from "@/lib/chat-personas";
import {
  CANTONESE_CHARACTER_USAGE_RULE,
  fixCantoneseOrthography,
  HK_CANTONESE_ORTHography_RULE,
  HK_TRADITIONAL_STRICT_RULE,
  normalizeToHongKongTraditional,
} from "@/lib/hk-traditional";

describe("Hong Kong traditional normalization", () => {
  it("converts common simplified characters via OpenCC S2HK", () => {
    const out = normalizeToHongKongTraditional("我觉得这个问题很难，怎么办");
    expect(out).toMatch(/覺得/);
    expect(out).toMatch(/這個/);
    expect(out).toMatch(/怎麼/);
    expect(containsSimplifiedChinese(out)).toBe(false);
  });

  it("leaves English-only text unchanged", () => {
    expect(normalizeToHongKongTraditional("Hey, take a breath.")).toBe("Hey, take a breath.");
  });

  it("embeds strict language rule at top and bottom of OpenRouter prompts", () => {
    const prompt = buildOpenRouterSystemPrompt("gentle");
    const matches = prompt.match(/【絕對語言與字體硬性規範 - CRITICAL STRICT RULE】/g);
    expect(matches?.length).toBe(2);
    expect(prompt.startsWith(HK_TRADITIONAL_STRICT_RULE.slice(0, 20))).toBe(false);
    expect(prompt).toContain(HK_TRADITIONAL_STRICT_RULE);
    expect(prompt).toContain(HK_CANTONESE_ORTHography_RULE);
    expect(prompt).toContain(CANTONESE_CHARACTER_USAGE_RULE);
    expect(prompt).toMatch(/問嚇.*問吓/);
    expect(prompt).toMatch(/識吓新朋友/);
    expect(prompt.endsWith(HK_TRADITIONAL_STRICT_RULE.trim())).toBe(true);
  });

  it("fixes common Cantonese typos in display text", () => {
    expect(fixCantoneseOrthography("你想問嚇咩呀？你既心情点解甘样？")).toBe(
      "你想問吓咩呀？你嘅心情点解咁樣？",
    );
    expect(refineOpenRouterReply("gentle", "今日好攰", "你想問嚇我咩？")).toMatch(/問吓/);
    expect(fixCantoneseOrthography("試嚇先，等嚇我")).toBe("試吓先，等吓我");
    expect(fixCantoneseOrthography("嚇！真係離譜")).toBe("下！真係離譜");
  });

  it("normalizes on-model replies before persona checks (multi-turn drift)", () => {
    const model =
      "🫂 抱抱你呀～听你说今天加班好辛苦，记得食返餐好嘅，抖下先啦？";
    const reply = refineOpenRouterReply("gentle", "今日老細又叫我加班，真係頂唔順！", model);
    expect(containsSimplifiedChinese(reply)).toBe(false);
    expect(reply).toMatch(/抱抱你呀/);
  });
});
