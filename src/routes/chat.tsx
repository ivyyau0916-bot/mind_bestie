import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Lock, Send } from "lucide-react";
import { PersonaTrialExhaustedDialog } from "@/components/PersonaTrialExhaustedDialog";
import { VipUnlockDialog } from "@/components/VipUnlockDialog";
import { useStripeCheckout } from "@/lib/stripe-checkout-context";
import { detectUserCrisis } from "@/lib/crisis-intervention";
import {
  canSendChatAsFreeUser,
  getTrialMessagesRemaining,
  isPersonaChatUnlocked,
  isPersonaTrialLocked,
  QUOTA_EXHAUSTED_INLINE_MESSAGE,
  TRIAL_CHAT_LIMIT_PER_PERSONA,
  usesPerPersonaDailyChatLimit,
} from "@/lib/freemium";
import { useBestieAuth } from "@/lib/bestie-auth-context";
import { canAccessCharacter, isInRegistrationTrial, personaToCharacterId } from "@/lib/trial-limits";
import { Button } from "@/components/ui/button";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPersona, isPersonaId, PERSONAS, type PersonaId } from "@/lib/chat-personas";
import { displayAiMessageText } from "@/lib/hk-traditional";
import { useMood } from "@/lib/mood-store";
import { ChatTypingIndicator } from "@/components/chat/ChatTypingIndicator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "傾訴 · 心事 Bestie" },
      { name: "description", content: "同你的專屬 Bestie 傾訴今天的感受。" },
      { property: "og:title", content: "傾訴 · 心事 Bestie" },
      { property: "og:description", content: "同你的專屬 Bestie 傾訴今天的感受。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function trialPersonaShortLabel(id: PersonaId): string {
  if (id === "fierce") return "戰友";
  if (id === "wise") return "理性";
  return "";
}

