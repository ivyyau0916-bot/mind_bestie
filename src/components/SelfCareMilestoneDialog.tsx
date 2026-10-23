import { Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildMilestoneShareText,
  claimMilestone,
  milestoneThankYouMessage,
  type SelfCareMilestone,
} from "@/lib/self-care-milestones";

type SelfCareMilestoneDialogProps = {
  open: boolean;
  milestone: SelfCareMilestone | null;
  userName: string | null;
  onOpenChange: (open: boolean) => void;
};

export function SelfCareMilestoneDialog({
  open,
  milestone,
  userName,
  onOpenChange,
}: SelfCareMilestoneDialogProps) {
  const [sharing, setSharing] = useState(false);
  if (!milestone) return null;

  const dismiss = () => {
    claimMilestone(milestone);
    onOpenChange(false);
  };

  const share = async () => {
    setSharing(true);
    const text = buildMilestoneShareText(userName, milestone);
    try {
      if (navigator.share) {
        await navigator.share({ title: "心事 Bestie 微光里程碑", text });
        dismiss();
        return;
      }
      await navigator.clipboard.writeText(text);
      toast("成就文案已複製，可以去社群分享啦 ✨");
    } catch {
      toast("分享暫時失敗，稍後再試");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="self-care-milestone-dialog max-w-sm overflow-hidden rounded-3xl border-violet-200/50 bg-gradient-to-b from-amber-50/95 via-violet-50/90 to-stone-50/95 dark:border-violet-500/25 dark:from-amber-950/40 dark:via-violet-950/35 dark:to-stone-950/90">
        <span className="self-care-milestone-glow pointer-events-none absolute inset-0" aria-hidden />
        <DialogHeader className="relative z-[1]">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-amber-200/70 bg-white/60 text-3xl shadow-inner dark:border-amber-500/30 dark:bg-stone-900/50">
            {milestone.emoji}
          </div>
          <DialogTitle className="text-center font-display text-lg">微光里程碑解鎖</DialogTitle>
          <p className="text-center text-sm font-medium text-violet-800 dark:text-violet-200">
            {milestone.days} 日 · {milestone.title}
          </p>
          <DialogDescription className="text-center text-sm leading-relaxed">
            {milestoneThankYouMessage(userName, milestone)}
          </DialogDescription>
        </DialogHeader>
        <div className="relative z-[1] flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-2xl"
            disabled={sharing}
            onClick={() => void share()}
          >
            <Share2 className="size-4" aria-hidden />
            分享成就卡片到社群
          </Button>
          <Button type="button" className="w-full rounded-2xl" onClick={dismiss}>
            <Sparkles className="size-4" aria-hidden />
            收下獎勵
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
