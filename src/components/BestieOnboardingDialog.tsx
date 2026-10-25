import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DailyCardInspirationMark } from "@/components/daily-card/DailyCardVisuals";
import { normalizeUserName } from "@/lib/bestie-account";

type BestieOnboardingDialogProps = {
  onComplete: (name: string) => void;
};

export function BestieOnboardingDialog({ onComplete }: BestieOnboardingDialogProps) {
  const [name, setName] = useState("");

  const submit = () => {
    const normalized = normalizeUserName(name);
    if (!normalized) return;
    onComplete(normalized);
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[min(92dvh,640px)] max-w-sm overflow-y-auto rounded-3xl border-stone-200/70 bg-gradient-to-b from-violet-50/95 via-stone-50/95 to-rose-50/80 dark:border-stone-600/40 dark:from-violet-950/50 dark:via-stone-950/90 dark:to-rose-950/30"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <DailyCardInspirationMark className="mx-auto size-10 text-violet-400/90 dark:text-violet-300/80" />
          <DialogTitle className="font-display text-xl tracking-wide">歡迎來到心事 Bestie</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-left text-sm leading-relaxed text-muted-foreground">
              <p>
                你好呀 🫂 我哋會記住你嘅名字，陪你傾訴、抽靈魂卡同微光打卡。開始之前，想同你講清楚權限同試用安排：
              </p>
              <div className="rounded-2xl border border-violet-200/50 bg-white/50 px-3 py-2.5 dark:border-violet-500/20 dark:bg-stone-900/35">
                <p className="text-[13px] font-medium text-stone-800 dark:text-stone-100">
                  前 3 日 · 完整試用 ✨
                </p>
                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[13px]">
                  <li>溫柔、毒舌、理智三位 Bestie 全部解鎖</li>
                  <li>每日 20 次 AI 傾訴額度</li>
                  <li>每位 Bestie 每日可各抽卡一次</li>
                </ul>
              </div>
              <p className="text-[13px]">
                試用期結束後，免費版可永久使用「溫柔」同基礎功能；升級{" "}
                <span className="font-medium text-stone-700 dark:text-stone-200">VIP</span>{" "}
                則解鎖全部角色、無限傾訴同完整抽卡權限。
              </p>
              <p className="text-center text-sm font-medium text-stone-800 dark:text-stone-100">
                請問我可以點樣稱呼你？
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：阿樂、Ming、小魚…"
          className="rounded-2xl border-stone-200/70 bg-white/70 text-center dark:border-stone-600/40 dark:bg-stone-900/40"
          maxLength={16}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          autoFocus
        />
        <Button
          className="w-full rounded-2xl bg-gradient-to-r from-violet-500/90 to-rose-400/90"
          disabled={!normalizeUserName(name)}
          onClick={submit}
        >
          開始我們的旅程
        </Button>
      </DialogContent>
    </Dialog>
  );
}
