import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { activeSystemPrompt, buildOpenRouterSystemPrompt, chooseReplyPlan, createPersonaHandoff, createPersonaReply, detectReplyLocale, isPersonaId, personaStatusLine, PERSONAS, refineOpenRouterReply, WELCOME_TEXT, type ReplyLocale } from "@/lib/chat-personas";
import { detectUserCrisis } from "@/lib/crisis-intervention";
import { MoodProvider, useMood } from "@/lib/mood-store";

vi.mock("@/lib/openrouter-chat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/openrouter-chat")>();
  return {
    ...actual,
    fetchOpenRouterReply: vi.fn(async () => ({ text: "講真，今日真係辛苦晒你 🫂 想唔想講多啲？💛" })),
  };
});

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Persona rules", () => {
  it("offers the three requested personas", () => {
    expect(PERSONAS.map((persona) => persona.id)).toEqual(["gentle", "fierce", "wise"]);
    expect(isPersonaId("unknown")).toBe(false);
  });
  it.each(["gentle", "fierce"] as const)("does not give unsolicited advice as %s", (persona) => {
    expect(chooseReplyPlan(persona, "請給我建議，怎麼辦？").adviceRequested).toBe(false);
  });
  it("allows practical advice from the wise persona on work topics", () => {
    expect(chooseReplyPlan("wise", "今天工作好累").adviceRequested).toBe(true);
    expect(chooseReplyPlan("wise", "請給我建議").adviceRequested).toBe(true);
    expect(chooseReplyPlan("gentle", "今天工作好累").adviceRequested).toBe(false);
  });
  it("preserves conversational topic on a short follow-up", () => {
    expect(chooseReplyPlan("gentle", "他後來又說了一句", "老闆讓我加班").topic).toBe("work");
  });
  it.each(["gentle", "fierce", "wise"] as const)("prioritizes crisis support over %s", (persona) => {
    expect(chooseReplyPlan(persona, "我想傷害自己").crisis).toBe(true);
  });
  it("does not celebrate a negated success as good news", () => {
    expect(chooseReplyPlan("gentle", "考試不成功").topic).toBe("general");
    expect(chooseReplyPlan("gentle", "这次没有成功").topic).toBe("general");
    expect(chooseReplyPlan("gentle", "I have not succeeded").topic).toBe("general");
    expect(chooseReplyPlan("gentle", "我成功了").topic).toBe("good");
  });
});

const localeExamples: [string, ReplyLocale][] = [
  ...["老細", "甩鍋", "頂唔順", "好累", "痴線", "真係"].map((text): [string, ReplyLocale] => [text, "zh-HK"]),
  ...["真的", "傻眼", "傻瓜", "傻爆眼", "傻眼貓咪", "主管", "加班"].map((text): [string, ReplyLocale] => [text, "zh-TW"]),
  ["幾幾下", "yue-MY"], ["做乜嘢", "yue-MY"], ["walao", "zh-MY"], ["jio", "zh-MY"],
  ["心情低落，想找人聊聊", "zh-Hant"], ["这件事让我很难受", "zh-Hans"], ["My boss is making me miserable", "en"],
];

