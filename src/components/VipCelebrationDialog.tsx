import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type VipCelebrationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VipCelebrationDialog({ open, onOpenChange }: VipCelebrationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-sm rounded-[1.75rem] border-stone-300/50 bg-gradient-to-b from-stone-100/98 via-rose-50/40 to-violet-100/45",
          "dark:border-stone-600/40 dark:from-stone-900/98 dark:via-stone-900/90 dark:to-violet-950/35",
        )}
      >
        <DialogHeader className="items-center text-center">
          <div
            className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full border border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-stone-100/80 shadow-sm dark:border-amber-500/25 dark:from-amber-950/50 dark:to-stone-800/60"
            aria-hidden
          >
            <Sparkles className="size-6 text-amber-500/90" />
          </div>
          <DialogTitle className="font-display text-xl leading-snug tracking-wide">
            🎉 恭喜您成功升級為 VIP 會員！
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">
            您已成功開通 VIP 權限，全角色無限對話已解鎖！三位 Bestie 靈魂金句卡亦已全面開放 ✨
          </DialogDescription>
        </DialogHeader>
        <Button type="button" className="w-full rounded-2xl font-medium" onClick={() => onOpenChange(false)}>
          開始傾訴
        </Button>
      </DialogContent>
    </Dialog>
  );
}
