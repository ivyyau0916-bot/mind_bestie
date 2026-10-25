import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { chooseReplyPlan, createPersonaHandoff, createPersonaReply, getPersona, isPersonaId, refineOpenRouterReply, WELCOME_TEXT, type PersonaId } from "@/lib/chat-personas";
import { detectUserCrisis, getCrisisSafeReply } from "@/lib/crisis-intervention";
import {
  canSendChatAsFreeUser,
  getPersonaDailyChatCount,
  isPersonaChatUnlocked,
  recordFreeChatSend,
  remainingFreeChatsForPersona,
  resetDailyChatIfNeeded,
} from "@/lib/freemium";
import { readPersistedAuthUser } from "@/lib/supabase-auth-callback";
import { isInRegistrationTrial } from "@/lib/trial-limits";
import {
  activateVipMembership,
  clearVipMembership,
  processStripeCheckoutReturn,
  readStoredIsVip,
  readVipStartDate,
} from "@/lib/vip-subscription";
import { getUserName } from "@/lib/bestie-account";
import {
  buildOpenRouterContextFromChat,
  fetchOpenRouterReply,
  isOpenRouterRateLimitMessage,
  OPENROUTER_HISTORY_MAX_TURNS,
} from "@/lib/openrouter-chat";

export type Weather = "sunny" | "cloudy" | "rainy" | "storm";
export type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  time: number;
  persona?: PersonaId;
  crisis?: boolean;
  /** One-shot UI: WhatsApp-style fade-in for a freshly arrived AI bubble. */
  reveal?: boolean;
};
export type MoodEntry = { date: string; score: number; tags: string[] };

export function scoreToWeather(score: number): Weather {
  if (score >= 8) return "sunny";
  if (score >= 6) return "cloudy";
  if (score >= 3) return "rainy";
  return "storm";
}

export const WEATHER_LABEL: Record<Weather, string> = {
  sunny: "晴朗",
  cloudy: "多雲",
  rainy: "下雨",
  storm: "雷暴",
};

export const QUOTES: Record<Weather, string[]> = {
  sunny: ["今天的陽光，是你努力生活的回報。好好收藏這份溫暖。", "快樂不必盛大，此刻的輕鬆就值得珍惜。"],
  cloudy: ["雲層再厚，陽光也一直都在上面。", "平淡的日子，也是一種溫柔的休息。"],
  rainy: ["雨水會讓土壤變得柔軟，讓新的東西發芽。", "允許自己難過，是照顧自己的第一步。"],
  storm: ["暴風雨不會永遠停留，你已經撐過了最難的部分。", "你不需要一個人面對，求助是勇敢的表現。"],
};

export function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STRESSORS = ["工作", "人際關係", "家庭", "睡眠", "學業", "健康", "金錢", "孤獨"];

export function detectTags(text: string): string[] {
  const map: Record<string, string[]> = {
    工作: ["工作", "老闆", "上司", "加班", "同事", "公司", "返工"],
    人際關係: ["朋友", "男朋友", "女朋友", "伴侶", "分手", "吵架"],
    家庭: ["媽", "爸", "家人", "家庭", "屋企"],
    睡眠: ["失眠", "瞓", "睡", "攰", "累"],
    學業: ["考試", "功課", "學校", "論文"],
    健康: ["病", "痛", "身體"],
    金錢: ["錢", "租", "債", "人工"],
    孤獨: ["孤單", "寂寞", "一個人", "孤獨"],
  };
  return Object.entries(map)
    .filter(([, kws]) => kws.some((k) => text.includes(k)))
    .map(([t]) => t);
}

function seedEntries(): MoodEntry[] {
  const today = new Date();
  const scores = [6, 4, 7, 8, 3, 5, 7, 9, 2, 6, 7, 5, 8, 6];
  return scores.map((s, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (scores.length - i));
    return { date: toKey(d), score: s, tags: [...new Set([STRESSORS[i % 4] ?? "工作", STRESSORS[(i * 3) % 8] ?? "工作"])] };
  });
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "ai",
  text: WELCOME_TEXT,
  time: 0,
  persona: "gentle",
};

export type SendMessageResult = { ok: true } | { ok: false; reason: "quota" | "trial" };

type Store = {
  messages: ChatMessage[];
  entries: MoodEntry[];
  theme: "dark" | "light";
  persona: PersonaId;
  isVip: boolean;
  vipStartDate: string | null;
  setIsVip: (vip: boolean) => void;
  dailyChatCount: number;
  freeChatsRemaining: number;
  /** Bumps when trial counters change so UI can refresh remaining trial messages. */
  trialUsageRevision: number;
  setPersona: (persona: PersonaId) => boolean;
  isReplying: boolean;
  replyError: string | null;
  sendMessage: (text: string) => SendMessageResult;
  finishDay: (score: number) => MoodEntry;
  setTheme: (t: "dark" | "light") => void;
  clearChat: () => void;
  clearAll: () => void;
};