function ChatPage() {
  const {
    messages,
    sendMessage,
    persona,
    setPersona,
    isReplying,
    replyError,
    isVip,
    freeChatsRemaining,
    trialUsageRevision,
  } = useMood();
  const { user } = useBestieAuth();
  const createdAt = user?.created_at;
  const inRegistrationTrial = isInRegistrationTrial(isVip, createdAt);

  const [text, setText] = useState("");
  const [vipOpen, setVipOpen] = useState(false);
  const [trialExhaustedOpen, setTrialExhaustedOpen] = useState(false);
  const [trialDialogPersona, setTrialDialogPersona] = useState<PersonaId>("fierce");
  const endRef = useRef<HTMLDivElement>(null);
  const active = getPersona(persona);
  const goStripeCheckout = useStripeCheckout();

  const usesDailyChatPool = !isVip && usesPerPersonaDailyChatLimit(persona, createdAt);

  const trialBlocked = useMemo(() => {
    if (isVip || inRegistrationTrial) return false;
    if (persona !== "fierce" && persona !== "wise") return false;
    return isPersonaTrialLocked(persona, isVip);
  }, [isVip, inRegistrationTrial, persona, trialUsageRevision]);

  const quotaBlocked = usesDailyChatPool && !canSendChatAsFreeUser(persona, createdAt);
  const sendBlocked = trialBlocked || quotaBlocked;
  const crisisDraft = detectUserCrisis(text);
  const inputDisabled = isReplying || (sendBlocked && !crisisDraft);

  useEffect(() => {
    if (trialBlocked && (persona === "fierce" || persona === "wise")) {
      setTrialDialogPersona(persona);
      setTrialExhaustedOpen(true);
    }
  }, [trialBlocked, persona]);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "end",
    });
  }, [messages, isReplying, sendBlocked]);

  const openSubscribe = () => goStripeCheckout();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || inputDisabled) return;
    const result = sendMessage(text.trim());
    if (result.ok) {
      setText("");
      return;
    }
    if (result.reason === "trial") {
      setTrialDialogPersona(persona);
      setTrialExhaustedOpen(true);
    }
    if (result.reason === "quota") openSubscribe();
  };

  const statusLine = () => {
    if (isVip) return "VIP 無限傾訴";
    if (usesDailyChatPool) return `今日剩餘 ${freeChatsRemaining} / 20 次`;
    const left = getTrialMessagesRemaining(persona, isVip);
    return `試用剩餘 ${left} / ${TRIAL_CHAT_LIMIT_PER_PERSONA} 次`;
  };

  const inputPlaceholder = () => {
    if (trialBlocked) return "試用額度已用完，訂閱 VIP 繼續傾…";
    if (quotaBlocked) return "今日額度已用完，聽日再傾…";
    return "輸入訊息…";
  };

  return (
    <div className="bestie-chat-shell flex h-dvh min-h-0 flex-col">
      <header className="bestie-chat-header flex shrink-0 items-center gap-2 px-2 pb-2.5 pr-10 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-3 sm:pr-11">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="切換 Bestie 人設"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-1 pr-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <PersonaAvatar key={persona} personaId={persona} className="size-11 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1">
                  <span className="truncate text-[15px] font-semibold leading-tight">{active.name}</span>
                  <ChevronDown className="size-4 shrink-0 opacity-70" aria-hidden="true" />
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-online" />
                  {statusLine()}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[min(calc(100vw-1rem),20rem)] p-1">
            {PERSONAS.map((item) => {
              const chatLocked = !isPersonaChatUnlocked(item.id, isVip, createdAt);
              const accessDenied = !canAccessCharacter(
                personaToCharacterId(item.id),
                isVip,
                createdAt,
              ).allowed;
              return (
                <DropdownMenuItem
                  key={item.id}
                  className="gap-3 rounded-lg py-2.5 focus:bg-accent"
                  onSelect={() => {
                    if (!isPersonaId(item.id)) return;
                    if (chatLocked) {
                      if (accessDenied) {
                        setVipOpen(true);
                        return;
                      }
                      if (item.id === "fierce" || item.id === "wise") setTrialDialogPersona(item.id);
                      setTrialExhaustedOpen(true);
                      return;
                    }
                    setPersona(item.id);
                  }}
                >
                  <PersonaAvatar personaId={item.id} className="size-10 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-snug">
                      {item.emoji} {item.name}
                      {chatLocked && <Lock className="ml-1 inline size-3.5 opacity-70" aria-label="已鎖定" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  {persona === item.id && !chatLocked && (
                    <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div
        role="log"
        aria-label="聊天訊息"
        aria-live="polite"
        className="chat-wallpaper bestie-scroll-touch bestie-gpu-layer min-h-0 flex-1 space-y-1.5 px-2 py-3 sm:px-3"
      >
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              role={m.crisis ? "alert" : undefined}
              aria-live={m.crisis ? "assertive" : undefined}
              className={cn(
                "max-w-[92%] break-words whitespace-pre-wrap px-3 py-2.5 text-[15px] leading-snug shadow-sm",
                m.role === "user"
                  ? "bubble-outgoing rounded-2xl rounded-tr-sm shadow-sm"
                  : m.crisis
                    ? "rounded-2xl rounded-tl-sm border-2 border-rose-400/50 bg-rose-500/10 text-[14px] leading-relaxed text-slate-800 dark:text-slate-100"
                    : "bubble-incoming rounded-2xl rounded-tl-sm shadow-sm",
                m.role === "ai" && m.reveal && "chat-bubble-reveal",
              )}
            >
              {m.role === "ai" ? displayAiMessageText(m.text) : m.text}
            </div>
          </div>
        ))}
        {quotaBlocked && (
          <div
            role="status"
            className="mx-auto max-w-[92%] rounded-2xl border border-indigo-200/60 bg-white/95 px-3 py-3 text-[14px] leading-relaxed text-slate-800 shadow-sm backdrop-blur-sm max-md:backdrop-blur-none dark:border-slate-600/50 dark:bg-[#242F4D]/95 max-md:dark:bg-slate-900/92 dark:text-slate-100"
          >
            <p>{QUOTA_EXHAUSTED_INLINE_MESSAGE}</p>
            <p className="mt-2 flex flex-wrap gap-2 text-sm">
              <Link to="/daily-card" className="font-medium text-primary underline-offset-2 hover:underline">
                ☀️ 去抽卡
              </Link>
              <Link to="/relaxation" className="font-medium text-primary underline-offset-2 hover:underline">
                🌱 每日微光打卡
              </Link>
              <button
                type="button"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={openSubscribe}
              >
                ✨ 訂閱 VIP
              </button>
            </p>
          </div>
        )}
        {trialBlocked && (
          <div
            role="status"
            className="mx-auto max-w-[92%] rounded-2xl border border-stone-300/55 bg-stone-50/98 px-3 py-3 text-[14px] leading-relaxed text-stone-800 shadow-sm backdrop-blur-sm max-md:backdrop-blur-none dark:border-stone-600/45 dark:bg-stone-900/92 dark:text-stone-100"
          >
            <p>
              {trialPersonaShortLabel(persona)}試用對話已用完（{TRIAL_CHAT_LIMIT_PER_PERSONA} 次）。訂閱 VIP
              尊尚會員，解鎖全 3 位 Bestie 無限傾訴與每日靈魂金句卡片 ✨
            </p>
            <p className="mt-2">
              <button
                type="button"
                className="text-sm font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
                onClick={openSubscribe}
              >
                訂閱 VIP 尊尚會員
              </button>
            </p>
          </div>
        )}
        {isReplying && <ChatTypingIndicator />}
        <div ref={endRef} className="h-1" aria-hidden="true" />
      </div>

      <footer className="bestie-chat-footer shrink-0 px-2 pb-[max(calc(env(safe-area-inset-bottom)+4.5rem),5.25rem)] pt-2">
        {replyError && (
          <p role="alert" className="mb-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {replyError}
          </p>
        )}
        <form onSubmit={submit} className="flex items-end gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={inputPlaceholder()}
            aria-label="聊天訊息"
            disabled={inputDisabled}
            className={cn(
              "min-h-10 min-w-0 flex-1 rounded-3xl border border-indigo-100/80 bg-white/90 px-4 py-2.5 text-[15px] text-slate-800 outline-none ring-offset-background placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-400/40 dark:border-slate-600/50 dark:bg-[#242F4D]/60 dark:text-slate-100 dark:placeholder:text-slate-500",
              inputDisabled && "cursor-not-allowed opacity-60",
            )}
          />
          <Button
            type="submit"
            size="icon"
            className="size-10 shrink-0 rounded-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            aria-label="傳送"
            disabled={!text.trim() || inputDisabled}
          >
            <Send className="size-[18px]" />
          </Button>
        </form>
      </footer>

      <PersonaTrialExhaustedDialog
        open={trialExhaustedOpen}
        persona={trialDialogPersona === "wise" ? "wise" : "fierce"}
        onOpenChange={setTrialExhaustedOpen}
      />

      <VipUnlockDialog open={vipOpen} onOpenChange={setVipOpen} />
    </div>
  );
}
