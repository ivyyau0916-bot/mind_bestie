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
        className="max-w-sm rounded-3xl border-stone-200/70 bg-gradient-to-b from-violet-50/95 via-stone-50/95 to-rose-50/80 dark:border-stone-600/40 dark:from-violet-950/50 dark:via-stone-950/90 dark:to-rose-950/30"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <DailyCardInspirationMark className="mx-auto size-10 text-violet-400/90 dark:text-violet-300/80" />
          <DialogTitle className="font-display text-xl tracking-wide">歡迎來到心事 Bestie</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            請問我可以點樣稱呼你？Bestie 會用你嘅名字，陪你傾訴、抽卡同微光打卡。
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