const Ctx = createContext<Store | null>(null);
const KEY = "mood-weather-v1";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String((error as { message: unknown }).message);
  return typeof error === "string" ? error : "";
}

export function MoodProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [theme, setThemeState] = useState<"dark" | "light">("light");
  const [loaded, setLoaded] = useState(false);
  const [persona, setPersonaState] = useState<PersonaId>("gentle");
  const [isVip, setIsVipState] = useState(false);
  const [vipStartDate, setVipStartDate] = useState<string | null>(null);
  const [dailyChatCount, setDailyChatCount] = useState(0);
  const [trialUsageRevision, setTrialUsageRevision] = useState(0);
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const replyRequest = useRef(0);
  const personaRef = useRef<PersonaId>(persona);
  const isVipRef = useRef(isVip);

  const syncUsage = (vip: boolean, activePersona: PersonaId = personaRef.current) => {
    resetDailyChatIfNeeded();
    const createdAt = readPersistedAuthUser()?.created_at;
    setDailyChatCount(getPersonaDailyChatCount(activePersona));
    return remainingFreeChatsForPersona(activePersona, vip, createdAt);
  };

  useEffect(() => {
    processStripeCheckoutReturn();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setMessages(d.messages?.length ? d.messages : [WELCOME]);
        setEntries(d.entries ?? []);
        setThemeState(d.theme ?? "light");
        const vip = Boolean(d.isVip) || readStoredIsVip();
        isVipRef.current = vip;
        setIsVipState(vip);
        setVipStartDate(vip ? readVipStartDate() : null);
        if (vip && !readStoredIsVip()) activateVipMembership();
        let nextPersona = isPersonaId(d.persona) ? d.persona : "gentle";
        const createdAt = readPersistedAuthUser()?.created_at;
        if (!isPersonaChatUnlocked(nextPersona, vip, createdAt)) nextPersona = "gentle";
        personaRef.current = nextPersona;
        setPersonaState(nextPersona);
      } else {
        setEntries(seedEntries());
        const vip = readStoredIsVip();
        if (vip) {
          isVipRef.current = true;
          setIsVipState(true);
          setVipStartDate(readVipStartDate());
        }
      }
    } catch {
      setEntries(seedEntries());
    }
    syncUsage(isVipRef.current);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const persistedMessages = messages.map(({ reveal: _reveal, ...message }) => message);
    localStorage.setItem(
      KEY,
      JSON.stringify({
        messages: persistedMessages,
        entries,
        theme,
        persona,
        isVip,
        vipStartDate: isVip ? readVipStartDate() : null,
      }),
    );
  }, [messages, entries, theme, persona, isVip, loaded]);


  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setIsVip = (vip: boolean) => {
    isVipRef.current = vip;
    setIsVipState(vip);
    if (vip) {
      const start = activateVipMembership();
      setVipStartDate(start);
    } else {
      clearVipMembership();
      setVipStartDate(null);
    }
    syncUsage(vip);
  };

  const sendMessage = (text: string): SendMessageResult => {
    const trimmed = text.trim();
    if (!trimmed || isReplying) return { ok: true };
    const isCrisis = detectUserCrisis(trimmed);
    const vip = isVipRef.current;
    const activePersona = personaRef.current;
    const createdAt = readPersistedAuthUser()?.created_at;
    if (!isCrisis && !vip && !canSendChatAsFreeUser(activePersona, createdAt)) {
      const inTrial = isInRegistrationTrial(false, createdAt);
      const usesDailyPool = inTrial || activePersona === "gentle";
      return { ok: false, reason: usesDailyPool ? "quota" : "trial" };
    }
    if (!isCrisis && !vip) {
      recordFreeChatSend(activePersona, createdAt);
      syncUsage(vip, activePersona);
      if (!isInRegistrationTrial(false, createdAt) && activePersona !== "gentle") {
        setTrialUsageRevision((v) => v + 1);
      }
    }
    const now = Date.now();
    const requestId = ++replyRequest.current;
    setReplyError(null);
    setMessages((m) => [...m, { id: `u${now}`, role: "user", text: trimmed, time: now }]);
    setIsReplying(true);

    void (async () => {
      const replyPersona = personaRef.current;
      const snapshot = [
        ...messages,
        { id: `u${now}`, role: "user" as const, text: trimmed, time: now },
      ];
      const userMessages = snapshot.filter((message) => message.role === "user");
      const last = userMessages.at(-1)?.text ?? trimmed;
      const previous = userMessages.at(-2)?.text ?? "";
      const plan = chooseReplyPlan(replyPersona, last, previous);
      const turn = Math.max(userMessages.length - 1, 0);

      const appendAiReply = (reply: string, crisisFlag: boolean) => {
        if (requestId !== replyRequest.current) return;
        setMessages((m) => [
          ...m,
          {
            id: `a${Date.now()}`,
            role: "ai",
            text: reply,
            time: Date.now(),
            persona: replyPersona,
            crisis: crisisFlag || undefined,
            reveal: true,
          },
        ]);
      };

      try {
        let reply: string;
        if (isCrisis || plan.crisis) {
          reply = getCrisisSafeReply();
          appendAiReply(reply, true);
        } else {
          const { recentMessages } = buildOpenRouterContextFromChat(snapshot, replyPersona);
          let history = recentMessages;
          if (!history.some((message) => message.role === "user" && message.content === last)) {
            history = [...history, { role: "user", content: last }].slice(-OPENROUTER_HISTORY_MAX_TURNS);
          }
          const payload = {
            persona: replyPersona,
            messages: history,
            userName: getUserName(),
          };
          const { text: modelReply } = await fetchOpenRouterReply({ data: payload });
          reply = refineOpenRouterReply(replyPersona, last, modelReply, previous, turn);
          appendAiReply(reply, false);
        }
      } catch (error) {
        if (requestId !== replyRequest.current) return;
        const detail = getErrorMessage(error);
        const rateLimited = isOpenRouterRateLimitMessage(detail);
        if (rateLimited && !plan.crisis) {
          const fallbackReply = createPersonaReply(replyPersona, last, previous, turn);
          appendAiReply(fallbackReply, false);
          setReplyError("而家 AI 通道有啲逼（429），已自動重試並改用 Bestie 離線陪伴回覆。等 1–2 分鐘再試線上 AI ✨");
          return;
        }
        setReplyError(
          detail
            ? `哎呀，傾計暫時失敗 😣 ${detail}`
            : "哎呀，訊息暫時送唔到出去 😣 請檢查網絡同 API 設定，或者等一陣再試。",
        );
      } finally {
        if (requestId === replyRequest.current) setIsReplying(false);
      }
    })();
    return { ok: true };
  };

  const setPersona = (next: PersonaId) => {
    if (next === personaRef.current) return true;
    const createdAt = readPersistedAuthUser()?.created_at;
    if (!isPersonaChatUnlocked(next, isVipRef.current, createdAt)) return false;
    personaRef.current = next;
    setPersonaState(next);
    syncUsage(isVipRef.current, next);
    // Keep old bubbles; only swap the untouched welcome, otherwise drop in a live handoff in the new voice.
    setMessages((current) => {
      if (current.length === 1 && current[0]?.role === "ai" && current[0]?.time === 0) {
        return [{ ...WELCOME, persona: next, text: getPersona(next).greeting }];
      }
      const last = current.at(-1);
      if (last?.role === "ai" && last.persona === next) return current;
      return [...current, { id: `h${Date.now()}`, role: "ai", text: createPersonaHandoff(next), time: Date.now(), persona: next }];
    });
    return true;
  };

  const cancelReply = () => {
    replyRequest.current += 1;
    setIsReplying(false);
    setReplyError(null);
  };

  const finishDay = (score: number) => {
    cancelReply();
    const userText = messages.filter((m) => m.role === "user").map((m) => m.text).join(" ");
    const entry: MoodEntry = { date: toKey(new Date()), score, tags: detectTags(userText) };
    setEntries((e) => [...e.filter((x) => x.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date)));
    setMessages([{ ...WELCOME, id: `w${Date.now()}`, time: Date.now(), persona, text: "今日嘅傾訴已經記低咗喇 ✨ 聽日想再傾，我隨時都喺度 💛" }]);
    return entry;
  };

  /** Reset chat bubbles only; does not change daily_chat_count or mood entries. */
  const clearChat = () => {
    cancelReply();
    const id = personaRef.current;
    setMessages([
      {
        ...WELCOME,
        id: `w${Date.now()}`,
        time: Date.now(),
        persona: id,
        text: getPersona(id).greeting,
      },
    ]);
  };

  /** Privacy reset: chat + mood journal + theme/persona; keeps VIP and freemium usage counters. */
  const clearAll = () => {
    cancelReply();
    personaRef.current = "gentle";
    setPersonaState("gentle");
    setThemeState("light");
    setMessages([{ ...WELCOME, persona: "gentle", text: getPersona("gentle").greeting }]);
    setEntries([]);
    syncUsage(isVipRef.current, "gentle");
  };

  return (
    <Ctx.Provider
      value={{
        messages,
        entries,
        theme,
        persona,
        isVip,
        vipStartDate,
        setIsVip,
        dailyChatCount,
        freeChatsRemaining: remainingFreeChatsForPersona(
          persona,
          isVip,
          readPersistedAuthUser()?.created_at,
        ),
        trialUsageRevision,
        setPersona,
        isReplying,
        replyError,
        sendMessage,
        finishDay,
        setTheme: setThemeState,
        clearChat,
        clearAll,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useMood() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useMood must be inside MoodProvider");
  return c;
}
