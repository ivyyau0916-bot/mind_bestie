import { describe, expect, it } from "vitest";
import {
  buildOpenRouterSystemPrompt,
  chooseReplyPlan,
  containsSimplifiedChinese,
  createPersonaReply,
  detectReplyLocale,
  LAUNCH_SCENARIO_MESSAGES,
  matchesHongKongColloquial,
  matchesPersonaVoice,
  PERSONAS,
  refineOpenRouterReply,
  type PersonaId,
} from "@/lib/chat-personas";

const ALL_MESSAGES = Object.values(LAUNCH_SCENARIO_MESSAGES).flat();
const UNNATURAL = /你咁累|累咗|闺蜜|閨蜜/;

function emojiCount(text: string) {
  return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text))
    .filter(({ segment }) => /\p{Extended_Pictographic}/u.test(segment)).length;
}

describe("Launch system prompts", () => {
  it.each(PERSONAS)("embeds Hong Kong rules and persona vocabulary for $id", ({ id }) => {
    const prompt = buildOpenRouterSystemPrompt(id);
    expect(prompt).toMatch(/100% 香港網絡廣東話口語/);
    expect(prompt.match(/【絕對語言與字體硬性規範 - CRITICAL STRICT RULE】/g)?.length).toBe(2);
    expect(prompt).toMatch(/1–3 句/);
    expect(prompt).toMatch(/30–80 字/);
    expect(prompt).toMatch(/【真人對話硬性法則/);
    expect(prompt).toMatch(/【角色扮演真實性邊界/);
    if (id === "gentle") expect(prompt).toMatch(/哎呀|🫂|陪住你/);
    if (id === "fierce") expect(prompt).toMatch(/下！|過份|撐你|底線|破局/);
    if (id === "wise") expect(prompt).toMatch(/釐清|優先|試下|下一步/);
  });
});

describe("Launch scenario matrix (3 personas × 18 messages)", () => {
  it.each(PERSONAS.flatMap((persona) => ALL_MESSAGES.map((message) => [persona.id, message] as const)))(
    "%s replies in HK voice for: %s",
    (personaId, message) => {
      expect(detectReplyLocale(message)).toBe("zh-HK");
      const plan = chooseReplyPlan(personaId, message);
      expect(plan.crisis).toBe(false);

      const reply = createPersonaReply(personaId, message);
      expect(containsSimplifiedChinese(reply)).toBe(false);
      expect(reply).not.toMatch(UNNATURAL);
      expect(matchesHongKongColloquial(reply)).toBe(true);
      expect(matchesPersonaVoice(personaId, reply)).toBe(true);

      const emojis = emojiCount(reply);
      expect(emojis).toBeGreaterThanOrEqual(1);
      expect(emojis).toBeLessThanOrEqual(4);
      expect(reply.trim().length).toBeGreaterThan(0);
    },
  );

  it.each(PERSONAS.flatMap((persona) => ALL_MESSAGES.map((message) => [persona.id, message] as const)))(
    "refineOpenRouterReply keeps %s voice when model drifts (%s)",
    (personaId, message) => {
      const badModel = personaId === "gentle" ? "你咁累咗，我觉得好疲劳" : personaId === "fierce" ? "嗯，我明白你的感受" : "下！咁無恥都有嘅";
      const reply = refineOpenRouterReply(personaId as PersonaId, message, badModel);
      expect(matchesPersonaVoice(personaId as PersonaId, reply)).toBe(true);
      expect(reply).not.toMatch(UNNATURAL);
    },
  );
});
