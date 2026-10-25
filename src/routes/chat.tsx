import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMood } from "@/lib/mood-store";
import { useBestieAuth } from "@/lib/bestie-auth-context";
import { canAccessCharacter, getRemainingChatCount, incrementChatCount, CharacterId } from "@/lib/trial-limits";
import { PersonaTrialExhaustedDialog } from "@/components/PersonaTrialExhaustedDialog";
import { VipUnlockDialog } from "@/components/VipUnlockDialog";

export const Route = createFileRoute("/chat")({
  component: ChatRoute,
});

function ChatRoute() {
  const { currentPersona, messages, sendMessage, isReplying, replyError } = useMood();
  const { isVip, user } = useBestieAuth();

  const [text, setText] = useState("");
  const [vipOpen, setVipOpen] = useState(false);
  const [trialExhaustedOpen, setTrialExhaustedOpen] = useState(false);
  const [trialDialogPersona, setTrialDialogPersona] = useState<"wise" | "fierce">("fierce");
  const endRef = useRef<HTMLDivElement>(null);

  // 對應角色 ID (fierce -> sarcastic 毒舌, wise -> rational 理智, 其他 -> gentle 溫柔)
  const characterId: CharacterId = 
    currentPersona === "fierce" ? "sarcastic" : 
    currentPersona === "wise" ? "rational" : "gentle";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isReplying]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isReplying) return;

    // 1. 檢查角色訪問權限 (3天試用期與VIP檢查)
    const access = canAccessCharacter(characterId, isVip, user?.created_at);
    if (!access.allowed) {
      setTrialDialogPersona(currentPersona === "wise" ? "wise" : "fierce");
      setTrialExhaustedOpen(true);
      return;
    }

    // 2. 檢查每日 20 次發送上限
    const remaining = getRemainingChatCount(characterId, isVip);
    if (remaining <= 0) {
      alert(`您今天與此角色的 20 次傾訴額度已用完囉！明天將自動重置。`);
      return;
    }

    // 3. 正常發送訊息
    const messageText = text.trim();
    setText("");
    sendMessage(messageText);

    // 4. 記錄發送次數 +1
    incrementChatCount(characterId, isVip);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div className={cn(
              "max-w-[80%] rounded-2xl p-3 text-sm",
              m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            )}>
              {m.content}
            </div>
          </div>
        ))}
        {isReplying && (
          <div className="text-xs text-muted-foreground animate-pulse">Bestie 正在思考中...</div>
        )}
        <div ref={endRef} />
      </div>

      <footer className="shrink-0 p-3 border-t">
        {replyError && (
          <p className="mb-2 text-xs text-destructive">{replyError}</p>
        )}
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="輸入聊天訊息..."
            className="flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="submit" size="icon" className="rounded-full" disabled={!text.trim() || isReplying}>
            <Send className="size-4" />
          </Button>
        </form>
      </footer>

      <PersonaTrialExhaustedDialog
        open={trialExhaustedOpen}
        persona={trialDialogPersona}
        onOpenChange={setTrialExhaustedOpen}
      />
      <VipUnlockDialog open={vipOpen} onOpenChange={setVipOpen} />
    </div>
  );
}