describe("Language and localization rules", () => {
  it.each(localeExamples)("matches latest input %s to %s", (text, locale) => {
    expect(detectReplyLocale(text)).toBe(locale);
  });
  it("prioritizes distinct regional markers over shared vocabulary", () => {
    expect(detectReplyLocale("老細逼我加班，好累")).toBe("zh-HK");
    expect(detectReplyLocale("主管又要加班，真的好累")).toBe("zh-TW");
    expect(detectReplyLocale("walao 老細今日又做乜嘢")).toBe("yue-MY");
  });
  it("uses history for topic but never for language", () => {
    expect(chooseReplyPlan("gentle", "That really hurt", "老細真係痴線")).toMatchObject({ locale: "en", topic: "work" });
    expect(chooseReplyPlan("gentle", "真的傻眼", "My boss upset me")).toMatchObject({ locale: "zh-TW", topic: "work" });
    expect(chooseReplyPlan("gentle", "I feel lonely", "老細真係痴線").topic).toBe("lonely");
  });
  const emojiCount = (text: string) => Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text))
    .filter(({ segment }) => /\p{Extended_Pictographic}/u.test(segment)).length;
  it.each(PERSONAS)("uses 1–4 emotional emoji for every localized $id reply", ({ id }) => {
    for (const [text] of localeExamples) {
      for (const input of [text, `${text} advice 建議`, `${text} 自殺`, `${text} happy`, `${text} lonely`]) {
        if (detectUserCrisis(input)) continue;
        const count = emojiCount(createPersonaReply(id, input));
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(4);
      }
    }
  });
  it.each(PERSONAS)("keeps $id Hong Kong replies in Cantonese", ({ id }) => {
    const reply = createPersonaReply(id, "老細真係痴線，點算？");
    expect(reply).toMatch(/佢|嘅|啲|唔/);
    expect(reply).toMatch(/講真|頂唔順|痴線|嗯|睇嚟|機械人|睇唔過眼|慢慢講得|🫂|哎呀|優先|聽日|集中/);
    expect(reply).not.toMatch(/我們|這件事|主管|傻眼|jio|lah/);
  });
  it("switches system prompt and handoff voice immediately", () => {
    expect(activeSystemPrompt("fierce")).toMatch(/毒舌戰友/);
    expect(activeSystemPrompt("fierce")).not.toEqual(activeSystemPrompt("gentle"));
    expect(buildOpenRouterSystemPrompt("fierce")).toMatch(/100% 香港網絡廣東話口語/);
    expect(buildOpenRouterSystemPrompt("gentle")).toMatch(/【粵語用字規範】/);
    expect(buildOpenRouterSystemPrompt("wise")).toMatch(/【粵語用字規範】/);
    expect(buildOpenRouterSystemPrompt("gentle")).toMatch(/情緒接納|微小下一步/);
    expect(buildOpenRouterSystemPrompt("fierce")).toMatch(/毒舌戰友|一針見血|戀愛腦/);
    expect(buildOpenRouterSystemPrompt("fierce")).toMatch(/底線|停損|打抱不平/);
    expect(buildOpenRouterSystemPrompt("wise")).toMatch(/Pro\/Con|兩步走|可控/);
    expect(buildOpenRouterSystemPrompt("gentle")).toMatch(/全角色共通/);
    expect(buildOpenRouterSystemPrompt("wise")).toMatch(/理性 Bestie/);
    expect(buildOpenRouterSystemPrompt("gentle")).toMatch(/打卡|解壓|走心|給力/);
    expect(buildOpenRouterSystemPrompt("gentle", "", "阿樂")).toMatch(/阿樂/);
    expect(buildOpenRouterSystemPrompt("gentle")).toMatch(/搞到咁攰/);
    expect(refineOpenRouterReply("gentle", "返工好攰", "你咁累咗呀")).toMatch(/搞到咁攰|🫂|哎呀/);
    expect(buildOpenRouterSystemPrompt("fierce")).toMatch(/下！|下？/);
    expect(buildOpenRouterSystemPrompt("gentle", "今日老細又叫我加班，真係頂唔順！")).toMatch(/今次訊息/);
    expect(refineOpenRouterReply("gentle", "今日老細又叫我加班，真係頂唔順！", "相关新闻显示长期加班")).toMatch(/🫂|哎呀|OT/);
    expect(refineOpenRouterReply("fierce", "今日老細又叫我加班，真係頂唔順！", "听大姐讲")).toMatch(/下！|下？|機械人|睇唔過眼/);
    expect(refineOpenRouterReply("wise", "今日老細又叫我加班，真係頂唔順！", "下！佢咁無恥")).toMatch(/優先|OT|試下|集中/);
    expect(refineOpenRouterReply("gentle", "今日老細又叫我加班，真係頂唔順！", "我觉得你能力好强")).toMatch(/🫂|哎呀|頂唔順/);
    expect(createPersonaHandoff("fierce")).toMatch(/戰友毒舌 Bestie/);
    expect(createPersonaHandoff("fierce")).toMatch(/🔥|😤/);
  });
  it("keeps English advice and crisis support in English", () => {
    expect(chooseReplyPlan("wise", "My boss is unfair. What should I do?").adviceRequested).toBe(true);
    expect(createPersonaReply("wise", "My boss is unfair. What should I do?")).not.toMatch(/\p{Script=Han}/u);
    expect(chooseReplyPlan("fierce", "I want to kill myself").crisis).toBe(true);
    expect(createPersonaReply("fierce", "I want to kill myself")).toMatch(/2389 2222|撒瑪利亞/);
  });
  it("recognizes simplified Chinese advice and crisis signals", () => {
    expect(chooseReplyPlan("wise", "请给我建议，怎么办？")).toMatchObject({ locale: "zh-Hans", adviceRequested: true });
    expect(chooseReplyPlan("gentle", "我想结束生命").crisis).toBe(true);
  });
});

describe("Persona store", () => {
  it("switches reply language on the next send without rewriting history", async () => {
    const { result } = renderHook(useMood, { wrapper: MoodProvider });
    act(() => result.current.sendMessage("老細真係痴線"));
    await waitFor(() => expect(result.current.isReplying).toBe(false));
    const history = result.current.messages;
    expect(history.at(-1)?.text).toMatch(/辛苦晒|講真/);
    act(() => result.current.sendMessage("I feel exhausted"));
    await waitFor(() => expect(result.current.messages.length).toBeGreaterThan(history.length));
    expect(result.current.messages.slice(0, history.length)).toEqual(history);
  });
  it("remembers the selected persona after remount", () => {
    const first = renderHook(useMood, { wrapper: MoodProvider });
    act(() => first.result.current.setIsVip(true));
    act(() => first.result.current.setPersona("fierce"));
    first.unmount();
    const second = renderHook(useMood, { wrapper: MoodProvider });
    expect(second.result.current.persona).toBe("fierce");
  });
  it("switching preserves history and applies the new persona immediately", async () => {
    const { result } = renderHook(useMood, { wrapper: MoodProvider });
    act(() => result.current.setIsVip(true));
    act(() => result.current.sendMessage("今天工作好累"));
    await waitFor(() => expect(result.current.isReplying).toBe(false));
    const existingMessages = result.current.messages;
    act(() => result.current.setPersona("wise"));
    expect(result.current.messages.slice(0, existingMessages.length)).toEqual(existingMessages);
    expect(result.current.messages.at(-1)).toMatchObject({ role: "ai", persona: "wise" });
    expect(result.current.messages.at(-1)?.text).toMatch(/理性智慧|睇清楚|🧊/);
    act(() => result.current.sendMessage("請給我建議"));
    await waitFor(() => expect(result.current.isReplying).toBe(false));
    expect(result.current.messages.at(-1)?.persona).toBe("wise");
  });
  it("clearing chat cancels pending replies", async () => {
    const { result } = renderHook(useMood, { wrapper: MoodProvider });
    act(() => result.current.sendMessage("好累"));
    act(() => result.current.clearAll());
    await waitFor(() => expect(result.current.isReplying).toBe(false));
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.isReplying).toBe(false);
  });
});