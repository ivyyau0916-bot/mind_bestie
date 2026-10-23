import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SELF_CARE_COMPLETE_MESSAGE } from "@/lib/self-care-checkin";

type SelfCareCompleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SelfCareCompleteDialog({ open, onOpenChange }: SelfCareCompleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl border-violet-200/50 bg-gradient-to-b from-violet-50/90 to-stone-50/95 dark:border-violet-500/20 dark:from-violet-950/40 dark:to-stone-950/90">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-lg">微光已集滿 ✨</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap text-center text-sm leading-relaxed">
            {SELF_CARE_COMPLETE_MESSAGE}
          </DialogDescription>
        </DialogHeader>
        <Button className="w-full rounded-2xl" onClick={() => onOpenChange(false)}>
          攬住自己，繼續今日
        </Button>
      </DialogContent>
    </Dialog>
  );
}
